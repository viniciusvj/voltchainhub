// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title LuzToken
 * @notice ERC-1155 multitoken where 1 token = 1 kWh of verified energy.
 *         tokenId encodes: deviceId + timestamp_slot + sourceType
 *         Fee distribution: 98% seller, 1% treasury, 1% liquidity pool
 */
contract LuzToken is ERC1155, AccessControl, Pausable, ReentrancyGuard {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    /// @notice Treasury address receiving 1% fee on mints
    address public treasury;

    /// @notice Liquidity pool address receiving 1% fee on mints
    address public liquidityPool;

    /// @notice Fee in basis points (100 = 1%)
    uint256 public constant TREASURY_FEE_BPS = 100;
    uint256 public constant LIQUIDITY_FEE_BPS = 100;
    uint256 public constant BPS_DENOMINATOR = 10000;

    /// @notice Total supply per token ID
    mapping(uint256 => uint256) private _totalSupply;

    /// @notice Aggregate total supply across all token IDs
    uint256 public totalSupplyAll;

    // Energy source types
    uint8 public constant SOURCE_SOLAR = 0;
    uint8 public constant SOURCE_WIND = 1;
    uint8 public constant SOURCE_BATTERY = 2;
    uint8 public constant SOURCE_GRID = 3;

    event TokenMinted(address indexed to, uint256 indexed tokenId, uint256 amount);
    event TokenBurned(address indexed from, uint256 indexed tokenId, uint256 amount);
    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);
    event LiquidityPoolUpdated(address indexed oldPool, address indexed newPool);
    event FeesDistributed(
        uint256 indexed tokenId,
        uint256 sellerAmount,
        uint256 treasuryAmount,
        uint256 liquidityAmount
    );

    error ZeroAddress();
    error InvalidAmount();
    error InvalidSourceType(uint8 sourceType);

    constructor(
        string memory uri_,
        address treasury_,
        address liquidityPool_,
        address admin
    ) ERC1155(uri_) {
        if (treasury_ == address(0) || liquidityPool_ == address(0) || admin == address(0)) {
            revert ZeroAddress();
        }

        treasury = treasury_;
        liquidityPool = liquidityPool_;

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MINTER_ROLE, admin);
        _grantRole(BURNER_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);
    }

    /**
     * @notice Encodes a tokenId from device address, time slot, and source type.
     * @param device Device address (ESP32-S3 owner)
     * @param slot Time slot (5-minute intervals since epoch)
     * @param sourceType Energy source: 0=solar, 1=wind, 2=battery, 3=grid
     * @return tokenId The deterministic keccak256 hash
     */
    function encodeTokenId(
        address device,
        uint32 slot,
        uint8 sourceType
    ) external pure returns (uint256) {
        if (sourceType > SOURCE_GRID) revert InvalidSourceType(sourceType);
        return uint256(keccak256(abi.encodePacked(device, slot, sourceType)));
    }

    /**
     * @notice Mints verified kWh tokens with automatic fee distribution.
     *         98% goes to the prosumer, 1% to treasury, 1% to liquidity pool.
     * @param to Prosumer address (energy generator)
     * @param tokenId Hash(deviceId, slot, source)
     * @param amount Total amount in Wh (1 token = 1000 Wh = 1 kWh)
     * @param data Optional metadata (IPFS hash)
     */
    function mint(
        address to,
        uint256 tokenId,
        uint256 amount,
        bytes calldata data
    ) external onlyRole(MINTER_ROLE) whenNotPaused nonReentrant {
        if (to == address(0)) revert ZeroAddress();
        if (amount == 0) revert InvalidAmount();

        uint256 treasuryFee = (amount * TREASURY_FEE_BPS) / BPS_DENOMINATOR;
        uint256 liquidityFee = (amount * LIQUIDITY_FEE_BPS) / BPS_DENOMINATOR;
        uint256 sellerAmount = amount - treasuryFee - liquidityFee;

        _mint(to, tokenId, sellerAmount, data);
        if (treasuryFee > 0) {
            _mint(treasury, tokenId, treasuryFee, data);
        }
        if (liquidityFee > 0) {
            _mint(liquidityPool, tokenId, liquidityFee, data);
        }

        _totalSupply[tokenId] += amount;
        totalSupplyAll += amount;

        emit FeesDistributed(tokenId, sellerAmount, treasuryFee, liquidityFee);
        emit TokenMinted(to, tokenId, amount);
    }

    /**
     * @notice Burns tokens after confirmed energy consumption.
     * @param from Address whose tokens are burned
     * @param tokenId Token ID to burn
     * @param amount Amount to burn
     */
    function burn(
        address from,
        uint256 tokenId,
        uint256 amount
    ) external onlyRole(BURNER_ROLE) whenNotPaused {
        if (from == address(0)) revert ZeroAddress();
        if (amount == 0) revert InvalidAmount();

        _burn(from, tokenId, amount);

        _totalSupply[tokenId] -= amount;
        totalSupplyAll -= amount;

        emit TokenBurned(from, tokenId, amount);
    }

    /**
     * @notice Returns total supply for a specific token ID.
     */
    function totalSupply(uint256 tokenId) external view returns (uint256) {
        return _totalSupply[tokenId];
    }

    /**
     * @notice Updates treasury address.
     */
    function setTreasury(address newTreasury) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (newTreasury == address(0)) revert ZeroAddress();
        address old = treasury;
        treasury = newTreasury;
        emit TreasuryUpdated(old, newTreasury);
    }

    /**
     * @notice Updates liquidity pool address.
     */
    function setLiquidityPool(address newPool) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (newPool == address(0)) revert ZeroAddress();
        address old = liquidityPool;
        liquidityPool = newPool;
        emit LiquidityPoolUpdated(old, newPool);
    }

    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    /**
     * @notice Required override for AccessControl + ERC1155.
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC1155, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
