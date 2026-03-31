// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";

/**
 * @title EnergyVault
 * @notice P2P escrow for energy trades on VoltchainHub.
 *         Buyer locks MATIC, seller's LuzTokens are held in escrow.
 *         After delivery confirmation, tokens go to buyer and MATIC to seller.
 */
contract EnergyVault is AccessControl, Pausable, ReentrancyGuard, ERC1155Holder {
    bytes32 public constant ARBITER_ROLE = keccak256("ARBITER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    IERC1155 public luzToken;

    enum TradeStatus { Pending, Locked, Delivered, Settled, Expired, Disputed }

    struct Trade {
        address seller;
        address buyer;
        uint256 tokenId;
        uint256 energyAmount;   // In Wh
        uint256 pricePerKwh;    // In wei (MATIC, 18 decimals)
        uint256 maticLocked;    // Actual MATIC locked by buyer
        uint64 deadline;        // Expiration timestamp
        TradeStatus status;
    }

    /// @notice All trades by tradeId
    mapping(bytes32 => Trade) public trades;

    /// @notice Trade counter for unique IDs
    uint256 public tradeCount;

    /// @notice Dispute reasons
    mapping(bytes32 => string) public disputeReasons;

    event TradeLocked(bytes32 indexed tradeId, address indexed seller, address indexed buyer, uint256 amount);
    event DeliveryConfirmed(bytes32 indexed tradeId);
    event TradeSettled(bytes32 indexed tradeId, uint256 energyWh, uint256 valueMatic);
    event TradeDisputed(bytes32 indexed tradeId, string reason);
    event TradeExpired(bytes32 indexed tradeId);
    event DisputeResolved(bytes32 indexed tradeId, bool sellerWins);

    error ZeroAddress();
    error InvalidAmount();
    error InsufficientPayment(uint256 required, uint256 sent);
    error TradeNotFound(bytes32 tradeId);
    error InvalidTradeStatus(bytes32 tradeId, TradeStatus current, TradeStatus expected);
    error NotTradeParticipant(bytes32 tradeId);
    error TradeNotExpired(bytes32 tradeId);
    error DeadlineInPast();

    constructor(address luzToken_, address admin) {
        if (luzToken_ == address(0) || admin == address(0)) revert ZeroAddress();

        luzToken = IERC1155(luzToken_);

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ARBITER_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);
    }

    /**
     * @notice Creates and locks a P2P energy trade escrow.
     *         Buyer sends MATIC. Seller must have approved this contract
     *         to transfer their LuzTokens (ERC-1155 setApprovalForAll).
     * @param seller Address of the energy seller
     * @param tokenId LuzToken token ID for the energy being traded
     * @param energyAmount Energy amount in Wh
     * @param pricePerKwh Price per kWh in wei (MATIC)
     * @param deliveryDeadline Unix timestamp after which trade can expire
     * @return tradeId Unique identifier for this trade
     */
    function lockTrade(
        address seller,
        uint256 tokenId,
        uint256 energyAmount,
        uint256 pricePerKwh,
        uint64 deliveryDeadline
    ) external payable whenNotPaused nonReentrant returns (bytes32 tradeId) {
        if (seller == address(0)) revert ZeroAddress();
        if (energyAmount == 0 || pricePerKwh == 0) revert InvalidAmount();
        if (deliveryDeadline <= block.timestamp) revert DeadlineInPast();

        // Calculate required MATIC: (energyAmount / 1000) * pricePerKwh
        // energyAmount is in Wh, pricePerKwh is per kWh (1000 Wh)
        uint256 requiredMatic = (energyAmount * pricePerKwh) / 1000;
        if (msg.value < requiredMatic) {
            revert InsufficientPayment(requiredMatic, msg.value);
        }

        tradeCount++;
        tradeId = keccak256(abi.encodePacked(seller, msg.sender, tokenId, tradeCount, block.timestamp));

        // Transfer seller's LuzTokens into escrow
        luzToken.safeTransferFrom(seller, address(this), tokenId, energyAmount, "");

        trades[tradeId] = Trade({
            seller: seller,
            buyer: msg.sender,
            tokenId: tokenId,
            energyAmount: energyAmount,
            pricePerKwh: pricePerKwh,
            maticLocked: requiredMatic,
            deadline: deliveryDeadline,
            status: TradeStatus.Locked
        });

        // Refund excess MATIC
        uint256 excess = msg.value - requiredMatic;
        if (excess > 0) {
            (bool sent, ) = msg.sender.call{value: excess}("");
            require(sent, "Refund failed");
        }

        emit TradeLocked(tradeId, seller, msg.sender, energyAmount);
    }

    /**
     * @notice Confirms energy delivery. Called by the buyer (or their OpenEMS agent).
     * @param tradeId The trade to confirm delivery for
     */
    function confirmDelivery(bytes32 tradeId) external whenNotPaused {
        Trade storage trade = trades[tradeId];
        _requireExists(tradeId);
        _requireStatus(tradeId, TradeStatus.Locked);

        if (msg.sender != trade.buyer) revert NotTradeParticipant(tradeId);

        trade.status = TradeStatus.Delivered;
        emit DeliveryConfirmed(tradeId);
    }

    /**
     * @notice Settles a trade after delivery confirmation.
     *         Transfers LuzTokens to buyer and MATIC to seller.
     *         Can be called by either party.
     * @param tradeId The trade to settle
     */
    function settleTrade(bytes32 tradeId) external whenNotPaused nonReentrant {
        Trade storage trade = trades[tradeId];
        _requireExists(tradeId);
        _requireStatus(tradeId, TradeStatus.Delivered);

        if (msg.sender != trade.buyer && msg.sender != trade.seller) {
            revert NotTradeParticipant(tradeId);
        }

        trade.status = TradeStatus.Settled;

        // Transfer LuzTokens from escrow to buyer
        luzToken.safeTransferFrom(address(this), trade.buyer, trade.tokenId, trade.energyAmount, "");

        // Transfer MATIC to seller
        (bool sent, ) = trade.seller.call{value: trade.maticLocked}("");
        require(sent, "MATIC transfer failed");

        emit TradeSettled(tradeId, trade.energyAmount, trade.maticLocked);
    }

    /**
     * @notice Opens a dispute for manual/DAO resolution.
     *         Can be called by buyer or seller while trade is Locked.
     * @param tradeId The trade to dispute
     * @param reason Human-readable dispute reason
     */
    function disputeTrade(bytes32 tradeId, string calldata reason) external whenNotPaused {
        Trade storage trade = trades[tradeId];
        _requireExists(tradeId);

        if (trade.status != TradeStatus.Locked && trade.status != TradeStatus.Delivered) {
            revert InvalidTradeStatus(tradeId, trade.status, TradeStatus.Locked);
        }
        if (msg.sender != trade.buyer && msg.sender != trade.seller) {
            revert NotTradeParticipant(tradeId);
        }

        trade.status = TradeStatus.Disputed;
        disputeReasons[tradeId] = reason;

        emit TradeDisputed(tradeId, reason);
    }

    /**
     * @notice Resolves a dispute. Arbiter decides who wins.
     * @param tradeId The disputed trade
     * @param sellerWins If true, seller gets MATIC + tokens returned. If false, buyer gets both.
     */
    function resolveDispute(
        bytes32 tradeId,
        bool sellerWins
    ) external onlyRole(ARBITER_ROLE) nonReentrant {
        Trade storage trade = trades[tradeId];
        _requireExists(tradeId);
        _requireStatus(tradeId, TradeStatus.Disputed);

        trade.status = TradeStatus.Settled;

        if (sellerWins) {
            // Return tokens to seller, send MATIC to seller
            luzToken.safeTransferFrom(address(this), trade.seller, trade.tokenId, trade.energyAmount, "");
            (bool sent, ) = trade.seller.call{value: trade.maticLocked}("");
            require(sent, "MATIC transfer failed");
        } else {
            // Send tokens to buyer, return MATIC to buyer
            luzToken.safeTransferFrom(address(this), trade.buyer, trade.tokenId, trade.energyAmount, "");
            (bool sent, ) = trade.buyer.call{value: trade.maticLocked}("");
            require(sent, "MATIC transfer failed");
        }

        emit DisputeResolved(tradeId, sellerWins);
    }

    /**
     * @notice Expires a trade that passed its deadline without delivery confirmation.
     *         Returns tokens to seller and MATIC to buyer.
     * @param tradeId The trade to expire
     */
    function expireTrade(bytes32 tradeId) external whenNotPaused nonReentrant {
        Trade storage trade = trades[tradeId];
        _requireExists(tradeId);
        _requireStatus(tradeId, TradeStatus.Locked);

        if (block.timestamp <= trade.deadline) revert TradeNotExpired(tradeId);

        trade.status = TradeStatus.Expired;

        // Return tokens to seller
        luzToken.safeTransferFrom(address(this), trade.seller, trade.tokenId, trade.energyAmount, "");

        // Return MATIC to buyer
        (bool sent, ) = trade.buyer.call{value: trade.maticLocked}("");
        require(sent, "MATIC refund failed");

        emit TradeExpired(tradeId);
    }

    /**
     * @notice Returns trade information.
     */
    function getTrade(bytes32 tradeId) external view returns (Trade memory) {
        _requireExists(tradeId);
        return trades[tradeId];
    }

    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function _requireExists(bytes32 tradeId) internal view {
        if (trades[tradeId].seller == address(0)) revert TradeNotFound(tradeId);
    }

    function _requireStatus(bytes32 tradeId, TradeStatus expected) internal view {
        if (trades[tradeId].status != expected) {
            revert InvalidTradeStatus(tradeId, trades[tradeId].status, expected);
        }
    }

    /**
     * @notice Required override for ERC1155Holder + AccessControl.
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(AccessControl, ERC1155Holder)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
