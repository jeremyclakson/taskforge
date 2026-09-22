// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Address.sol";

/// @title AgentTaskEscrow
/// @notice Smart contract escrow for task payments with dispute resolution
/// @dev Supports multiple tokens across chains. Funds locked until resolution.
contract AgentTaskEscrow is Ownable, ReentrancyGuard {
    // ============================================================
    // Types
    // ============================================================

    struct Escrow {
        address publisher;
        address worker;
        address token;
        uint256 amount;
        uint64 fundedAt;
        uint64 deadline;
        EscrowStatus status;
        string[] evidenceUrls;
        address arbitrator;
    }

    enum EscrowStatus {
        Funded,
        Released,
        Refunded,
        Disputed,
        Expired
    }

    // ============================================================
    // State
    // ============================================================

    mapping(bytes32 => Escrow) public escrows;
    address public escrowAdmin;
    address public platformFeeRecipient;
    uint32 public platformFeeBps = 500; // 5%

    // ============================================================
    // Events
    // ============================================================

    event EscrowFunded(bytes32 indexed escrowId, address indexed publisher, address indexed worker, address token, uint256 amount);
    event EscrowReleased(bytes32 indexed escrowId, uint256 amount, uint256 platformFee, uint256 workerAmount);
    event EscrowRefunded(bytes32 indexed escrowId, uint256 amount);
    event EscrowDisputed(bytes32 indexed escrowId, address indexed disputer, string evidenceUrl);
    event EscrowExpired(bytes32 indexed escrowId);
    event ArbitratorAssigned(bytes32 indexed escrowId, address indexed arbitrator);
    event ArbitrationResolved(bytes32 indexed escrowId, address winner, string reason);
    event AdminUpdated(address indexed newAdmin);
    event PlatformFeeRecipientUpdated(address indexed newRecipient);
    event PlatformFeeBpsUpdated(uint32 newBps);

    // ============================================================
    // Errors
    // ============================================================

    error EscrowNotFound();
    error EscrowNotFunded();
    error EscrowNotDisputed();
    error NotPublisher();
    error NotWorker();
    error NotArbitrator();
    error NotAdmin();
    error TokenTransferFailed();
    error DeadlineNotSet();
    error AlreadyUsed();
    error EvidenceLimitReached();

    // ============================================================
    // Modifiers
    // ============================================================

    modifier onlyAdmin() {
        if (msg.sender != escrowAdmin && msg.sender != owner()) revert NotAdmin();
        _;
    }

    modifier onlyPublisher(bytes32 escrowId) {
        if (msg.sender != escrows[escrowId].publisher) revert NotPublisher();
        _;
    }

    modifier onlyWorker(bytes32 escrowId) {
        if (msg.sender != escrows[escrowId].worker) revert NotWorker();
        _;
    }

    modifier onlyArbitrator(bytes32 escrowId) {
        Escrow storage escrow = escrows[escrowId];
        if (msg.sender != escrow.arbitrator) revert NotArbitrator();
        _;
    }

    // ============================================================
    // Constructor
    // ============================================================

    constructor(address _escrowAdmin, address _platformFeeRecipient) {
        escrowAdmin = _escrowAdmin;
        platformFeeRecipient = _platformFeeRecipient;
        emit AdminUpdated(_escrowAdmin);
        emit PlatformFeeRecipientUpdated(_platformFeeRecipient);
    }

    // ============================================================
    // Views
    // ============================================================

    function getEscrow(bytes32 escrowId) external view returns (Escrow memory) {
        return escrows[escrowId];
    }

    function getEscrowStatus(bytes32 escrowId) external view returns (EscrowStatus) {
        Escrow storage escrow = escrows[escrowId];
        if (escrow.publisher == address(0)) return EscrowStatus.Expired;
        if (escrow.status == EscrowStatus.Funded && block.timestamp > escrow.deadline) {
            return EscrowStatus.Expired;
        }
        return escrow.status;
    }

    function calculateFees(uint256 amount) public view returns (uint256 platformFee, uint256 workerAmount) {
        platformFee = (amount * platformFeeBps) / 10000;
        workerAmount = amount - platformFee;
    }

    // ============================================================
    // Public Functions
    // ============================================================

    /// @notice Fund a new escrow
    /// @param escrowId Unique identifier for the task
    /// @param worker Worker address to receive funds
    /// @param token ERC20 token address
    /// @param amount Amount to escrow
    /// @param deadline Timestamp by which funds expire
    function fund(bytes32 escrowId, address worker, address token, uint256 amount, uint64 deadline)
        external
        nonReentrant
    {
        Escrow storage escrow = escrows[escrowId];
        if (escrow.publisher != address(0)) revert AlreadyUsed();

        if (deadline <= block.timestamp) revert DeadlineNotSet();

        escrow.publisher = msg.sender;
        escrow.worker = worker;
        escrow.token = token;
        escrow.amount = amount;
        escrow.fundedAt = uint64(block.timestamp);
        escrow.deadline = deadline;
        escrow.status = EscrowStatus.Funded;

        if (!IERC20(token).transferFrom(msg.sender, address(this), amount)) {
            revert TokenTransferFailed();
        }

        emit EscrowFunded(escrowId, msg.sender, worker, token, amount);
    }

    /// @notice Release escrow funds to worker (called by publisher)
    function release(bytes32 escrowId) external nonReentrant onlyPublisher(escrowId) {
        Escrow storage escrow = escrows[escrowId];
        if (escrow.status != EscrowStatus.Funded) revert EscrowNotFunded();

        escrow.status = EscrowStatus.Released;

        (uint256 platformFee, uint256 workerAmount) = calculateFees(escrow.amount);

        if (!IERC20(escrow.token).transfer(escrow.worker, workerAmount)) {
            revert TokenTransferFailed();
        }

        if (platformFee > 0 && !IERC20(escrow.token).transfer(platformFeeRecipient, platformFee)) {
            revert TokenTransferFailed();
        }

        emit EscrowReleased(escrowId, escrow.amount, platformFee, workerAmount);
    }

    /// @notice Refund escrow funds to publisher (called by worker or publisher)
    function refund(bytes32 escrowId) external nonReentrant {
        Escrow storage escrow = escrows[escrowId];
        if (escrow.status != EscrowStatus.Funded) revert EscrowNotFunded();
        if (msg.sender != escrow.publisher && msg.sender != escrow.worker) {
            revert NotPublisher();
        }

        escrow.status = EscrowStatus.Refunded;

        if (!IERC20(escrow.token).transfer(escrow.publisher, escrow.amount)) {
            revert TokenTransferFailed();
        }

        emit EscrowRefunded(escrowId, escrow.amount);
    }

    /// @notice Submit evidence for dispute
    function submitEvidence(bytes32 escrowId, string[] calldata evidenceUrls)
        external
        nonReentrant
    {
        Escrow storage escrow = escrows[escrowId];
        if (escrow.status != EscrowStatus.Funded && escrow.status != EscrowStatus.Disputed) {
            revert EscrowNotDisputed();
        }

        if (msg.sender != escrow.publisher && msg.sender != escrow.worker) {
            revert NotPublisher();
        }

        if (escrow.evidenceUrls.length >= 10) revert EvidenceLimitReached();

        for (uint256 i = 0; i < evidenceUrls.length; i++) {
            if (escrow.evidenceUrls.length >= 10) revert EvidenceLimitReached();
            escrow.evidenceUrls.push(evidenceUrls[i]);
        }

        if (escrow.status == EscrowStatus.Funded) {
            escrow.status = EscrowStatus.Disputed;
        }
    }

    /// @notice Assign an arbitrator to a disputed escrow
    function assignArbitrator(bytes32 escrowId, address arbitrator)
        external
        nonReentrant
        onlyAdmin
    {
        Escrow storage escrow = escrows[escrowId];
        if (escrow.status != EscrowStatus.Disputed) revert EscrowNotDisputed();

        escrow.arbitrator = arbitrator;
        emit ArbitratorAssigned(escrowId, arbitrator);
    }

    /// @notice Resolve dispute - release funds to winner
    /// @param winner Either the publisher or worker address
    function resolve(bytes32 escrowId, address winner, string calldata reason)
        external
        nonReentrant
        onlyArbitrator(escrowId)
    {
        Escrow storage escrow = escrows[escrowId];
        if (escrow.status != EscrowStatus.Disputed) revert EscrowNotDisputed();

        if (winner != escrow.publisher && winner != escrow.worker) {
            revert NotPublisher();
        }

        escrow.status = winner == escrow.publisher ? EscrowStatus.Refunded : EscrowStatus.Released;

        if (winner == escrow.worker) {
            (uint256 platformFee, uint256 workerAmount) = calculateFees(escrow.amount);
            if (!IERC20(escrow.token).transfer(escrow.worker, workerAmount)) revert TokenTransferFailed();
            if (platformFee > 0 && !IERC20(escrow.token).transfer(platformFeeRecipient, platformFee)) revert TokenTransferFailed();
            emit EscrowReleased(escrowId, escrow.amount, platformFee, workerAmount);
        } else {
            if (!IERC20(escrow.token).transfer(escrow.publisher, escrow.amount)) revert TokenTransferFailed();
            emit EscrowRefunded(escrowId, escrow.amount);
        }

        emit ArbitrationResolved(escrowId, winner, reason);
    }

    /// @notice Claim expired escrow refund
    function claimExpired(bytes32 escrowId) external nonReentrant {
        Escrow storage escrow = escrows[escrowId];
        if (escrow.publisher == address(0)) revert EscrowNotFound();
        if (escrow.status != EscrowStatus.Funded) revert EscrowNotFunded();
        if (block.timestamp <= escrow.deadline) revert EscrowNotFunded();

        escrow.status = EscrowStatus.Expired;

        if (!IERC20(escrow.token).transfer(escrow.publisher, escrow.amount)) {
            revert TokenTransferFailed();
        }

        emit EscrowExpired(escrowId);
    }

    /// @notice Batch release for efficiency
    function batchRelease(bytes32[] calldata escrowIds) external nonReentrant {
        for (uint256 i = 0; i < escrowIds.length; i++) {
            _releaseInternal(escrowIds[i]);
        }
    }

    // ============================================================
    // Internal
    // ============================================================

    function _releaseInternal(bytes32 escrowId) private {
        Escrow storage escrow = escrows[escrowId];
        if (escrow.status != EscrowStatus.Funded) return;

        escrow.status = EscrowStatus.Released;

        (uint256 platformFee, uint256 workerAmount) = calculateFees(escrow.amount);

        if (!IERC20(escrow.token).transfer(escrow.worker, workerAmount)) revert TokenTransferFailed();
        if (platformFee > 0 && !IERC20(escrow.token).transfer(platformFeeRecipient, platformFee)) revert TokenTransferFailed();

        emit EscrowReleased(escrowId, escrow.amount, platformFee, workerAmount);
    }

    // ============================================================
    // Admin Functions
    // ============================================================

    function setEscrowAdmin(address _escrowAdmin) external onlyOwner {
        escrowAdmin = _escrowAdmin;
        emit AdminUpdated(_escrowAdmin);
    }

    function setPlatformFeeRecipient(address _recipient) external onlyOwner {
        platformFeeRecipient = _recipient;
        emit PlatformFeeRecipientUpdated(_recipient);
    }

    function setPlatformFeeBps(uint32 _bps) external onlyOwner {
        if (_bps > 10000) revert InvalidBps();
        platformFeeBps = _bps;
        emit PlatformFeeBpsUpdated(_bps);
    }

    /// @notice Emergency: rescue tokens (for admin-only recovery)
    function rescueTokens(address token, address to, uint256 amount) external onlyOwner {
        if (!IERC20(token).transfer(to, amount)) revert TokenTransferFailed();
    }
}
