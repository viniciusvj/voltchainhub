// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

import "./TokenRegistry.sol";

/// @notice Minimal interface for Uniswap v3 SwapRouter (ISwapRouter)
interface ISwapRouter {
    struct ExactInputSingleParams {
        address tokenIn;
        address tokenOut;
        uint24 fee;
        address recipient;
        uint256 amountIn;
        uint256 amountOutMinimum;
        uint160 sqrtPriceLimitX96;
    }

    function exactInputSingle(ExactInputSingleParams calldata params)
        external
        payable
        returns (uint256 amountOut);
}

/**
 * @title VoltMarketplace
 * @notice Swap-and-settle marketplace for energy trades. Buyer pays in any
 *         whitelisted token; seller receives in the token of their choice.
 *         Protocol retains a 0.5% fee on the buyer-side token (pre-swap).
 *
 * @dev The seller's payment preference is captured per-order (the frontend
 *      reads it from a backend service and embeds it in the order). No global
 *      per-user storage on-chain — keeps gas predictable.
 *
 *      This contract DOES NOT handle the LuzToken transfer itself; that is
 *      done by EnergyVault. VoltMarketplace is strictly about the *payment*
 *      side. The two are composed at the vault level.
 */
contract VoltMarketplace is AccessControl, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 public constant FEE_MANAGER_ROLE = keccak256("FEE_MANAGER_ROLE");

    TokenRegistry public immutable registry;
    ISwapRouter public immutable swapRouter;

    /// @notice Protocol fee in basis points (50 = 0.5%)
    uint256 public feeBps = 50;
    uint256 public constant MAX_FEE_BPS = 200; // hard cap at 2%
    uint256 public constant BPS_DENOMINATOR = 10000;

    /// @notice Address receiving the protocol fee
    address public treasury;

    /// @notice Default Uniswap v3 pool fee tier when routing (3000 = 0.3%)
    uint24 public defaultPoolFee = 3000;

    struct Settlement {
        address buyer;
        address seller;
        address payToken;          // token buyer paid with
        address receiveToken;      // token seller wants to receive
        uint256 grossAmount;       // buyer payment, pre-fee
        uint256 feeAmount;         // protocol fee, in payToken
        uint256 sellerReceived;    // amount seller received, in receiveToken
        uint64  settledAt;
    }

    event PaymentSettled(
        bytes32 indexed orderId,
        address indexed buyer,
        address indexed seller,
        Settlement settlement
    );
    event FeeUpdated(uint256 oldBps, uint256 newBps);
    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);
    event PoolFeeUpdated(uint24 oldPoolFee, uint24 newPoolFee);

    error ZeroAddress();
    error ZeroAmount();
    error UnsupportedToken(address token);
    error FeeAboveMaximum(uint256 requested, uint256 maximum);
    error SlippageTooHigh(uint256 received, uint256 minExpected);
    error OnlyEOAOrOperator();

    constructor(
        address admin,
        address treasury_,
        TokenRegistry registry_,
        ISwapRouter swapRouter_
    ) {
        if (admin == address(0) || treasury_ == address(0)) revert ZeroAddress();
        if (address(registry_) == address(0) || address(swapRouter_) == address(0)) {
            revert ZeroAddress();
        }

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(OPERATOR_ROLE, admin);
        _grantRole(FEE_MANAGER_ROLE, admin);

        treasury = treasury_;
        registry = registry_;
        swapRouter = swapRouter_;
    }

    /**
     * @notice Settle a payment leg of an energy trade.
     * @dev Must be called by an OPERATOR (EnergyVault or equivalent) holding
     *      the buyer's payToken balance approved to this contract.
     *
     * @param orderId       External identifier (off-chain matching engine).
     * @param buyer         Buyer address (for event, not used for transfers).
     * @param seller        Recipient of the settlement.
     * @param payToken      Token buyer is paying with.
     * @param receiveToken  Token seller wants to receive.
     * @param grossAmount   Amount the buyer is paying (pre-fee, in payToken).
     * @param minReceiveAmount  Minimum acceptable amount in receiveToken (slippage guard).
     */
    function settle(
        bytes32 orderId,
        address buyer,
        address seller,
        address payToken,
        address receiveToken,
        uint256 grossAmount,
        uint256 minReceiveAmount
    )
        external
        nonReentrant
        whenNotPaused
        onlyRole(OPERATOR_ROLE)
        returns (uint256 sellerReceived)
    {
        if (buyer == address(0) || seller == address(0)) revert ZeroAddress();
        if (grossAmount == 0) revert ZeroAmount();
        if (!registry.isSupported(payToken)) revert UnsupportedToken(payToken);
        if (!registry.isSupported(receiveToken)) revert UnsupportedToken(receiveToken);

        // 1. Pull gross amount from operator (who already holds buyer funds)
        IERC20(payToken).safeTransferFrom(msg.sender, address(this), grossAmount);

        // 2. Retain fee in payToken and forward to treasury
        uint256 feeAmount = (grossAmount * feeBps) / BPS_DENOMINATOR;
        if (feeAmount > 0) {
            IERC20(payToken).safeTransfer(treasury, feeAmount);
        }
        uint256 netAmount = grossAmount - feeAmount;

        // 3. Route to seller
        if (payToken == receiveToken) {
            IERC20(payToken).safeTransfer(seller, netAmount);
            sellerReceived = netAmount;
        } else {
            sellerReceived = _swapAndForward(
                payToken,
                receiveToken,
                netAmount,
                minReceiveAmount,
                seller
            );
        }

        if (sellerReceived < minReceiveAmount) {
            revert SlippageTooHigh(sellerReceived, minReceiveAmount);
        }

        emit PaymentSettled(
            orderId,
            buyer,
            seller,
            Settlement({
                buyer: buyer,
                seller: seller,
                payToken: payToken,
                receiveToken: receiveToken,
                grossAmount: grossAmount,
                feeAmount: feeAmount,
                sellerReceived: sellerReceived,
                settledAt: uint64(block.timestamp)
            })
        );
    }

    function _swapAndForward(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOutMinimum,
        address recipient
    ) internal returns (uint256 amountOut) {
        IERC20(tokenIn).forceApprove(address(swapRouter), amountIn);

        amountOut = swapRouter.exactInputSingle(
            ISwapRouter.ExactInputSingleParams({
                tokenIn: tokenIn,
                tokenOut: tokenOut,
                fee: defaultPoolFee,
                recipient: recipient,
                amountIn: amountIn,
                amountOutMinimum: amountOutMinimum,
                sqrtPriceLimitX96: 0
            })
        );
    }

    // --- Admin ---

    function setFeeBps(uint256 newFeeBps) external onlyRole(FEE_MANAGER_ROLE) {
        if (newFeeBps > MAX_FEE_BPS) revert FeeAboveMaximum(newFeeBps, MAX_FEE_BPS);
        emit FeeUpdated(feeBps, newFeeBps);
        feeBps = newFeeBps;
    }

    function setTreasury(address newTreasury) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (newTreasury == address(0)) revert ZeroAddress();
        emit TreasuryUpdated(treasury, newTreasury);
        treasury = newTreasury;
    }

    function setDefaultPoolFee(uint24 newPoolFee) external onlyRole(FEE_MANAGER_ROLE) {
        emit PoolFeeUpdated(defaultPoolFee, newPoolFee);
        defaultPoolFee = newPoolFee;
    }

    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
}
