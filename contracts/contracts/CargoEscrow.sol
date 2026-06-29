// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface ICargoRegistry {
    function feeCollector() external view returns (address);
    function authorizedVerifiers(address verifier) external view returns (bool);
}

/**
 * @title CargoEscrow
 * @notice Implements ERC-8183 standard interface for escrowed commerce
 */
contract CargoEscrow is Ownable, ReentrancyGuard {
    enum JobStatus { OPEN, FUNDED, COMPLETED, REJECTED }

    struct Job {
        address client;       // Buyer
        address provider;     // Seller
        address evaluator;    // Certifier/Verifier
        address token;        // USDC/EURC
        uint256 amount;       // Purchase price minus commission
        uint256 expiry;       // Delivery deadline
        JobStatus status;     // Escrow state
        bytes32 deliverableHash;
        uint256 tokenId;      // Cargo registry token ID
        bool isDamaged;
    }

    uint256 public nextJobId = 1;
    address public registry;

    mapping(uint256 => Job) public jobs;

    event JobCreated(
        uint256 indexed jobId,
        address indexed client,
        address indexed provider,
        address evaluator,
        address token,
        uint256 amount,
        uint256 expiry,
        uint256 tokenId
    );
    event FundsLocked(uint256 indexed jobId, uint256 amount);
    event JobCompleted(uint256 indexed jobId);
    event JobRejected(uint256 indexed jobId);
    event JobRefunded(uint256 indexed jobId, address recipient, uint256 amount);

    modifier onlyRegistry() {
        require(msg.sender == registry, "Only registry can call");
        _;
    }

    constructor(address _registry) Ownable(msg.sender) {
        registry = _registry;
    }

    function setRegistry(address _registry) external onlyOwner {
        registry = _registry;
    }

    /**
     * @notice Create a new Escrow Job matching ERC-8183 signature
     */
    function createJob(
        address provider,
        address evaluator,
        address token,
        uint256 amount,
        uint256 expiry,
        bytes32 deliverableHash
    ) external returns (uint256 jobId) {
        jobId = nextJobId++;
        jobs[jobId] = Job({
            client: msg.sender,
            provider: provider,
            evaluator: evaluator,
            token: token,
            amount: amount,
            expiry: expiry,
            status: JobStatus.OPEN,
            deliverableHash: deliverableHash,
            tokenId: 0,
            isDamaged: false
        });

        emit JobCreated(jobId, msg.sender, provider, evaluator, token, amount, expiry, 0);
    }

    /**
     * @notice Registry-specific job creator that is funded atomically
     */
    function createJobAndFund(
        uint256 _tokenId,
        address _client,
        address _provider,
        address _evaluator,
        address _token,
        uint256 _amount,
        uint256 _expiry
    ) external onlyRegistry returns (uint256 jobId) {
        jobId = nextJobId++;
        jobs[jobId] = Job({
            client: _client,
            provider: _provider,
            evaluator: _evaluator,
            token: _token,
            amount: _amount,
            expiry: _expiry,
            status: JobStatus.FUNDED,
            deliverableHash: bytes32(0),
            tokenId: _tokenId,
            isDamaged: false
        });

        emit JobCreated(jobId, _client, _provider, _evaluator, _token, _amount, _expiry, _tokenId);
        emit FundsLocked(jobId, _amount);
    }

    /**
     * @notice Lock funds for an OPEN job matching ERC-8183
     */
    function lockFunds(uint256 jobId) external nonReentrant {
        Job storage job = jobs[jobId];
        require(job.status == JobStatus.OPEN, "Job is not open");
        require(msg.sender == job.client, "Only client can lock funds");

        job.status = JobStatus.FUNDED;
        require(
            IERC20(job.token).transferFrom(msg.sender, address(this), job.amount),
            "Escrow lock payment failed"
        );

        emit FundsLocked(jobId, job.amount);
    }

    /**
     * @notice Standard ERC-8183 certify function
     */
    function certifyDeliverable(uint256 jobId) external nonReentrant {
        Job storage job = jobs[jobId];
        require(job.status == JobStatus.FUNDED, "Job must be funded");
        require(msg.sender == job.evaluator || msg.sender == job.client, "Only evaluator or client can certify");

        job.status = JobStatus.COMPLETED;
        emit JobCompleted(jobId);

        _payout(jobId);
    }

    /**
     * @notice Registry-triggered certification hook
     */
    function certifyDeliverableFromRegistry(uint256 jobId, address verifier) external onlyRegistry nonReentrant {
        Job storage job = jobs[jobId];
        require(job.status == JobStatus.FUNDED, "Job must be funded");
        
        bool isAllowed = (job.evaluator == verifier || 
                          job.evaluator == ICargoRegistry(registry).feeCollector() || 
                          ICargoRegistry(registry).authorizedVerifiers(verifier));
        require(isAllowed, "Verifier is not authorized to evaluate this job");

        job.status = JobStatus.COMPLETED;
        emit JobCompleted(jobId);

        _payout(jobId);
    }

    /**
     * @notice Manual payout function matching ERC-8183
     */
    function payout(uint256 jobId) external nonReentrant {
        Job storage job = jobs[jobId];
        require(job.status == JobStatus.COMPLETED, "Job is not certified completed");
        _payout(jobId);
    }

    function _payout(uint256 jobId) internal {
        Job storage job = jobs[jobId];
        uint256 amount = job.amount;
        if (amount > 0) {
            job.amount = 0;
            require(
                IERC20(job.token).transfer(job.provider, amount),
                "Disbursement to seller failed"
            );
        }
    }

    /**
     * @notice Internal hook called when Registry status updates to "Damaged"
     */
    function markAsDamaged(uint256 jobId) external onlyRegistry {
        Job storage job = jobs[jobId];
        job.isDamaged = true;
    }

    /**
     * @notice Client or mutually agreed refund workflow matching ERC-8183
     */
    function refund(uint256 jobId) external nonReentrant {
        Job storage job = jobs[jobId];
        require(job.status == JobStatus.FUNDED, "Job must be funded");

        bool canRefund = job.isDamaged ||
                         block.timestamp > job.expiry ||
                         msg.sender == job.provider ||
                         msg.sender == job.evaluator;

        require(canRefund, "Refund conditions not met");

        job.status = JobStatus.REJECTED;
        uint256 amount = job.amount;
        job.amount = 0;

        require(
            IERC20(job.token).transfer(job.client, amount),
            "Refund transfer failed"
        );

        emit JobRejected(jobId);
        emit JobRefunded(jobId, job.client, amount);
    }
}
