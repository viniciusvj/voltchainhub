// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title TokenRegistry
 * @notice Whitelist of ERC-20 tokens accepted as payment currency in the
 *         VoltchainHub marketplace. Controlled by REGISTRAR_ROLE (multisig
 *         3/5 in phase 1, DAO from phase 3 onward).
 *
 * @dev Inclusion criteria (enforced off-chain by the registrar):
 *      - Minimum daily liquidity of USD 50,000 on Uniswap v3 Polygon
 *      - Publicly audited token contract
 *      - Not sanctioned (OFAC or equivalent)
 *      - Not a rebase/deflationary token (incompatible with escrow semantics)
 */
contract TokenRegistry is AccessControl {
    bytes32 public constant REGISTRAR_ROLE = keccak256("REGISTRAR_ROLE");

    enum Category {
        BRL_STABLE,
        USD_STABLE,
        NATIVE_WRAPPED,
        OTHER
    }

    struct TokenInfo {
        bool supported;
        Category category;
        uint16 decimals;
        string symbol;
        uint64 addedAt;
    }

    mapping(address => TokenInfo) public tokens;
    address[] private _tokenList;

    event TokenAdded(address indexed token, Category category, string symbol);
    event TokenRemoved(address indexed token, string reason);

    error TokenAlreadySupported(address token);
    error TokenNotSupported(address token);
    error ZeroAddress();

    constructor(address admin) {
        if (admin == address(0)) revert ZeroAddress();
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(REGISTRAR_ROLE, admin);
    }

    function addToken(
        address token,
        Category category,
        uint16 decimals,
        string calldata symbol
    ) external onlyRole(REGISTRAR_ROLE) {
        if (token == address(0)) revert ZeroAddress();
        if (tokens[token].supported) revert TokenAlreadySupported(token);

        tokens[token] = TokenInfo({
            supported: true,
            category: category,
            decimals: decimals,
            symbol: symbol,
            addedAt: uint64(block.timestamp)
        });
        _tokenList.push(token);

        emit TokenAdded(token, category, symbol);
    }

    function removeToken(address token, string calldata reason) external onlyRole(REGISTRAR_ROLE) {
        if (!tokens[token].supported) revert TokenNotSupported(token);

        tokens[token].supported = false;

        emit TokenRemoved(token, reason);
    }

    function isSupported(address token) external view returns (bool) {
        return tokens[token].supported;
    }

    function getCategory(address token) external view returns (Category) {
        if (!tokens[token].supported) revert TokenNotSupported(token);
        return tokens[token].category;
    }

    function listAll() external view returns (address[] memory) {
        return _tokenList;
    }
}
