// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface ICargoRegistry {
    struct CargoBatch {
        address producer;
        string origin;
        uint256 harvestDate;
        string latLong;
        string ipfsMetadata;
        uint256 priceUsdc; // In 6 decimals USDC/EURC
        bool isForSale;
        string status; // E.g., "Harvested", "In Transit", "Delivered", "Sold", "Spoiled"
        address paymentToken; // Address of token (USDC or EURC)
        bool isEncrypted;
        string encryptedPrice;
        uint256 weight;
    }

    function ownerOf(uint256 tokenId) external view returns (address);
    function transferFrom(address from, address to, uint256 tokenId) external;
    function getCargoDetails(uint256 tokenId) external view returns (CargoBatch memory);
}

contract CropLendingPool is IERC721Receiver, ReentrancyGuard, Ownable {
    ICargoRegistry public immutable registry;
    IERC20 public immutable usdc;

    struct Loan {
        address borrower;
        uint256 principal;
        uint256 startTime;
        bool active;
    }

    // tokenId => Loan
    mapping(uint256 => Loan) public loans;
    
    // Interest rate in Basis Points per year (e.g. 1000 BPS = 10%)
    uint256 public interestRateBps = 1000;
    
    // Max LTV in Basis Points (e.g. 5000 BPS = 50%)
    uint256 public constant MAX_LTV_BPS = 5000;

    // Events
    event LoanBorrowed(uint256 indexed tokenId, address indexed borrower, uint256 principal, uint256 limit);
    event LoanRepaid(uint256 indexed tokenId, address indexed borrower, uint256 totalRepaid);
    event LoanSettledFromRegistry(uint256 indexed tokenId, address indexed borrower, uint256 principal);
    event LoanLiquidated(uint256 indexed tokenId, address indexed liquidator, uint256 repaidAmount);
    event InterestRateUpdated(uint256 newRateBps);

    constructor(address _registryAddress, address _usdcAddress) Ownable(msg.sender) {
        require(_registryAddress != address(0), "Invalid registry address");
        require(_usdcAddress != address(0), "Invalid USDC address");
        registry = ICargoRegistry(_registryAddress);
        usdc = IERC20(_usdcAddress);
    }

    /**
     * @notice Borrow USDC using a listed crop NFT as collateral (up to 50% LTV).
     */
    function borrow(uint256 tokenId, uint256 amount) external nonReentrant {
        require(registry.ownerOf(tokenId) == msg.sender, "Caller is not token owner");
        require(!loans[tokenId].active, "Token already collateralized");

        ICargoRegistry.CargoBatch memory batch = registry.getCargoDetails(tokenId);
        require(batch.isForSale, "Crop batch must be listed for sale");
        require(batch.priceUsdc > 0, "Crop price must be greater than zero");

        uint256 borrowLimit = (batch.priceUsdc * MAX_LTV_BPS) / 10000;
        require(amount <= borrowLimit, "Borrow amount exceeds LTV limit");
        require(usdc.balanceOf(address(this)) >= amount, "Insufficient pool liquidity");

        // Lock Collateral: Transfer crop NFT to pool
        registry.transferFrom(msg.sender, address(this), tokenId);

        // Record loan
        loans[tokenId] = Loan({
            borrower: msg.sender,
            principal: amount,
            startTime: block.timestamp,
            active: true
        });

        // Disburse funds
        require(usdc.transfer(msg.sender, amount), "USDC transfer failed");

        emit LoanBorrowed(tokenId, msg.sender, amount, borrowLimit);
    }

    /**
     * @notice Repay a loan manually, unlocking the collateral crop NFT back to the borrower.
     */
    function repay(uint256 tokenId) external nonReentrant {
        Loan storage loan = loans[tokenId];
        require(loan.active, "No active loan on this token");

        uint256 repaymentAmount = _calculateRepaymentAmount(loan);

        // Transfer repayment (principal + interest) to pool
        require(usdc.transferFrom(msg.sender, address(this), repaymentAmount), "Repayment transfer failed");

        address borrower = loan.borrower;
        loan.active = false;

        // Unlock Collateral: Transfer crop NFT back to borrower
        registry.transferFrom(address(this), borrower, tokenId);

        emit LoanRepaid(tokenId, borrower, repaymentAmount);
    }

    /**
     * @notice Callback called by CargoRegistry during purchase to settle the loan.
     */
    function settleLoanFromRegistry(uint256 tokenId) external nonReentrant {
        require(msg.sender == address(registry), "Only callable by registry");
        Loan storage loan = loans[tokenId];
        require(loan.active, "No active loan on this token");

        loan.active = false;

        emit LoanSettledFromRegistry(tokenId, loan.borrower, loan.principal);
    }

    /**
     * @notice Liquidate a loan if crop quality is "Spoiled" or loan duration > 30 days.
     */
    function liquidate(uint256 tokenId) external nonReentrant {
        Loan storage loan = loans[tokenId];
        require(loan.active, "No active loan on this token");

        ICargoRegistry.CargoBatch memory batch = registry.getCargoDetails(tokenId);
        bool isSpoiled = keccak256(bytes(batch.status)) == keccak256(bytes("Spoiled"));
        bool isExpired = block.timestamp > loan.startTime + 30 days;

        require(isSpoiled || isExpired, "Collateral not eligible for liquidation");

        uint256 repaymentAmount = _calculateRepaymentAmount(loan);

        // Liquidator pays repayment amount to pool
        require(usdc.transferFrom(msg.sender, address(this), repaymentAmount), "Liquidation payment failed");

        loan.active = false;

        // Liquidator receives crop NFT
        registry.transferFrom(address(this), msg.sender, tokenId);

        emit LoanLiquidated(tokenId, msg.sender, repaymentAmount);
    }

    // --- View Helpers ---

    function getBorrower(uint256 tokenId) external view returns (address) {
        Loan memory loan = loans[tokenId];
        if (!loan.active) return address(0);
        return loan.borrower;
    }

    function getRepaymentAmount(uint256 tokenId) external view returns (uint256) {
        Loan memory loan = loans[tokenId];
        if (!loan.active) return 0;
        return _calculateRepaymentAmount(loan);
    }

    function _calculateRepaymentAmount(Loan memory loan) internal view returns (uint256) {
        uint256 duration = block.timestamp - loan.startTime;
        if (duration == 0) duration = 1; // Accrue minimum 1 second interest
        
        uint256 interest = (loan.principal * interestRateBps * duration) / (10000 * 365 days);
        return loan.principal + interest;
    }

    // --- Admin functions ---

    function setInterestRateBps(uint256 _newRateBps) external onlyOwner {
        require(_newRateBps <= 3000, "Interest rate too high"); // Cap at 30%
        interestRateBps = _newRateBps;
        emit InterestRateUpdated(_newRateBps);
    }

    function withdrawUSDC(uint256 amount) external onlyOwner {
        require(usdc.balanceOf(address(this)) >= amount, "Insufficient balance");
        require(usdc.transfer(msg.sender, amount), "USDC transfer failed");
    }

    // --- ERC721 Receiver Callback ---

    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external pure override returns (bytes4) {
        return this.onERC721Received.selector;
    }
}
