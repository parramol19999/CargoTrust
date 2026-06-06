import { expect } from "chai";
import pkg from "hardhat";
const { ethers } = pkg;

describe("CargoTrust CropLendingPool Tests", function () {
  let mockUsdc;
  let cargoRegistry;
  let lendingPool;
  let owner;
  let farmer;
  let buyer;
  let liquidator;

  const MINT_FEE = 100000; // 0.10 USDC (6 decimals)
  const LIST_PRICE = 1000 * 10**6; // 1000 USDC listing price
  const BORROW_AMOUNT = 400 * 10**6; // 400 USDC (LTV < 50%)
  const OVER_LTV_AMOUNT = 600 * 10**6; // 600 USDC (LTV > 50%)

  beforeEach(async function () {
    [owner, farmer, buyer, liquidator] = await ethers.getSigners();

    // Deploy Mock USDC
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    mockUsdc = await MockUSDC.deploy();
    await mockUsdc.waitForDeployment();

    // Deploy CargoRegistry
    const CargoRegistry = await ethers.getContractFactory("CargoRegistry");
    cargoRegistry = await CargoRegistry.deploy(await mockUsdc.getAddress());
    await cargoRegistry.waitForDeployment();

    // Deploy CropLendingPool
    const CropLendingPool = await ethers.getContractFactory("CropLendingPool");
    lendingPool = await CropLendingPool.deploy(
      await cargoRegistry.getAddress(),
      await mockUsdc.getAddress()
    );
    await lendingPool.waitForDeployment();

    // Link registry to lending pool
    await cargoRegistry.setLendingPool(await lendingPool.getAddress());

    // Fund accounts
    await mockUsdc.transfer(farmer.address, 1000 * 10**6);
    await mockUsdc.transfer(buyer.address, 2000 * 10**6);
    await mockUsdc.transfer(liquidator.address, 1000 * 10**6);
    await mockUsdc.transfer(await lendingPool.getAddress(), 10000 * 10**6); // Fund pool liquidity

    // Mint crop NFT
    await mockUsdc.connect(farmer).approve(await cargoRegistry.getAddress(), MINT_FEE);
    await cargoRegistry.connect(farmer).mintCargo(
      "Premium Coffee Farm, Brazil",
      Math.floor(Date.now() / 1000),
      "-15.7942,-47.8822",
      "ipfs://QmBrazilianArabica101"
    );

    // List crop batch
    await cargoRegistry.connect(farmer).listCargo(1, LIST_PRICE);
  });

  describe("Borrowing Mechanics", function () {
    it("Should reject borrows above 50% LTV", async function () {
      await cargoRegistry.connect(farmer).approve(await lendingPool.getAddress(), 1);
      await expect(
        lendingPool.connect(farmer).borrow(1, OVER_LTV_AMOUNT)
      ).to.be.revertedWith("Borrow amount exceeds LTV limit");
    });

    it("Should allow borrowing <= 50% LTV, lock the NFT, and update loan state", async function () {
      await cargoRegistry.connect(farmer).approve(await lendingPool.getAddress(), 1);
      
      const farmerBalBefore = await mockUsdc.balanceOf(farmer.address);
      
      await expect(lendingPool.connect(farmer).borrow(1, BORROW_AMOUNT))
        .to.emit(lendingPool, "LoanBorrowed");

      // Verify farmer balance increased
      const farmerBalAfter = await mockUsdc.balanceOf(farmer.address);
      expect(farmerBalAfter - farmerBalBefore).to.equal(BORROW_AMOUNT);

      // Verify lending pool owns the NFT now
      expect(await cargoRegistry.ownerOf(1)).to.equal(await lendingPool.getAddress());

      // Verify loan state
      const loan = await lendingPool.loans(1);
      expect(loan.borrower).to.equal(farmer.address);
      expect(loan.principal).to.equal(BORROW_AMOUNT);
      expect(loan.active).to.be.true;
    });
  });

  describe("Manual Repayment Mechanics", function () {
    beforeEach(async function () {
      await cargoRegistry.connect(farmer).approve(await lendingPool.getAddress(), 1);
      await lendingPool.connect(farmer).borrow(1, BORROW_AMOUNT);
    });

    it("Should allow manual repayment, charge accrued interest, and return the NFT", async function () {
      const repaymentAmount = await lendingPool.getRepaymentAmount(1);
      
      // Approve 10% extra to buffer block time shifts
      const approveAmount = (repaymentAmount * 11n) / 10n;
      await mockUsdc.connect(farmer).approve(await lendingPool.getAddress(), approveAmount);
      
      await expect(lendingPool.connect(farmer).repay(1))
        .to.emit(lendingPool, "LoanRepaid");

      // Verify farmer is once again the NFT owner
      expect(await cargoRegistry.ownerOf(1)).to.equal(farmer.address);

      // Verify loan is no longer active
      const loan = await lendingPool.loans(1);
      expect(loan.active).to.be.false;
    });
  });

  describe("Automated Registry Settlement", function () {
    beforeEach(async function () {
      await cargoRegistry.connect(farmer).approve(await lendingPool.getAddress(), 1);
      await lendingPool.connect(farmer).borrow(1, BORROW_AMOUNT);
    });

    it("Should automatically repay lending pool and route surplus to farmer upon B2B purchase", async function () {
      const repaymentAmount = await lendingPool.getRepaymentAmount(1);
      const commission = (LIST_PRICE * 50) / 10000; // 0.5% commission
      const sellerAmount = LIST_PRICE - commission;

      const poolUSDCBefore = await mockUsdc.balanceOf(await lendingPool.getAddress());
      const farmerUSDCBefore = await mockUsdc.balanceOf(farmer.address);

      // Approve registry and purchase
      await mockUsdc.connect(buyer).approve(await cargoRegistry.getAddress(), LIST_PRICE);
      
      await expect(cargoRegistry.connect(buyer).purchaseCargo(1))
        .to.emit(cargoRegistry, "CargoPurchased")
        .withArgs(1, farmer.address, buyer.address, LIST_PRICE);

      // Verify NFT belongs to the buyer now
      expect(await cargoRegistry.ownerOf(1)).to.equal(buyer.address);

      // Verify loan is settled in the pool
      const loan = await lendingPool.loans(1);
      expect(loan.active).to.be.false;

      // Verify USDC routing
      const poolUSDCAfter = await mockUsdc.balanceOf(await lendingPool.getAddress());
      const farmerUSDCAfter = await mockUsdc.balanceOf(farmer.address);

      // Pool should have received at least repaymentAmount
      expect(poolUSDCAfter - poolUSDCBefore).to.be.gte(repaymentAmount);

      // Farmer should have received surplus
      const receivedByFarmer = farmerUSDCAfter - farmerUSDCBefore;
      expect(receivedByFarmer).to.be.lte(BigInt(sellerAmount) - repaymentAmount);
    });
  });

  describe("Liquidation Mechanics", function () {
    beforeEach(async function () {
      await cargoRegistry.connect(farmer).approve(await lendingPool.getAddress(), 1);
      await lendingPool.connect(farmer).borrow(1, BORROW_AMOUNT);
    });

    it("Should reject liquidation attempts for healthy crops", async function () {
      await expect(
        lendingPool.connect(liquidator).liquidate(1)
      ).to.be.revertedWith("Collateral not eligible for liquidation");
    });

    it("Should allow liquidation if crop status is set to Spoiled", async function () {
      await cargoRegistry.connect(owner).setVerifier(owner.address, true, "Admin Verifier");
      await cargoRegistry.connect(owner).updateStatus(1, "Spoiled");

      const repaymentAmount = await lendingPool.getRepaymentAmount(1);
      const approveAmount = (repaymentAmount * 11n) / 10n;
      await mockUsdc.connect(liquidator).approve(await lendingPool.getAddress(), approveAmount);

      await expect(lendingPool.connect(liquidator).liquidate(1))
        .to.emit(lendingPool, "LoanLiquidated");

      // Liquidator now owns the crop NFT
      expect(await cargoRegistry.ownerOf(1)).to.equal(liquidator.address);

      // Loan is inactive
      const loan = await lendingPool.loans(1);
      expect(loan.active).to.be.false;
    });

    it("Should allow liquidation if loan has expired (30 days overdue)", async function () {
      // Advance time by 31 days
      await ethers.provider.send("evm_increaseTime", [31 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine", []);

      const repaymentAmount = await lendingPool.getRepaymentAmount(1);
      const approveAmount = (repaymentAmount * 11n) / 10n;
      await mockUsdc.connect(liquidator).approve(await lendingPool.getAddress(), approveAmount);

      await expect(lendingPool.connect(liquidator).liquidate(1))
        .to.emit(lendingPool, "LoanLiquidated");

      // Liquidator now owns the crop NFT
      expect(await cargoRegistry.ownerOf(1)).to.equal(liquidator.address);
    });
  });
});
