import fs from "fs";
import path from "path";
import solc from "solc";
import { ethers } from "ethers";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  const contractPath = path.resolve(process.cwd(), "contracts/CargoRegistry.sol");
  console.log("Reading contract from:", contractPath);
  const source = fs.readFileSync(contractPath, "utf8");

  const input = {
    language: "Solidity",
    sources: {
      "CargoRegistry.sol": {
        content: source,
      },
    },
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      outputSelection: {
        "*": {
          "*": ["abi", "evm.bytecode.object"],
        },
      },
    },
  };

  console.log("Compiling CargoRegistry...");
  const output = JSON.parse(solc.compile(JSON.stringify(input)));

  if (output.errors) {
    output.errors.forEach((err) => console.error(err.formattedMessage));
    const errors = output.errors.filter((e) => e.severity === "error");
    if (errors.length > 0) {
      console.error("Compilation failed with errors.");
      process.exit(1);
    }
  }

  const contract = output.contracts["CargoRegistry.sol"]["CargoRegistry"];
  const abi = contract.abi;
  const bytecode = contract.evm.bytecode.object;

  console.log(`ABI has ${abi.length} entries`);
  console.log(`Bytecode length: ${bytecode.length / 2} bytes`);

  // Ensure frontend directories exist
  const frontendComponentsDir = path.resolve(process.cwd(), "../web/src/components");
  if (!fs.existsSync(frontendComponentsDir)) {
    fs.mkdirSync(frontendComponentsDir, { recursive: true });
  }

  // Save ABI for frontend
  const abiPath = path.resolve(frontendComponentsDir, "CargoRegistryABI.json");
  fs.writeFileSync(abiPath, JSON.stringify(abi, null, 2));
  console.log("ABI saved to:", abiPath);

  // Deploy
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

  const factory = new ethers.ContractFactory(abi, bytecode, wallet);
  
  // Arc Testnet USDC ERC20 address
  const usdcAddress = "0x3600000000000000000000000000000000000000";
  
  console.log("Deploying contract...");
  const cargoRegistry = await factory.deploy(usdcAddress);
  console.log("Waiting for deployment confirmation...");
  await cargoRegistry.waitForDeployment();
  
  const deployedAddress = await cargoRegistry.getAddress();
  console.log("CargoRegistry deployed to:", deployedAddress);

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
        `export const CARGO_REGISTRY_ADDRESS = '${deployedAddress}' as const;`
      );
    } else {
      constantsContent += `\nexport const CARGO_REGISTRY_ADDRESS = '${deployedAddress}' as const;\n`;
    }
  } else {
    constantsContent = `// ─── Arc Testnet Chain & Contract Constants ───
export const ARC_TESTNET_CHAIN_ID = 5042002;
export const ARC_TESTNET_RPC = 'https://rpc.testnet.arc.network';
export const ARC_TESTNET_WS = 'wss://rpc.testnet.arc.network';
export const ARC_TESTNET_EXPLORER = 'https://testnet.arcscan.app';

export const USDC_ADDRESS = '0x3600000000000000000000000000000000000000' as const;
export const USDC_DECIMALS = 6;

export const CARGO_REGISTRY_ADDRESS = '${deployedAddress}' as const;
`;
  }
  fs.writeFileSync(constantsPath, constantsContent);
  console.log("Updated constants.ts with address:", deployedAddress);

  console.log("\n=== Deployment Summary ===");
  console.log("Contract: CargoRegistry");
  console.log("Address:", deployedAddress);
  console.log("Network: Arc Testnet (5042002)");
  console.log("USDC ERC20:", usdcAddress);
  console.log("Explorer: https://testnet.arcscan.app/address/" + deployedAddress);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
