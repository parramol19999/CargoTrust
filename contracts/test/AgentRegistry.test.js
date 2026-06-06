import { expect } from "chai";
import pkg from "hardhat";
const { ethers } = pkg;

describe("CargoTrust AgentRegistry Tests", function () {
  let mockUsdc;
  let cargoRegistry;
  let agentRegistry;
  let owner;
  let producer;
  let verifier;
  let agentWallet;
  let stranger;
  
  const MINT_FEE = 100000; // 0.10 USDC (6 decimals)
  
  beforeEach(async function () {
    [owner, producer, verifier, agentWallet, stranger] = await ethers.getSigners();
    
    // Deploy Mock USDC
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    mockUsdc = await MockUSDC.deploy();
    await mockUsdc.waitForDeployment();
    
    // Deploy CargoRegistry
    const CargoRegistry = await ethers.getContractFactory("CargoRegistry");
    cargoRegistry = await CargoRegistry.deploy(await mockUsdc.getAddress());
    await cargoRegistry.waitForDeployment();

    // Deploy AgentRegistry
    const AgentRegistry = await ethers.getContractFactory("AgentRegistry");
    agentRegistry = await AgentRegistry.deploy();
    await agentRegistry.waitForDeployment();

    // Link AgentRegistry to CargoRegistry
    await cargoRegistry.setAgentRegistry(await agentRegistry.getAddress());
    
    // Fund producer
    await mockUsdc.transfer(producer.address, 1000 * 10**6);
    
    // Set verifier
    await cargoRegistry.setVerifier(verifier.address, true, "Accredited Lab Alpha");

    // Mint cargo twin
    await mockUsdc.connect(producer).approve(await cargoRegistry.getAddress(), MINT_FEE);
    await cargoRegistry.connect(producer).mintCargo(
      "Finca El Fuerte, Colombia",
      Math.floor(Date.now() / 1000),
      "4.5981,-74.0758",
      "ipfs://QmCoffeeBatch101?desc=Single-origin%20Arabica"
    );
  });
  
  describe("Agent Registration", function () {
    it("Should allow owner to register agent and retrieve URI", async function () {
      const tx = await agentRegistry.registerAgent(
        agentWallet.address,
        "ipfs://QmAgent12345"
      );
      await expect(tx)
        .to.emit(agentRegistry, "AgentRegistered")
        .withArgs(1, agentWallet.address, "ipfs://QmAgent12345");

      expect(await agentRegistry.isRegisteredAgent(agentWallet.address)).to.be.true;
      expect(await agentRegistry.agentURI(1)).to.equal("ipfs://QmAgent12345");
      expect(await agentRegistry.agentToTokenId(agentWallet.address)).to.equal(1);
      expect(await agentRegistry.agentWallets(1)).to.equal(agentWallet.address);
    });

    it("Should reject duplicate agent registrations", async function () {
      await agentRegistry.registerAgent(agentWallet.address, "ipfs://QmAgent12345");
      await expect(
        agentRegistry.registerAgent(agentWallet.address, "ipfs://QmAgent54321")
      ).to.be.revertedWith("Agent already registered");
    });
  });

  describe("Autonomous Status Updates", function () {
    it("Should block unauthorized stranger from updating status", async function () {
      await expect(
        cargoRegistry.connect(stranger).updateStatus(1, "In Transit")
      ).to.be.revertedWith("Not authorized to update status");
    });

    it("Should allow registered agent wallet to update cargo status on-chain", async function () {
      // Register agent wallet
      await agentRegistry.registerAgent(agentWallet.address, "ipfs://QmAgent12345");

      // Execute update status using agent wallet
      const tx = await cargoRegistry.connect(agentWallet).updateStatus(1, "In Transit");
      await expect(tx)
        .to.emit(cargoRegistry, "StatusUpdated")
        .withArgs(1, "In Transit");

      const details = await cargoRegistry.getCargoDetails(1);
      expect(details.status).to.equal("In Transit");
    });
  });
});
