import { expect } from "chai";
import pkg from "hardhat";
const { ethers } = pkg;

describe("CargoEscrow & Registry Integration Tests", function () {
  let mockUsdc;
  let cargoRegistry;
  let cargoEscrow;
  let owner;
  let producer;
  let verifier;
  let buyer;
  let feeCollector;

  const MINT_FEE = 100000; // 0.10 USDC (6 decimals)
  const LIST_PRICE = 500000000; // 500.00 USDC (6 decimals)

  beforeEach(async function () {
    [owner, producer, verifier, buyer, feeCollector] = await ethers.getSigners();

    // Deploy Mock USDC
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    mockUsdc = await MockUSDC.deploy();
    await mockUsdc.waitForDeployment();

    // Deploy CargoRegistry
    const CargoRegistry = await ethers.getContractFactory("CargoRegistry");
    cargoRegistry = await CargoRegistry.deploy(await mockUsdc.getAddress());
    await cargoRegistry.waitForDeployment();

    // Deploy CargoEscrow
    const CargoEscrow = await ethers.getContractFactory("CargoEscrow");
    cargoEscrow = await CargoEscrow.deploy(await cargoRegistry.getAddress());
    await cargoEscrow.waitForDeployment();

    // Set escrow contract on registry
    await cargoRegistry.setCargoEscrow(await cargoEscrow.getAddress());

    // Fund test accounts
    await mockUsdc.transfer(producer.address, 1000 * 10**6);
    await mockUsdc.transfer(buyer.address, 1000 * 10**6);
    await mockUsdc.transfer(feeCollector.address, 1000 * 10**6); // For StableFX payouts

    // Set custom fee collector and verifier
    await cargoRegistry.setFeeCollector(feeCollector.address);
    await cargoRegistry.setVerifier(verifier.address, true, "Accredited Lab Alpha");
  });

  describe("ERC-8183 Compliant Standalone Operations", function () {
    it("Should allow manual job creation, funding, certification and payout", async function () {
      const amount = 200 * 10**6;
      const expiry = Math.floor(Date.now() / 1000) + 3600;
      const deliverableHash = ethers.zeroPadValue(ethers.toBeHex(123), 32);

      // Create Job
      const tx = await cargoEscrow.connect(buyer).createJob(
        producer.address,
        verifier.address,
        await mockUsdc.getAddress(),
        amount,
        expiry,
        deliverableHash
      );
      await expect(tx).to.emit(cargoEscrow, "JobCreated");

      const jobId = 1;
      const jobBefore = await cargoEscrow.jobs(jobId);
      expect(jobBefore.client).to.equal(buyer.address);
      expect(jobBefore.status).to.equal(0); // JobStatus.OPEN

      // Lock Funds
      await mockUsdc.connect(buyer).approve(await cargoEscrow.getAddress(), amount);
      const lockTx = await cargoEscrow.connect(buyer).lockFunds(jobId);
      await expect(lockTx).to.emit(cargoEscrow, "FundsLocked").withArgs(jobId, amount);

      const jobFunded = await cargoEscrow.jobs(jobId);
      expect(jobFunded.status).to.equal(1); // JobStatus.FUNDED

      // Certify Deliverable (triggers auto-payout)
      const providerInitialBalance = await mockUsdc.balanceOf(producer.address);
      const certifyTx = await cargoEscrow.connect(verifier).certifyDeliverable(jobId);
      await expect(certifyTx).to.emit(cargoEscrow, "JobCompleted").withArgs(jobId);

      const jobCompleted = await cargoEscrow.jobs(jobId);
      expect(jobCompleted.status).to.equal(2); // JobStatus.COMPLETED

      const providerFinalBalance = await mockUsdc.balanceOf(producer.address);
      expect(providerFinalBalance - providerInitialBalance).to.equal(amount);
    });

    it("Should allow client refund if job is expired", async function () {
      const amount = 200 * 10**6;
      const expiry = Math.floor(Date.now() / 1000) - 100; // already expired
      const deliverableHash = ethers.zeroPadValue(ethers.toBeHex(123), 32);

      await cargoEscrow.connect(buyer).createJob(
        producer.address,
        verifier.address,
        await mockUsdc.getAddress(),
        amount,
        expiry,
        deliverableHash
      );

      await mockUsdc.connect(buyer).approve(await cargoEscrow.getAddress(), amount);
      await cargoEscrow.connect(buyer).lockFunds(1);

      const buyerInitialBalance = await mockUsdc.balanceOf(buyer.address);
      const refundTx = await cargoEscrow.connect(buyer).refund(1);
      await expect(refundTx).to.emit(cargoEscrow, "JobRejected").withArgs(1);

      const buyerFinalBalance = await mockUsdc.balanceOf(buyer.address);
      expect(buyerFinalBalance - buyerInitialBalance).to.equal(amount);
    });
  });

  describe("CargoRegistry Integrated Purchase Escrow", function () {
    beforeEach(async function () {
      // Mint cargo batch
      await mockUsdc.connect(producer).approve(await cargoRegistry.getAddress(), MINT_FEE);
      await cargoRegistry.connect(producer).mintCargo(
        "Finca El Fuerte, Colombia",
        Math.floor(Date.now() / 1000),
        "4.5981,-74.0758",
        "ipfs://QmCoffeeBatch101"
      );
      // List cargo batch
      await cargoRegistry.connect(producer).listCargo(1, LIST_PRICE);
    });

    it("Should route buyer funds to escrow upon purchase and release on verification", async function () {
      // Approve buyer USDC to registry
      await mockUsdc.connect(buyer).approve(await cargoRegistry.getAddress(), LIST_PRICE);

      const collectorInitialBalance = await mockUsdc.balanceOf(feeCollector.address);
      const escrowAddress = await cargoEscrow.getAddress();

      // Purchase cargo batch
      const tx = await cargoRegistry.connect(buyer).purchaseCargo(1);
      await expect(tx).to.emit(cargoRegistry, "CargoPurchased").withArgs(1, producer.address, buyer.address, LIST_PRICE);

      // Verify commission went to fee collector
      const expectedCommission = (LIST_PRICE * 50) / 10000; // 0.5%
      const expectedEscrowAmount = LIST_PRICE - expectedCommission;
      expect(await mockUsdc.balanceOf(feeCollector.address) - collectorInitialBalance).to.equal(expectedCommission);

      // Verify seller funds are locked in escrow
      expect(await mockUsdc.balanceOf(escrowAddress)).to.equal(expectedEscrowAmount);

      const jobId = await cargoRegistry.tokenEscrowJobs(1);
      expect(jobId).to.equal(1);

      const job = await cargoEscrow.jobs(jobId);
      expect(job.client).to.equal(buyer.address);
      expect(job.provider).to.equal(producer.address);
      expect(job.evaluator).to.equal(feeCollector.address); // default evaluator
      expect(job.amount).to.equal(expectedEscrowAmount);
      expect(job.status).to.equal(1); // JobStatus.FUNDED

      // Let verifier certify the cargo batch
      // (This should update status to "Certified QA Attestation" and call escrow)
      const sellerInitialBalance = await mockUsdc.balanceOf(producer.address);
      await cargoRegistry.connect(verifier).addVerification(1, "QA Attestation", "ipfs://QmAttest");

      // Seller gets paid atomically
      expect(await mockUsdc.balanceOf(producer.address) - sellerInitialBalance).to.equal(expectedEscrowAmount);
      expect(await mockUsdc.balanceOf(escrowAddress)).to.equal(0);

      const finalJob = await cargoEscrow.jobs(jobId);
      expect(finalJob.status).to.equal(2); // JobStatus.COMPLETED
    });

    it("Should trigger refund if status is set to Damaged", async function () {
      await mockUsdc.connect(buyer).approve(await cargoRegistry.getAddress(), LIST_PRICE);
      await cargoRegistry.connect(buyer).purchaseCargo(1);

      const jobId = await cargoRegistry.tokenEscrowJobs(1);
      const expectedCommission = (LIST_PRICE * 50) / 10000;
      const expectedEscrowAmount = LIST_PRICE - expectedCommission;

      // Mark batch as Damaged (can be done by verifier or owner/buyer/approved)
      await cargoRegistry.connect(verifier).updateStatus(1, "Damaged");

      // Verify job is marked as damaged
      const job = await cargoEscrow.jobs(jobId);
      expect(job.isDamaged).to.be.true;

      // Refund to buyer
      const buyerInitialBalance = await mockUsdc.balanceOf(buyer.address);
      await cargoEscrow.connect(buyer).refund(jobId);

      expect(await mockUsdc.balanceOf(buyer.address) - buyerInitialBalance).to.equal(expectedEscrowAmount);
    });
  });
});
