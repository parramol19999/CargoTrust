// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IERC20 {
    function transferFrom(address from, address to, uint256 value) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 value) external returns (bool);
}

contract VerifierRegistry is Ownable, ReentrancyGuard {
    IERC20 public immutable usdc;
    address public cargoRegistry;

    uint256 public minStake = 500 * 10**6; // 500 USDC (6 decimals)
    uint256 public constant WITHDRAW_COOLDOWN = 7 days;

    struct WithdrawRequest {
        uint256 amount;
        uint256 unlockTime;
    }

    mapping(address => uint256) public stakedAmount;
    mapping(address => uint256) public rewardBalance;
    mapping(address => uint256) public reputationScore;
    mapping(address => WithdrawRequest) public withdrawRequests;
    mapping(address => uint256) public totalSlashed;

    event Staked(address indexed verifier, uint256 amount);
    event WithdrawRequested(address indexed verifier, uint256 amount, uint256 unlockTime);
    event WithdrawFinalized(address indexed verifier, uint256 amount);
    event RewardsWithdrawn(address indexed verifier, uint256 amount);
    event Slashed(address indexed verifier, uint256 amount, address indexed recipient);
    event ReputationUpdated(address indexed verifier, uint256 newScore);
    event PremiumFeePaid(address indexed buyer, address indexed verifier, uint256 amount);
    event CargoRegistryUpdated(address oldRegistry, address newRegistry);

    constructor(address _usdcAddress) Ownable(msg.sender) {
        require(_usdcAddress != address(0), "Invalid USDC address");
        usdc = IERC20(_usdcAddress);
    }

    function setCargoRegistry(address _cargoRegistry) external onlyOwner {
        address old = cargoRegistry;
        cargoRegistry = _cargoRegistry;
        emit CargoRegistryUpdated(old, _cargoRegistry);
    }

    function setMinStake(uint256 _minStake) external onlyOwner {
        minStake = _minStake;
    }

    /**
     * @notice Stakes USDC to become a verifier
     */
    function stake(uint256 _amount) external nonReentrant {
        require(_amount > 0, "Amount must be > 0");
        require(
            usdc.transferFrom(msg.sender, address(this), _amount),
            "USDC transfer failed"
        );

        stakedAmount[msg.sender] += _amount;

        if (reputationScore[msg.sender] == 0) {
            reputationScore[msg.sender] = 100; // default reputation
        }

        emit Staked(msg.sender, _amount);
        emit ReputationUpdated(msg.sender, reputationScore[msg.sender]);
    }

    /**
     * @notice Initiates a withdrawal request for the staked collateral
     */
    function requestWithdraw(uint256 _amount) external {
        require(_amount > 0, "Amount must be > 0");
        require(stakedAmount[msg.sender] >= _amount, "Insufficient stake");
        
        WithdrawRequest storage req = withdrawRequests[msg.sender];
        req.amount = _amount;
        req.unlockTime = block.timestamp + WITHDRAW_COOLDOWN;

        emit WithdrawRequested(msg.sender, _amount, req.unlockTime);
    }

    /**
     * @notice Finalizes withdrawal of staked collateral after freeze period
     */
    function finalizeWithdraw() external nonReentrant {
        WithdrawRequest memory req = withdrawRequests[msg.sender];
        require(req.amount > 0, "No request pending");
        require(block.timestamp >= req.unlockTime, "Withdrawal is locked");
        require(stakedAmount[msg.sender] >= req.amount, "Insufficient stake to withdraw");

        stakedAmount[msg.sender] -= req.amount;
        delete withdrawRequests[msg.sender];

        require(usdc.transfer(msg.sender, req.amount), "USDC transfer failed");

        emit WithdrawFinalized(msg.sender, req.amount);
    }

    /**
     * @notice Withdraws accrued reward fees immediately
     */
    function withdrawRewards() external nonReentrant {
        uint256 rewards = rewardBalance[msg.sender];
        require(rewards > 0, "No rewards to withdraw");

        rewardBalance[msg.sender] = 0;
        require(usdc.transfer(msg.sender, rewards), "USDC transfer failed");

        emit RewardsWithdrawn(msg.sender, rewards);
    }

    /**
     * @notice Allows buyers/premium users to pay a certification check fee to a verifier
     */
    function payPremiumCertCheckFee(address _verifier, uint256 _amount) external nonReentrant {
        require(_verifier != address(0), "Invalid verifier address");
        require(_amount > 0, "Fee must be > 0");
        require(stakedAmount[_verifier] >= minStake, "Verifier is not active");

        require(
            usdc.transferFrom(msg.sender, address(this), _amount),
            "USDC fee payment failed"
        );

        rewardBalance[_verifier] += _amount;

        emit PremiumFeePaid(msg.sender, _verifier, _amount);
    }

    /**
     * @notice Increases a verifier's reputation score (called by cargo registry on certification)
     */
    function incrementReputation(address _verifier) external {
        require(msg.sender == cargoRegistry, "Only CargoRegistry can increment reputation");
        if (stakedAmount[_verifier] >= minStake) {
            uint256 current = reputationScore[_verifier];
            if (current < 500) {
                uint256 next = current + 5;
                if (next > 500) next = 500;
                reputationScore[_verifier] = next;
                emit ReputationUpdated(_verifier, next);
            }
        }
    }

    /**
     * @notice Slashes a verifier's stake for registering fraudulent data
     */
    function slashVerifier(address _verifier, uint256 _amount, address _recipient) external onlyOwner nonReentrant {
        require(_verifier != address(0), "Invalid verifier");
        require(_amount > 0, "Amount must be > 0");
        require(stakedAmount[_verifier] >= _amount, "Slash amount exceeds stake");

        stakedAmount[_verifier] -= _amount;
        totalSlashed[_verifier] += _amount;
        
        // Slash reputation score (penalty)
        uint256 score = reputationScore[_verifier];
        if (score > 50) {
            reputationScore[_verifier] = score - 50;
        } else {
            reputationScore[_verifier] = 0;
        }

        address payTo = _recipient == address(0) ? owner() : _recipient;
        require(usdc.transfer(payTo, _amount), "USDC slash transfer failed");

        emit Slashed(_verifier, _amount, payTo);
        emit ReputationUpdated(_verifier, reputationScore[_verifier]);
    }

    /**
     * @notice Check if a verifier is active and has sufficient stake
     */
    function isActiveVerifier(address _verifier) external view returns (bool) {
        return stakedAmount[_verifier] >= minStake;
    }
}
