import fs from "fs";
import path from "path";
import { ethers } from "ethers";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  const provider = new ethers.JsonRpcProvider(process.env.ARC_TESTNET_RPC_URL || "https://rpc.testnet.arc.network");
  
  if (!process.env.PRIVATE_KEY) {
    console.error("Error: PRIVATE_KEY not found in .env");
    process.exit(1);
  }

  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  console.log("Using account:", wallet.address);

  // Active CargoRegistry address from constants
  const registryAddress = "0x0a231C10eC37E2387Ee8024544b0210A2f9Ed98e";
  const usdcAddress = "0x3600000000000000000000000000000000000000";

  // ABI for CargoRegistry
  const artifactPath = path.resolve(process.cwd(), "artifacts/contracts/CargoRegistry.sol/CargoRegistry.json");
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  const registryAbi = artifact.abi;

  const registry = new ethers.Contract(registryAddress, registryAbi, wallet);
  const usdc = new ethers.Contract(usdcAddress, [
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)"
  ], wallet);

  // 1. Approve USDC mint fee (0.10 USDC per mint, let's approve 10 USDC)
  console.log("Checking USDC allowance...");
  const allowance = await usdc.allowance(wallet.address, registryAddress);
  if (allowance < ethers.parseUnits("1.0", 6)) {
    console.log("Approving registry to spend USDC...");
    const approveTx = await usdc.approve(registryAddress, ethers.parseUnits("10.0", 6));
    await approveTx.wait();
    console.log("Approved successfully!");
  }

  // 2. Mint trial batch 1 (3 USDC)
  console.log("Minting Trial Batch 1 (Coffee, 3 USDC)...");
  const mintTx1 = await registry["mintCargo(string,uint256,string,string,uint256)"](
    "Valle del Cauca, Colombia (Trial)",
    Math.floor(Date.now() / 1000) - 86400 * 2,
    "3.4372 N, 76.5225 W",
    "ipfs://QmTrial1?desc=Test%20Coffee%20Batch%20(Low%20Value)",
    50 // weight 50kg
  );
  const receipt1 = await mintTx1.wait();
  console.log("Minted Trial 1! Tx hash:", receipt1.hash);
  
  // Find CargoMinted event to get tokenId
  let tokenId1;
  for (const log of receipt1.logs) {
    try {
      const parsedLog = registry.interface.parseLog(log);
      if (parsedLog.name === "CargoMinted") {
        tokenId1 = parsedLog.args.tokenId;
      }
    } catch (e) {}
  }
  console.log("Trial 1 Token ID:", tokenId1.toString());

  // List Trial batch 1 for 3 USDC
  console.log(`Listing Trial Batch 1 (#${tokenId1}) for 3.0 USDC...`);
  const listTx1 = await registry.listCargo(tokenId1, ethers.parseUnits("3.0", 6));
  await listTx1.wait();
  console.log("Listed Trial 1 successfully!");

  // 3. Mint trial batch 2 (7 USDC)
  console.log("Minting Trial Batch 2 (Tea, 7 USDC)...");
  const mintTx2 = await registry["mintCargo(string,uint256,string,string,uint256)"](
    "Shizuoka, Japan (Trial)",
    Math.floor(Date.now() / 1000) - 86400 * 3,
    "34.9756 N, 138.3828 E",
    "ipfs://QmTrial2?desc=Test%20Tea%20Batch%20(Low%20Value)",
    30 // weight 30kg
  );
  const receipt2 = await mintTx2.wait();
  console.log("Minted Trial 2! Tx hash:", receipt2.hash);

  let tokenId2;
  for (const log of receipt2.logs) {
    try {
      const parsedLog = registry.interface.parseLog(log);
      if (parsedLog.name === "CargoMinted") {
        tokenId2 = parsedLog.args.tokenId;
      }
    } catch (e) {}
  }
  console.log("Trial 2 Token ID:", tokenId2.toString());

  // List Trial batch 2 for 7 USDC
  console.log(`Listing Trial Batch 2 (#${tokenId2}) for 7.0 USDC...`);
  const listTx2 = await registry.listCargo(tokenId2, ethers.parseUnits("7.0", 6));
  await listTx2.wait();
  console.log("Listed Trial 2 successfully!");

  console.log("\n=== SUCCESS ===");
  console.log(`Real on-chain trial batch 1: Token ID #${tokenId1} listed for 3.0 USDC`);
  console.log(`Real on-chain trial batch 2: Token ID #${tokenId2} listed for 7.0 USDC`);
}

main().catch(console.error);
