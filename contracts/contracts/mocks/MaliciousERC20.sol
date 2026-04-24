// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "../VoltMarketplace.sol";

/**
 * @dev ERC-20 that attempts to re-enter VoltMarketplace.settle() during a
 *      transfer. Used only to verify the ReentrancyGuard in the marketplace.
 *      Triggered via a flag: when `reenterOn` is set, the next transferFrom
 *      re-enters settle() before returning.
 */
contract MaliciousERC20 is ERC20 {
    VoltMarketplace public target;
    bool public reenterOn;

    // Args that the reentrant call will use — set once before triggering
    bytes32 public orderId;
    address public buyerAddr;
    address public sellerAddr;
    address public payToken;
    address public receiveToken;
    uint256 public grossAmount;
    uint256 public minReceive;

    constructor() ERC20("Malicious", "MAL") {}

    function setTarget(VoltMarketplace t) external { target = t; }
    function arm(
        bytes32 _orderId,
        address _buyer,
        address _seller,
        address _pay,
        address _receive,
        uint256 _gross,
        uint256 _min
    ) external {
        orderId = _orderId;
        buyerAddr = _buyer;
        sellerAddr = _seller;
        payToken = _pay;
        receiveToken = _receive;
        grossAmount = _gross;
        minReceive = _min;
        reenterOn = true;
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    function _update(address from, address to, uint256 value) internal override {
        if (reenterOn && address(target) != address(0) && from != address(0) && to != address(0)) {
            reenterOn = false; // only attempt once
            // Attempt re-entry; should revert via nonReentrant
            target.settle(orderId, buyerAddr, sellerAddr, payToken, receiveToken, grossAmount, minReceive);
        }
        super._update(from, to, value);
    }
}
