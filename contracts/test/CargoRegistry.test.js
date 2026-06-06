import { expect } from "chai";
import pkg from "hardhat";
const { ethers } = pkg;

describe("CargoRegistry Contract Tests", function () {
  let mockUsdc;
  let cargoRegistry;
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
    
    // Deploy CargoRegistry with mockUsdc address
    const CargoRegistry = await ethers.getContractFactory("CargoRegistry");
    cargoRegistry = await CargoRegistry.deploy(await mockUsdc.getAddress());
    await cargoRegistry.waitForDeployment();
    
    // Fund test accounts with Mock USDC
    await mockUsdc.transfer(producer.address, 1000 * 10**6); // 1000 USDC
    await mockUsdc.transfer(buyer.address, 1000 * 10**6); // 1000 USDC
    
    // Set custom fee collector
    await cargoRegistry.setFeeCollector(feeCollector.address);
    
    // Set up authorized verifier
    await cargoRegistry.setVerifier(verifier.address, true, "Accredited Lab Alpha");
  });
  
  describe("Deployment", function () {
    it("Should set the correct USDC token address", async function () {
      expect(await cargoRegistry.usdc()).to.equal(await mockUsdc.getAddress());
    });
    
    it("Should set the correct initial owner", async function () {
      expect(await cargoRegistry.owner()).to.equal(owner.address);
    });
    
    it("Should set the correct initial fee collector", async function () {
      expect(await cargoRegistry.feeCollector()).to.equal(feeCollector.address);
    });
  });
  
  describe("Minting Digital Twin Cargo", function () {
    it("Should succeed when user has enough USDC balance and approval", async function () {
      // Approve CargoRegistry to spend mint fee
      await mockUsdc.connect(producer).approve(await cargoRegistry.getAddress(), MINT_FEE);
      
      const collectorInitialBalance = await mockUsdc.balanceOf(feeCollector.address);
      
      // Mint cargo
      const tx = await cargoRegistry.connect(producer).mintCargo(
        "Finca El Fuerte, Colombia",
        Math.floor(Date.now() / 1000),
        "4.5981,-74.0758",
        "ipfs://QmCoffeeBatch101?desc=Single-origin%20Arabica"
      );
      
      await expect(tx)
        .to.emit(cargoRegistry, "CargoMinted")
        .withArgs(
          1,
          producer.address,
          "Finca El Fuerte, Colombia",
          anyValue => true,
          "4.5981,-74.0758",
          "ipfs://QmCoffeeBatch101?desc=Single-origin%20Arabica"
        );
      
      // Check balances
      const collectorFinalBalance = await mockUsdc.balanceOf(feeCollector.address);
      expect(collectorFinalBalance - collectorInitialBalance).to.equal(MINT_FEE);
      
      expect(await cargoRegistry.ownerOf(1)).to.equal(producer.address);
      
      // Verify cargo details
      const details = await cargoRegistry.getCargoDetails(1);
      expect(details.producer).to.equal(producer.address);
      expect(details.origin).to.equal("Finca El Fuerte, Colombia");
      expect(details.latLong).to.equal("4.5981,-74.0758");
      expect(details.ipfsMetadata).to.equal("ipfs://QmCoffeeBatch101?desc=Single-origin%20Arabica");
      expect(details.priceUsdc).to.equal(0);
      expect(details.isForSale).to.be.false;
      expect(details.status).to.equal("Harvested");
    });
    
    it("Should fail if user has not approved the contract", async function () {
      await expect(
        cargoRegistry.connect(producer).mintCargo(
          "Finca El Fuerte, Colombia",
          Math.floor(Date.now() / 1000),
          "4.5981,-74.0758",
          "ipfs://QmCoffeeBatch101"
        )
      ).to.be.revertedWithCustomError(mockUsdc, "ERC20InsufficientAllowance");
    });
    
    it("Should fail if user does not have enough USDC balance", async function () {
      const signers = await ethers.getSigners();
      const poorUser = signers[5];
      await mockUsdc.connect(poorUser).approve(await cargoRegistry.getAddress(), MINT_FEE);
      
      await expect(
        cargoRegistry.connect(poorUser).mintCargo(
          "Finca El Fuerte, Colombia",
          Math.floor(Date.now() / 1000),
          "4.5981,-74.0758",
          "ipfs://QmCoffeeBatch101"
        )
      ).to.be.revertedWithCustomError(mockUsdc, "ERC20InsufficientBalance");
    });
  });
  
  describe("Listing B2B Cargo", function () {
    beforeEach(async function () {
      await mockUsdc.connect(producer).approve(await cargoRegistry.getAddress(), MINT_FEE);
      await cargoRegistry.connect(producer).mintCargo(
        "Finca El Fuerte, Colombia",
        Math.floor(Date.now() / 1000),
        "4.5981,-74.0758",
        "ipfs://QmCoffeeBatch101"
      );
    });
    
    it("Should list successfully by the owner with valid price", async function () {
      const tx = await cargoRegistry.connect(producer).listCargo(1, LIST_PRICE);
      
      await expect(tx)
        .to.emit(cargoRegistry, "CargoListed")
        .withArgs(1, LIST_PRICE);
        
      const details = await cargoRegistry.getCargoDetails(1);
      expect(details.isForSale).to.be.true;
      expect(details.priceUsdc).to.equal(LIST_PRICE);
    });
    
    it("Should fail if non-owner tries to list the cargo", async function () {
      await expect(
        cargoRegistry.connect(buyer).listCargo(1, LIST_PRICE)
      ).to.be.revertedWith("Caller is not token owner");
    });
    
    it("Should fail if price is zero", async function () {
      await expect(
        cargoRegistry.connect(producer).listCargo(1, 0)
      ).to.be.revertedWith("Price must be greater than zero");
    });
  });
  
  describe("Atomic Purchasing and Commission Settling", function () {
    beforeEach(async function () {
      await mockUsdc.connect(producer).approve(await cargoRegistry.getAddress(), MINT_FEE);
      await cargoRegistry.connect(producer).mintCargo(
        "Finca El Fuerte, Colombia",
        Math.floor(Date.now() / 1000),
        "4.5981,-74.0758",
        "ipfs://QmCoffeeBatch101"
      );
      await cargoRegistry.connect(producer).listCargo(1, LIST_PRICE);
    });
    
    it("Should transfer ownership and distribute commission fees correctly (50 bps default)", async function () {
      // Approve buyer USDC spending
      await mockUsdc.connect(buyer).approve(await cargoRegistry.getAddress(), LIST_PRICE);
      
      const collectorInitialBalance = await mockUsdc.balanceOf(feeCollector.address);
      const sellerInitialBalance = await mockUsdc.balanceOf(producer.address);
      const buyerInitialBalance = await mockUsdc.balanceOf(buyer.address);
      
      const expectedCommission = (LIST_PRICE * 50) / 10000; // 0.5% commission
      const expectedSellerPayout = LIST_PRICE - expectedCommission;
      
      const tx = await cargoRegistry.connect(buyer).purchaseCargo(1);
      
      await expect(tx)
        .to.emit(cargoRegistry, "CargoPurchased")
        .withArgs(1, producer.address, buyer.address, LIST_PRICE);
        
      await expect(tx)
        .to.emit(cargoRegistry, "StatusUpdated")
        .withArgs(1, "Ownership Transferred");
        
      // Token ownership checks
      expect(await cargoRegistry.ownerOf(1)).to.equal(buyer.address);
      
      // Balance checks
      const collectorFinalBalance = await mockUsdc.balanceOf(feeCollector.address);
      const sellerFinalBalance = await mockUsdc.balanceOf(producer.address);
      const buyerFinalBalance = await mockUsdc.balanceOf(buyer.address);
      
      expect(collectorFinalBalance - collectorInitialBalance).to.equal(expectedCommission);
      expect(sellerFinalBalance - sellerInitialBalance).to.equal(expectedSellerPayout);
      expect(buyerInitialBalance - buyerFinalBalance).to.equal(LIST_PRICE);
      
      const details = await cargoRegistry.getCargoDetails(1);
      expect(details.isForSale).to.be.false;
      expect(details.status).to.equal("Ownership Transferred");
    });
    
    it("Should work with custom platform commission bps", async function () {
      // Set commission to 2.5% (250 bps)
      await cargoRegistry.connect(owner).setPlatformCommissionBps(250);
      
      await mockUsdc.connect(buyer).approve(await cargoRegistry.getAddress(), LIST_PRICE);
      
      const collectorInitialBalance = await mockUsdc.balanceOf(feeCollector.address);
      const sellerInitialBalance = await mockUsdc.balanceOf(producer.address);
      
      const expectedCommission = (LIST_PRICE * 250) / 10000; // 2.5%
      const expectedSellerPayout = LIST_PRICE - expectedCommission;
      
      await cargoRegistry.connect(buyer).purchaseCargo(1);
      
      expect(await mockUsdc.balanceOf(feeCollector.address) - collectorInitialBalance).to.equal(expectedCommission);
      expect(await mockUsdc.balanceOf(producer.address) - sellerInitialBalance).to.equal(expectedSellerPayout);
    });
    
    it("Should work with 0% platform commission bps", async function () {
      // Set commission to 0%
      await cargoRegistry.connect(owner).setPlatformCommissionBps(0);
      
      await mockUsdc.connect(buyer).approve(await cargoRegistry.getAddress(), LIST_PRICE);
      
      const collectorInitialBalance = await mockUsdc.balanceOf(feeCollector.address);
      const sellerInitialBalance = await mockUsdc.balanceOf(producer.address);
      
      await cargoRegistry.connect(buyer).purchaseCargo(1);
      
      expect(await mockUsdc.balanceOf(feeCollector.address) - collectorInitialBalance).to.equal(0);
      expect(await mockUsdc.balanceOf(producer.address) - sellerInitialBalance).to.equal(LIST_PRICE);
    });
    
    it("Should fail if the buyer is also the seller", async function () {
      await expect(
        cargoRegistry.connect(producer).purchaseCargo(1)
      ).to.be.revertedWith("Buyer cannot be seller");
    });
    
    it("Should fail if cargo is not listed for sale", async function () {
      // Delist or purchase first
      await mockUsdc.connect(buyer).approve(await cargoRegistry.getAddress(), LIST_PRICE);
      await cargoRegistry.connect(buyer).purchaseCargo(1);
      
      // Try purchasing again
      await expect(
        cargoRegistry.connect(buyer).purchaseCargo(1)
      ).to.be.revertedWith("Cargo is not for sale");
    });
  });
  
  describe("Quality Attestations & Verification", function () {
    beforeEach(async function () {
      await mockUsdc.connect(producer).approve(await cargoRegistry.getAddress(), MINT_FEE);
      await cargoRegistry.connect(producer).mintCargo(
        "Finca El Fuerte, Colombia",
        Math.floor(Date.now() / 1000),
        "4.5981,-74.0758",
        "ipfs://QmCoffeeBatch101"
      );
    });
    
    it("Should allow authorized verifiers to add credentials", async function () {
      const tx = await cargoRegistry.connect(verifier).addVerification(
        1,
        "Organic Certified",
        "ipfs://QmCertHash1234"
      );
      
      await expect(tx)
        .to.emit(cargoRegistry, "CargoVerified")
        .withArgs(1, verifier.address, "Organic Certified", "ipfs://QmCertHash1234");
        
      const verifications = await cargoRegistry.getVerifications(1);
      expect(verifications.length).to.equal(1);
      expect(verifications[0].verifier).to.equal(verifier.address);
      expect(verifications[0].credentialType).to.equal("Organic Certified");
      expect(verifications[0].ipfsVcHash).to.equal("ipfs://QmCertHash1234");
      expect(verifications[0].verifierName).to.equal("Accredited Lab Alpha");
      
      const details = await cargoRegistry.getCargoDetails(1);
      expect(details.status).to.equal("Certified Organic Certified");
    });
    
    it("Should fail if non-authorized verifiers try to certify", async function () {
      await expect(
        cargoRegistry.connect(buyer).addVerification(1, "Organic Certified", "ipfs://QmCertHash1234")
      ).to.be.revertedWith("Caller is not an authorized verifier");
    });
    
    it("Should fail to certify non-existing tokens", async function () {
      await expect(
        cargoRegistry.connect(verifier).addVerification(999, "Organic Certified", "ipfs://QmCertHash1234")
      ).to.be.revertedWith("Token does not exist");
    });
  });
  
  describe("Admin & Access Control", function () {
    it("Should revert on unauthorized setVerifier", async function () {
      await expect(
        cargoRegistry.connect(producer).setVerifier(buyer.address, true, "Mock Lab")
      ).to.be.revertedWithCustomError(cargoRegistry, "OwnableUnauthorizedAccount");
    });
    
    it("Should revert on unauthorized setFeeCollector", async function () {
      await expect(
        cargoRegistry.connect(producer).setFeeCollector(buyer.address)
      ).to.be.revertedWithCustomError(cargoRegistry, "OwnableUnauthorizedAccount");
    });
    
    it("Should revert on setting invalid platform commission bps", async function () {
      await expect(
        cargoRegistry.connect(owner).setPlatformCommissionBps(1001) // 10.01% > 10%
      ).to.be.revertedWith("Bps exceeds maximum limit");
    });
    
    it("Should allow transfer of ownership via OpenZeppelin Ownable", async function () {
      await cargoRegistry.connect(owner).transferOwnership(producer.address);
      expect(await cargoRegistry.owner()).to.equal(producer.address);
    });
  });
  
  describe("Enumerable Functionality", function () {
    it("Should correctly track supply chain enumerations", async function () {
      await mockUsdc.connect(producer).approve(await cargoRegistry.getAddress(), MINT_FEE * 3);
      
      await cargoRegistry.connect(producer).mintCargo("Origin A", 12345, "Lat A", "ipfs A");
      await cargoRegistry.connect(producer).mintCargo("Origin B", 12345, "Lat B", "ipfs B");
      
      expect(await cargoRegistry.totalSupply()).to.equal(2);
      expect(await cargoRegistry.tokenByIndex(0)).to.equal(1);
      expect(await cargoRegistry.tokenByIndex(1)).to.equal(2);
      
      expect(await cargoRegistry.tokenOfOwnerByIndex(producer.address, 0)).to.equal(1);
      expect(await cargoRegistry.tokenOfOwnerByIndex(producer.address, 1)).to.equal(2);
    });
  });

  describe("Reentrancy Guards", function () {
    it("Should protect purchaseCargo against reentrancy attacks", async function () {
      // Deploy Malicious ERC20
      const MaliciousERC20 = await ethers.getContractFactory("MaliciousERC20");
      const maliciousUsdc = await MaliciousERC20.deploy();
      await maliciousUsdc.waitForDeployment();
      
      // Deploy CargoRegistry pointing to malicious USDC
      const CargoRegistry = await ethers.getContractFactory("CargoRegistry");
      const registry = await CargoRegistry.deploy(await maliciousUsdc.getAddress());
      await registry.waitForDeployment();
      
      // Fund producer and buyer
      await maliciousUsdc.transfer(producer.address, 100 * 10**6);
      await maliciousUsdc.transfer(buyer.address, 100 * 10**6);
      
      // Set collector
      await registry.setFeeCollector(feeCollector.address);
      
      // Approve and Mint cargo
      await maliciousUsdc.connect(producer).approve(await registry.getAddress(), MINT_FEE);
      await registry.connect(producer).mintCargo("Origin A", 12345, "Lat A", "ipfs A");
      
      // List cargo
      await registry.connect(producer).listCargo(1, LIST_PRICE);
      
      // Setup attack parameters on malicious USDC
      await maliciousUsdc.connect(buyer).approve(await registry.getAddress(), LIST_PRICE);
      await maliciousUsdc.setReentrancyAttack(await registry.getAddress(), 1, true);
      
      // Try to purchase, should revert with ReentrancyGuardReentrantCall custom error
      await expect(
        registry.connect(buyer).purchaseCargo(1)
      ).to.be.revertedWithCustomError(registry, "ReentrancyGuardReentrantCall");
    });
  });
});
