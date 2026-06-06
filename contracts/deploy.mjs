import fs from "fs";
import path from "path";
import { ethers } from "ethers";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  const artifactPath = path.resolve(process.cwd(), "artifacts/contracts/CargoRegistry.sol/CargoRegistry.json");
  console.log("Loading compiled artifact from:", artifactPath);

  if (!fs.existsSync(artifactPath)) {
    console.error("Error: Artifact not found. Run 'npx hardhat compile' or 'npm run compile' first.");
    process.exit(1);
  }

  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  const abi = artifact.abi;
  const bytecode = artifact.bytecode;

  console.log(`ABI has ${abi.length} entries`);
  console.log(`Bytecode length: ${bytecode.length / 2 - 1} bytes`);

  // Ensure frontend directories exist
  const frontendComponentsDir = path.resolve(process.cwd(), "../web/src/components");
  if (!fs.existsSync(frontendComponentsDir)) {
    fs.mkdirSync(frontendComponentsDir, { recursive: true });
  }

  // Save CargoRegistry ABI for frontend
  const abiPath = path.resolve(frontendComponentsDir, "CargoRegistryABI.json");
  fs.writeFileSync(abiPath, JSON.stringify(abi, null, 2));
  console.log("CargoRegistry ABI saved to:", abiPath);

  // Load CargoEscrow Artifact
  const escrowArtifactPath = path.resolve(process.cwd(), "artifacts/contracts/CargoEscrow.sol/CargoEscrow.json");
  if (!fs.existsSync(escrowArtifactPath)) {
    console.error("Error: CargoEscrow Artifact not found. Run compile first.");
    process.exit(1);
  }
  const escrowArtifact = JSON.parse(fs.readFileSync(escrowArtifactPath, "utf8"));
  const escrowAbi = escrowArtifact.abi;
  const escrowBytecode = escrowArtifact.bytecode;

  // Save CargoEscrow ABI for frontend
  const escrowAbiPath = path.resolve(frontendComponentsDir, "CargoEscrowABI.json");
  fs.writeFileSync(escrowAbiPath, JSON.stringify(escrowAbi, null, 2));
  console.log("CargoEscrow ABI saved to:", escrowAbiPath);

  // Load AgentRegistry Artifact
  const agentArtifactPath = path.resolve(process.cwd(), "artifacts/contracts/AgentRegistry.sol/AgentRegistry.json");
  if (!fs.existsSync(agentArtifactPath)) {
    console.error("Error: AgentRegistry Artifact not found. Run compile first.");
    process.exit(1);
  }
  const agentArtifact = JSON.parse(fs.readFileSync(agentArtifactPath, "utf8"));
  const agentAbi = agentArtifact.abi;
  const agentBytecode = agentArtifact.bytecode;

  // Save AgentRegistry ABI for frontend
  const agentAbiPath = path.resolve(frontendComponentsDir, "AgentRegistryABI.json");
  fs.writeFileSync(agentAbiPath, JSON.stringify(agentAbi, null, 2));
  console.log("AgentRegistry ABI saved to:", agentAbiPath);

  // Deploy Setup
  console.log("Connecting to Arc Testnet...");
  const provider = new ethers.JsonRpcProvider(process.env.ARC_TESTNET_RPC_URL || "https://rpc.testnet.arc.network");
  
  if (!process.env.PRIVATE_KEY) {
    console.error("Error: PRIVATE_KEY not found in .env");
    process.exit(1);
  }

  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  console.log("Deploying from:", wallet.address);
  const balance = await provider.getBalance(wallet.address);
  console.log("Deployer balance:", ethers.formatEther(balance), "USDC (native)");

  // Arc Testnet USDC ERC20 address
  const usdcAddress = "0x3600000000000000000000000000000000000000";

  // Deploy CargoRegistry
  console.log("Deploying CargoRegistry contract...");
  const registryFactory = new ethers.ContractFactory(abi, bytecode, wallet);
  const cargoRegistry = await registryFactory.deploy(usdcAddress);
  console.log("Waiting for CargoRegistry deployment confirmation...");
  await cargoRegistry.waitForDeployment();
  const registryAddress = await cargoRegistry.getAddress();
  console.log("CargoRegistry deployed to:", registryAddress);

  // Deploy CargoEscrow
  console.log("Deploying CargoEscrow contract...");
  const escrowFactory = new ethers.ContractFactory(escrowAbi, escrowBytecode, wallet);
  const cargoEscrow = await escrowFactory.deploy(registryAddress);
  console.log("Waiting for CargoEscrow deployment confirmation...");
  await cargoEscrow.waitForDeployment();
  const escrowAddress = await cargoEscrow.getAddress();
  console.log("CargoEscrow deployed to:", escrowAddress);

  // Deploy AgentRegistry
  console.log("Deploying AgentRegistry contract...");
  const agentFactory = new ethers.ContractFactory(agentAbi, agentBytecode, wallet);
  const agentRegistry = await agentFactory.deploy();
  console.log("Waiting for AgentRegistry deployment confirmation...");
  await agentRegistry.waitForDeployment();
  const agentRegistryAddress = await agentRegistry.getAddress();
  console.log("AgentRegistry deployed to:", agentRegistryAddress);

  // Link Escrow on Registry
  console.log("Linking Escrow to Registry...");
  const linkTx = await cargoRegistry.setCargoEscrow(escrowAddress);
  await linkTx.wait();
  console.log("Linked escrow on-chain!");

  // Link AgentRegistry on Registry
  console.log("Linking AgentRegistry to Registry...");
  const linkAgentTx = await cargoRegistry.setAgentRegistry(agentRegistryAddress);
  await linkAgentTx.wait();
  console.log("Linked AgentRegistry on-chain!");

  // Ensure frontend lib directory exists
  const frontendLibDir = path.resolve(process.cwd(), "../web/src/lib");
  if (!fs.existsSync(frontendLibDir)) {
    fs.mkdirSync(frontendLibDir, { recursive: true });
  }

  // Save or update constants.ts
  const constantsPath = path.resolve(frontendLibDir, "constants.ts");
  let constantsContent = "";
  if (fs.existsSync(constantsPath)) {
    constantsContent = fs.readFileSync(constantsPath, "utf8");
    if (constantsContent.includes("CARGO_REGISTRY_ADDRESS")) {
      constantsContent = constantsContent.replace(
        /export const CARGO_REGISTRY_ADDRESS = '0x[a-fA-F0-9]+' as const;/,
        `export const CARGO_REGISTRY_ADDRESS = '${registryAddress}' as const;`
      );
    } else {
      constantsContent += `\nexport const CARGO_REGISTRY_ADDRESS = '${registryAddress}' as const;\n`;
    }

    if (constantsContent.includes("CARGO_ESCROW_ADDRESS")) {
      constantsContent = constantsContent.replace(
        /export const CARGO_ESCROW_ADDRESS = '0x[a-fA-F0-9]+' as const;/,
        `export const CARGO_ESCROW_ADDRESS = '${escrowAddress}' as const;`
      );
    } else {
      constantsContent += `\nexport const CARGO_ESCROW_ADDRESS = '${escrowAddress}' as const;\n`;
    }

    if (constantsContent.includes("AGENT_REGISTRY_ADDRESS")) {
      constantsContent = constantsContent.replace(
        /export const AGENT_REGISTRY_ADDRESS = '0x[a-fA-F0-9]+' as const;/,
        `export const AGENT_REGISTRY_ADDRESS = '${agentRegistryAddress}' as const;`
      );
    } else {
      constantsContent += `\nexport const AGENT_REGISTRY_ADDRESS = '${agentRegistryAddress}' as const;\n`;
    }
  } else {
    constantsContent = `// ─── Arc Testnet Chain & Contract Constants ───
export const ARC_TESTNET_CHAIN_ID = 5042002;
export const ARC_TESTNET_RPC = 'https://rpc.testnet.arc.network';
export const ARC_TESTNET_WS = 'wss://rpc.testnet.arc.network';
export const ARC_TESTNET_EXPLORER = 'https://testnet.arcscan.app';

export const USDC_ADDRESS = '0x3600000000000000000000000000000000000000' as const;
export const USDC_DECIMALS = 6;

export const CARGO_REGISTRY_ADDRESS = '${registryAddress}' as const;
export const CARGO_ESCROW_ADDRESS = '${escrowAddress}' as const;
export const AGENT_REGISTRY_ADDRESS = '${agentRegistryAddress}' as const;
`;
  }
  fs.writeFileSync(constantsPath, constantsContent);
  console.log("Updated constants.ts with registry, escrow, and agent registry addresses.");

  console.log("\n=== Deployment Summary ===");
  console.log("Registry Address:", registryAddress);
  console.log("Escrow Address:", escrowAddress);
  console.log("Agent Registry Address:", agentRegistryAddress);
  console.log("Network: Arc Testnet (5042002)");
  console.log("USDC ERC20:", usdcAddress);
  console.log("Explorer: https://testnet.arcscan.app/address/" + registryAddress);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
