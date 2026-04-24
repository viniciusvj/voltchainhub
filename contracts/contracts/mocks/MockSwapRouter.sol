// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "../VoltMarketplace.sol";

/**
 * @dev Test-only fake Uniswap v3 SwapRouter.
 *      Applies a deterministic conversion rate configured by the test,
 *      pulls `amountIn` of tokenIn from msg.sender, mints/transfers
 *      `amountIn * rate / 1e18` of tokenOut to `recipient`.
 *      Uses MockERC20 helper for minting the output — test must pre-fund
 *      this router with a large balance of tokenOut, OR the tokenOut
 *      contract must allow this router to call mint().
 */
contract MockSwapRouter is ISwapRouter {
    using SafeERC20 for IERC20;

    /// @notice rate is tokenOut per tokenIn, scaled 1e18 (so 1e18 == 1:1)
    uint256 public rate = 1e18;

    /// @notice if true, next swap returns zero (simulates pool failure)
    bool public failNext;

    function setRate(uint256 r) external { rate = r; }
    function setFailNext(bool f) external { failNext = f; }

    function exactInputSingle(ExactInputSingleParams calldata params)
        external
        payable
        returns (uint256 amountOut)
    {
        IERC20(params.tokenIn).safeTransferFrom(msg.sender, address(this), params.amountIn);

        if (failNext) {
            failNext = false;
            amountOut = 0;
        } else {
            amountOut = (params.amountIn * rate) / 1e18;
        }

        IERC20(params.tokenOut).safeTransfer(params.recipient, amountOut);
    }
}
