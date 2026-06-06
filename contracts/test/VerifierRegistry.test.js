import { expect } from "chai";
import pkg from "hardhat";
const { ethers } = pkg;

describe("CargoTrust VerifierRegistry Tests", function () {
  let mockUsdc;
  let cargoRegistry;
  let verifierRegistry;
  let owner;
  let producer;
  let verifier;
  let stranger;

  const MINT_FEE = 100000; // 0.10 USDC (6 decimals)
  const MIN_STAKE = 500 * 10**6; // 500 USDC (6 decimals)

  beforeEach(async function () {
    [owner, producer, verifier, stranger] = await ethers.getSigners();

    // Deploy Mock USDC
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    mockUsdc = await MockUSDC.deploy();
    await mockUsdc.waitForDeployment();

    // Deploy CargoRegistry
    const CargoRegistry = await ethers.getContractFactory("CargoRegistry");
    cargoRegistry = await CargoRegistry.deploy(await mockUsdc.getAddress());
    await cargoRegistry.waitForDeployment();

    // Deploy VerifierRegistry
    const VerifierRegistry = await ethers.getContractFactory("VerifierRegistry");
    verifierRegistry = await VerifierRegistry.deploy(await mockUsdc.getAddress());
    await verifierRegistry.waitForDeployment();

    // Link VerifierRegistry to CargoRegistry and vice versa
    await cargoRegistry.setVerifierRegistry(await verifierRegistry.getAddress());
    await verifierRegistry.setCargoRegistry(await cargoRegistry.getAddress());

    // Fund accounts
    await mockUsdc.transfer(producer.address, 1000 * 10**6);
    await mockUsdc.transfer(verifier.address, 1000 * 10**6);
    await mockUsdc.transfer(stranger.address, 100 * 10**6);

    // Mint a cargo twin
    await mockUsdc.connect(producer).approve(await cargoRegistry.getAddress(), MINT_FEE);
    await cargoRegistry.connect(producer).mintCargo(
      "Coffee Farm, Colombia",
      Math.floor(Date.now() / 1000),
      "4.5981,-74.0758",
      "ipfs://QmCoffeeBatch101?desc=Organic-Arabica"
    );
  });

  describe("Staking Collateral Mechanics", function () {
    it("Should allow a verifier to stake USDC", async function () {
      await mockUsdc.connect(verifier).approve(await verifierRegistry.getAddress(), MIN_STAKE);
      await expect(verifierRegistry.connect(verifier).stake(MIN_STAKE))
        .to.emit(verifierRegistry, "Staked")
        .withArgs(verifier.address, MIN_STAKE);

      expect(await verifierRegistry.stakedAmount(verifier.address)).to.equal(MIN_STAKE);
      expect(await verifierRegistry.reputationScore(verifier.address)).to.equal(100);
      expect(await verifierRegistry.isActiveVerifier(verifier.address)).to.be.true;
    });

    it("Should revert withdrawals requested without active cooldown", async function () {
      await mockUsdc.connect(verifier).approve(await verifierRegistry.getAddress(), MIN_STAKE);
      await verifierRegistry.connect(verifier).stake(MIN_STAKE);

      // Attempt to finalize withdraw immediately should fail
      await expect(
        verifierRegistry.connect(verifier).finalizeWithdraw()
      ).to.be.revertedWith("No request pending");
    });

    it("Should enforce the 7-day freeze cooldown period on stake withdrawals", async function () {
      await mockUsdc.connect(verifier).approve(await verifierRegistry.getAddress(), MIN_STAKE);
      await verifierRegistry.connect(verifier).stake(MIN_STAKE);

      // Request withdraw
      await verifierRegistry.connect(verifier).requestWithdraw(MIN_STAKE);

      // Finalize should fail before 7 days
      await expect(
        verifierRegistry.connect(verifier).finalizeWithdraw()
      ).to.be.revertedWith("Withdrawal is locked");

      // Advance time by 7 days
      await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine", []);

      // Finalize should now succeed
      const initialBal = await mockUsdc.balanceOf(verifier.address);
      await verifierRegistry.connect(verifier).finalizeWithdraw();
      const finalBal = await mockUsdc.balanceOf(verifier.address);

      expect(finalBal - initialBal).to.equal(MIN_STAKE);
      expect(await verifierRegistry.stakedAmount(verifier.address)).to.equal(0);
      expect(await verifierRegistry.isActiveVerifier(verifier.address)).to.be.false;
    });
  });

  describe("Linked Authorization Check", function () {
    it("Should reject verification if verifier has insufficient stake", async function () {
      // verifier has not staked yet
      await expect(
        cargoRegistry.connect(verifier).addVerification(1, "Organic Certified", "ipfs://QmVC")
      ).to.be.revertedWith("Caller is not an authorized verifier");
    });

    it("Should allow verification and increment reputation when staked", async function () {
      await mockUsdc.connect(verifier).approve(await verifierRegistry.getAddress(), MIN_STAKE);
      await verifierRegistry.connect(verifier).stake(MIN_STAKE);

      // Perform verification
      await expect(
        cargoRegistry.connect(verifier).addVerification(1, "Organic Certified", "ipfs://QmVC")
      ).to.emit(cargoRegistry, "CargoVerified");

      // Reputation should increase by 5
      expect(await verifierRegistry.reputationScore(verifier.address)).to.equal(105);
    });
  });

  describe("On-Chain Slashing", function () {
    it("Should allow owner to slash a malicious verifier's stake and reduce reputation", async function () {
      await mockUsdc.connect(verifier).approve(await verifierRegistry.getAddress(), MIN_STAKE);
      await verifierRegistry.connect(verifier).stake(MIN_STAKE);

      // Slash 200 USDC
      const slashAmt = 200 * 10**6;
      await expect(
        verifierRegistry.connect(owner).slashVerifier(verifier.address, slashAmt, owner.address)
      )
        .to.emit(verifierRegistry, "Slashed")
        .withArgs(verifier.address, slashAmt, owner.address);

      expect(await verifierRegistry.stakedAmount(verifier.address)).to.equal(MIN_STAKE - slashAmt);
      expect(await verifierRegistry.reputationScore(verifier.address)).to.equal(50); // 100 - 50 = 50
    });

    it("Should block non-owner from executing slashes", async function () {
      await expect(
        verifierRegistry.connect(stranger).slashVerifier(verifier.address, 100 * 10**6, stranger.address)
      ).to.be.revertedWithCustomError(verifierRegistry, "OwnableUnauthorizedAccount");
    });
  });

  describe("Micro-Fee Rewards", function () {
    it("Should distribute premium check fees to the verifier and support rewards withdrawal", async function () {
      await mockUsdc.connect(verifier).approve(await verifierRegistry.getAddress(), MIN_STAKE);
      await verifierRegistry.connect(verifier).stake(MIN_STAKE);

      // Stranger pays check fee to verifier
      const checkFee = 5 * 10**6; // 5 USDC
      await mockUsdc.connect(stranger).approve(await verifierRegistry.getAddress(), checkFee);
      await expect(
        verifierRegistry.connect(stranger).payPremiumCertCheckFee(verifier.address, checkFee)
      )
        .to.emit(verifierRegistry, "PremiumFeePaid")
        .withArgs(stranger.address, verifier.address, checkFee);

      expect(await verifierRegistry.rewardBalance(verifier.address)).to.equal(checkFee);

      // Verifier withdraws rewards
      const startBal = await mockUsdc.balanceOf(verifier.address);
      await verifierRegistry.connect(verifier).withdrawRewards();
      const endBal = await mockUsdc.balanceOf(verifier.address);

      expect(endBal - startBal).to.equal(checkFee);
      expect(await verifierRegistry.rewardBalance(verifier.address)).to.equal(0);
    });
  });
});
