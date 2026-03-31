// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IDeviceRegistry {
    function isDeviceActive(bytes32 deviceId) external view returns (bool);
    function incrementNonce(bytes32 deviceId) external;
    function deviceNonces(bytes32 deviceId) external view returns (uint256);
}

interface ILuzToken {
    function mint(address to, uint256 tokenId, uint256 amount, bytes calldata data) external;
    function encodeTokenId(address device, uint32 slot, uint8 sourceType) external pure returns (uint256);
}

/**
 * @title EnergyOracle
 * @notice Bridge between physical energy measurements and on-chain state.
 *         Supports multi-oracle quorum for large readings (>100 kWh),
 *         30-minute contestation window, and anomaly detection.
 */
contract EnergyOracle is AccessControl, Pausable, ReentrancyGuard {
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    /// @notice Threshold above which multi-oracle quorum is required (100 kWh = 100000 Wh)
    uint256 public quorumThreshold = 100_000;

    /// @notice Number of oracle confirmations needed for high-value readings
    uint256 public quorumRequired = 3;

    /// @notice Contestation window duration (30 minutes)
    uint256 public constant CONTESTATION_WINDOW = 30 minutes;

    /// @notice Maximum deviation from average for anomaly detection (200% = 3x average)
    uint256 public anomalyThresholdBps = 20000;

    /// @notice Device registry contract
    IDeviceRegistry public deviceRegistry;

    /// @notice LuzToken contract for minting
    ILuzToken public luzToken;

    enum ReadingStatus { Pending, Confirmed, Contested, Rejected, Minted }

    struct Reading {
        bytes32 deviceId;
        uint256 wattHours;
        uint64 timestamp;
        uint32 slot;
        uint8 sourceType;
        address submitter;
        uint64 submittedAt;
        ReadingStatus status;
        uint256 confirmations;
        bytes signature;
    }

    /// @notice All readings by readingId
    mapping(bytes32 => Reading) public readings;

    /// @notice Oracle confirmations per reading
    mapping(bytes32 => mapping(address => bool)) public oracleConfirmations;

    /// @notice Contestation info
    mapping(bytes32 => address) public contesters;
    mapping(bytes32 => bytes) public contestEvidence;

    /// @notice Device reading history for anomaly detection (rolling average Wh)
    mapping(bytes32 => uint256) public deviceAvgWh;
    mapping(bytes32 => uint256) public deviceReadingCount;

    /// @notice Total readings submitted
    uint256 public totalReadings;

    event ReadingSubmitted(bytes32 indexed readingId, bytes32 indexed deviceId, uint256 wh);
    event ReadingConfirmed(bytes32 indexed readingId);
    event ReadingContested(bytes32 indexed readingId, address contester);
    event ReadingRejected(bytes32 indexed readingId, string reason);
    event ReadingMinted(bytes32 indexed readingId, uint256 tokenId, uint256 amount);
    event AnomalyDetected(bytes32 indexed readingId, bytes32 indexed deviceId, uint256 wh, uint256 avgWh);
    event QuorumThresholdUpdated(uint256 oldThreshold, uint256 newThreshold);
    event QuorumRequiredUpdated(uint256 oldRequired, uint256 newRequired);

    error ReadingAlreadyExists(bytes32 readingId);
    error ReadingNotFound(bytes32 readingId);
    error ReadingNotPending(bytes32 readingId);
    error DeviceNotActive(bytes32 deviceId);
    error ContestationWindowClosed(bytes32 readingId);
    error ContestationWindowOpen(bytes32 readingId);
    error AlreadyConfirmed(bytes32 readingId, address oracle);
    error InvalidReading();
    error ZeroAddress();

    constructor(
        address deviceRegistry_,
        address luzToken_,
        address admin
    ) {
        if (deviceRegistry_ == address(0) || luzToken_ == address(0) || admin == address(0)) {
            revert ZeroAddress();
        }

        deviceRegistry = IDeviceRegistry(deviceRegistry_);
        luzToken = ILuzToken(luzToken_);

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ORACLE_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);
    }

    /**
     * @notice Computes a unique reading ID from device + slot + source.
     */
    function computeReadingId(
        bytes32 deviceId,
        uint32 slot,
        uint8 sourceType
    ) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(deviceId, slot, sourceType));
    }

    /**
     * @notice Submits a signed energy reading from an edge node oracle.
     * @dev For readings <= quorumThreshold, a single oracle submission suffices.
     *      For readings > quorumThreshold, multi-oracle confirmation is required.
     */
    function submitReading(
        bytes32 deviceId,
        uint256 wattHours,
        uint64 timestamp,
        uint32 slot,
        uint8 sourceType,
        bytes calldata signature
    ) external onlyRole(ORACLE_ROLE) whenNotPaused nonReentrant {
        if (wattHours == 0 || signature.length == 0) revert InvalidReading();
        if (!deviceRegistry.isDeviceActive(deviceId)) revert DeviceNotActive(deviceId);

        bytes32 readingId = computeReadingId(deviceId, slot, sourceType);
        if (readings[readingId].submittedAt != 0) revert ReadingAlreadyExists(readingId);

        // Anomaly detection: check against rolling average
        _checkAnomaly(readingId, deviceId, wattHours);

        readings[readingId] = Reading({
            deviceId: deviceId,
            wattHours: wattHours,
            timestamp: timestamp,
            slot: slot,
            sourceType: sourceType,
            submitter: msg.sender,
            submittedAt: uint64(block.timestamp),
            status: ReadingStatus.Pending,
            confirmations: 1,
            signature: signature
        });

        oracleConfirmations[readingId][msg.sender] = true;
        totalReadings++;

        // Update rolling average
        _updateAverage(deviceId, wattHours);

        // Increment device nonce
        deviceRegistry.incrementNonce(deviceId);

        emit ReadingSubmitted(readingId, deviceId, wattHours);

        // Auto-confirm if below quorum threshold (single oracle sufficient)
        if (wattHours <= quorumThreshold) {
            readings[readingId].status = ReadingStatus.Confirmed;
            emit ReadingConfirmed(readingId);
        }
    }

    /**
     * @notice Confirms a reading as part of multi-oracle quorum.
     *         Required for readings > quorumThreshold (100 kWh).
     * @param readingId The reading to confirm
     * @param oracleSig Oracle's signature attesting the reading
     */
    function confirmReading(
        bytes32 readingId,
        bytes calldata oracleSig
    ) external onlyRole(ORACLE_ROLE) whenNotPaused {
        Reading storage reading = readings[readingId];
        if (reading.submittedAt == 0) revert ReadingNotFound(readingId);
        if (reading.status != ReadingStatus.Pending) revert ReadingNotPending(readingId);
        if (oracleConfirmations[readingId][msg.sender]) {
            revert AlreadyConfirmed(readingId, msg.sender);
        }
        if (oracleSig.length == 0) revert InvalidReading();

        oracleConfirmations[readingId][msg.sender] = true;
        reading.confirmations++;

        if (reading.confirmations >= quorumRequired) {
            reading.status = ReadingStatus.Confirmed;
            emit ReadingConfirmed(readingId);
        }
    }

    /**
     * @notice Contests a reading within the 30-minute contestation window.
     *         Any participant with evidence can contest.
     * @param readingId The reading to contest
     * @param evidence Encoded evidence supporting the contestation
     */
    function contestReading(
        bytes32 readingId,
        bytes calldata evidence
    ) external whenNotPaused {
        Reading storage reading = readings[readingId];
        if (reading.submittedAt == 0) revert ReadingNotFound(readingId);
        if (reading.status == ReadingStatus.Rejected || reading.status == ReadingStatus.Minted) {
            revert ReadingNotPending(readingId);
        }
        if (block.timestamp > reading.submittedAt + CONTESTATION_WINDOW) {
            revert ContestationWindowClosed(readingId);
        }

        reading.status = ReadingStatus.Contested;
        contesters[readingId] = msg.sender;
        contestEvidence[readingId] = evidence;

        emit ReadingContested(readingId, msg.sender);
    }

    /**
     * @notice Resolves a contested reading. Admin decides accept or reject.
     * @param readingId The contested reading
     * @param accept True to accept the reading, false to reject
     */
    function resolveContestation(
        bytes32 readingId,
        bool accept
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        Reading storage reading = readings[readingId];
        if (reading.submittedAt == 0) revert ReadingNotFound(readingId);

        if (accept) {
            reading.status = ReadingStatus.Confirmed;
            emit ReadingConfirmed(readingId);
        } else {
            reading.status = ReadingStatus.Rejected;
            emit ReadingRejected(readingId, "Contestation upheld");
        }
    }

    /**
     * @notice Finalizes a confirmed reading by minting LuzTokens.
     *         Can only be called after the contestation window has passed.
     * @param readingId The confirmed reading to mint
     * @param deviceOwner Address of the prosumer who owns the device
     */
    function mintFromReading(
        bytes32 readingId,
        address deviceOwner
    ) external onlyRole(ORACLE_ROLE) whenNotPaused nonReentrant {
        Reading storage reading = readings[readingId];
        if (reading.submittedAt == 0) revert ReadingNotFound(readingId);
        if (reading.status != ReadingStatus.Confirmed) revert ReadingNotPending(readingId);
        if (block.timestamp <= reading.submittedAt + CONTESTATION_WINDOW) {
            revert ContestationWindowOpen(readingId);
        }
        if (deviceOwner == address(0)) revert ZeroAddress();

        // Compute token ID matching LuzToken encoding
        uint256 tokenId = luzToken.encodeTokenId(
            deviceOwner,
            reading.slot,
            reading.sourceType
        );

        // Mint via LuzToken (which handles fee distribution)
        luzToken.mint(deviceOwner, tokenId, reading.wattHours, "");

        reading.status = ReadingStatus.Minted;

        emit ReadingMinted(readingId, tokenId, reading.wattHours);
    }

    /**
     * @notice Checks for anomalous readings based on device history.
     */
    function _checkAnomaly(
        bytes32 readingId,
        bytes32 deviceId,
        uint256 wattHours
    ) internal {
        uint256 avgWh = deviceAvgWh[deviceId];
        uint256 count = deviceReadingCount[deviceId];

        // Skip anomaly check for first 5 readings (insufficient history)
        if (count < 5) return;

        // Flag if reading exceeds anomaly threshold of the average
        if (avgWh > 0 && wattHours > (avgWh * anomalyThresholdBps) / 10000) {
            emit AnomalyDetected(readingId, deviceId, wattHours, avgWh);
        }
    }

    /**
     * @notice Updates the rolling average for a device.
     */
    function _updateAverage(bytes32 deviceId, uint256 wattHours) internal {
        uint256 count = deviceReadingCount[deviceId];
        uint256 currentAvg = deviceAvgWh[deviceId];

        // Exponential moving average with weight on recent readings
        if (count == 0) {
            deviceAvgWh[deviceId] = wattHours;
        } else {
            deviceAvgWh[deviceId] = (currentAvg * count + wattHours) / (count + 1);
        }
        deviceReadingCount[deviceId] = count + 1;
    }

    /**
     * @notice Returns full reading data.
     */
    function getReading(bytes32 readingId) external view returns (
        bytes32 deviceId,
        uint256 wattHours,
        uint64 timestamp,
        uint32 slot,
        ReadingStatus status,
        uint256 confirmations
    ) {
        Reading storage r = readings[readingId];
        if (r.submittedAt == 0) revert ReadingNotFound(readingId);
        return (r.deviceId, r.wattHours, r.timestamp, r.slot, r.status, r.confirmations);
    }

    // --- Admin functions ---

    function setQuorumThreshold(uint256 newThreshold) external onlyRole(DEFAULT_ADMIN_ROLE) {
        uint256 old = quorumThreshold;
        quorumThreshold = newThreshold;
        emit QuorumThresholdUpdated(old, newThreshold);
    }

    function setQuorumRequired(uint256 newRequired) external onlyRole(DEFAULT_ADMIN_ROLE) {
        uint256 old = quorumRequired;
        quorumRequired = newRequired;
        emit QuorumRequiredUpdated(old, newRequired);
    }

    function setAnomalyThreshold(uint256 newThresholdBps) external onlyRole(DEFAULT_ADMIN_ROLE) {
        anomalyThresholdBps = newThresholdBps;
    }

    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }
}
