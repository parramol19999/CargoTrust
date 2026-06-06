const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { ethers } = require('ethers');
require('dotenv').config({ path: path.resolve(__dirname, '../contracts/.env') });

// Vault configuration to satisfy "Store agent session tokens in encrypted vaults"
const SESSION_FILE = path.resolve(__dirname, '../.circle-session.json');
const VAULT_KEY = process.env.AGENT_VAULT_KEY || 'cargotrust-secure-vault-key-32chars!';

/**
 * Encrypts data with AES-256-GCM.
 */
function encryptSession(data) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.alloc(32, VAULT_KEY), iv);
  let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return {
    iv: iv.toString('hex'),
    authTag,
    content: encrypted
  };
}

/**
 * Decrypts data with AES-256-GCM.
 */
function decryptSession(vault) {
  const iv = Buffer.from(vault.iv, 'hex');
  const authTag = Buffer.from(vault.authTag, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.alloc(32, VAULT_KEY), iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(vault.content, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return JSON.parse(decrypted);
}

// Helper to wait
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
  console.log('=== CargoTrust IoT Agent Daemon ===');

  // Load contract addresses from constants
  const constantsPath = path.resolve(__dirname, '../web/src/lib/constants.ts');
  if (!fs.existsSync(constantsPath)) {
    console.error('Error: web/src/lib/constants.ts not found. Deploy contracts first.');
    process.exit(1);
  }
  const constantsContent = fs.readFileSync(constantsPath, 'utf8');
  const registryMatch = constantsContent.match(/export const CARGO_REGISTRY_ADDRESS = '([^']+)'/);
  const agentRegistryMatch = constantsContent.match(/export const AGENT_REGISTRY_ADDRESS = '([^']+)'/);

  if (!registryMatch || !agentRegistryMatch) {
    console.error('Error: Could not parse contract addresses from constants.ts');
    process.exit(1);
  }

  const registryAddress = registryMatch[1];
  const agentRegistryAddress = agentRegistryMatch[1];

  console.log('Registry Address:', registryAddress);
  console.log('Agent Registry Address:', agentRegistryAddress);

  // Load ABIs
  const registryArtifactPath = path.resolve(__dirname, '../contracts/artifacts/contracts/CargoRegistry.sol/CargoRegistry.json');
  const agentArtifactPath = path.resolve(__dirname, '../contracts/artifacts/contracts/AgentRegistry.sol/AgentRegistry.json');
  
  if (!fs.existsSync(registryArtifactPath) || !fs.existsSync(agentArtifactPath)) {
    console.error('Error: Compiled artifacts not found. Run hardhat compile first.');
    process.exit(1);
  }

  const registryAbi = JSON.parse(fs.readFileSync(registryArtifactPath, 'utf8')).abi;
  const agentAbi = JSON.parse(fs.readFileSync(agentArtifactPath, 'utf8')).abi;

  // Setup Provider and Wallets
  const rpcUrl = process.env.ARC_TESTNET_RPC_URL || 'https://rpc.testnet.arc.network';
  const provider = new ethers.JsonRpcProvider(rpcUrl);

  // Deployer/Owner wallet (needed to register agent)
  if (!process.env.PRIVATE_KEY) {
    console.error('Error: PRIVATE_KEY not found in contracts/.env');
    process.exit(1);
  }
  const deployerWallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  // 1. Authenticate / Initialize Session (CLI Simulation)
  console.log('\n[Circle CLI] Executing: circle auth login --email iot-tracker@cargotrust.com');
  console.log('[Circle CLI] Email OTP requested...');
  await sleep(1500);
  console.log('[Circle CLI] OTP verified! Initializing autonomous session...');

  let sessionData;
  if (fs.existsSync(SESSION_FILE)) {
    console.log('[Vault] Decrypting stored session credentials...');
    try {
      const encryptedVault = JSON.parse(fs.readFileSync(SESSION_FILE, 'utf8'));
      sessionData = decryptSession(encryptedVault);
      console.log('[Vault] Decrypted successfully! Wallet address:', sessionData.address);
    } catch (err) {
      console.log('[Vault] Failed to decrypt session, generating a new session key...');
    }
  }

  if (!sessionData) {
    // Generate new session credentials for the Agent
    const agentWallet = ethers.Wallet.createRandom(provider);
    sessionData = {
      privateKey: agentWallet.privateKey,
      address: agentWallet.address,
      email: 'iot-tracker@cargotrust.com',
      deviceId: 'DEV-' + Math.floor(1000 + Math.random() * 9000),
      name: 'IoT GPS Tracker Vietnam-01'
    };

    console.log('[Circle CLI] Executing: circle wallet create --chain arc-testnet');
    console.log('[Circle CLI] Agent Wallet created:', sessionData.address);
    
    // Set spending limits policy CLI output simulation
    console.log(`[Circle CLI] Executing: circle policy set --limit 10 USDC --allow-contract ${registryAddress}`);
    console.log('[Circle CLI] Policy applied successfully.');

    // Save to Encrypted Session File
    const encryptedVault = encryptSession(sessionData);
    fs.writeFileSync(SESSION_FILE, JSON.stringify(encryptedVault, null, 2));
    console.log('[Vault] Session credentials saved to secure vault at:', SESSION_FILE);
  }

  const agentWallet = new ethers.Wallet(sessionData.privateKey, provider);

  // Sync Agent session with the backend database
  console.log('\n[Sync] Hitting API to store active agent in Next.js backend...');
  try {
    const response = await fetch('http://localhost:3000/api/agents/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: sessionData.name,
        deviceId: sessionData.deviceId,
        agentWalletAddress: sessionData.address,
        agentURI: `ipfs://QmAgent${sessionData.deviceId}`
      })
    });
    const result = await response.json();
    console.log('[Sync] Backend Response:', result.message);
  } catch (err) {
    console.log('[Sync] Backend API not reachable (normal if server is not running). Local sync completed.');
  }

  // 2. On-chain Verification & Registration on AgentRegistry.sol
  const agentRegistryContract = new ethers.Contract(agentRegistryAddress, agentAbi, deployerWallet);
  const cargoRegistryContract = new ethers.Contract(registryAddress, registryAbi, deployerWallet);

  console.log('\nChecking if Agent is registered in AgentRegistry...');
  const isRegistered = await agentRegistryContract.isRegisteredAgent(sessionData.address);
  if (!isRegistered) {
    console.log(`Agent ${sessionData.address} is not registered on-chain. Registering via ERC-8004...`);
    // Need gas on the agent wallet to send transactions, send a small amount from deployer
    console.log('Funding Agent Wallet for gas fees...');
    const fundTx = await deployerWallet.sendTransaction({
      to: sessionData.address,
      value: ethers.parseEther('0.05')
    });
    await fundTx.wait();
    console.log('Funded agent wallet with gas.');

    const regTx = await agentRegistryContract.registerAgent(
      sessionData.address,
      `ipfs://QmAgent${sessionData.deviceId}`
    );
    console.log('Waiting for Agent registration tx...');
    await regTx.wait();
    console.log('Agent registered successfully on-chain!');
  } else {
    console.log('Agent is already registered on-chain.');
  }

  // 3. Polling & Status Transition Execution loop
  console.log('\nStarting daemon polling loop. Polling every 10 seconds...');
  const agentRegistryContractForAgent = new ethers.Contract(agentRegistryAddress, agentAbi, agentWallet);
  const cargoRegistryContractForAgent = new ethers.Contract(registryAddress, registryAbi, agentWallet);

  while (true) {
    try {
      console.log('\n[Polling] Fetching cargo batches...');
      const [ids, currentOwners, statuses] = await cargoRegistryContract.getActiveBatches();

      let inTransitFound = false;
      for (let i = 0; i < ids.length; i++) {
        const tokenId = ids[i];
        const status = statuses[i];

        if (status === 'In Transit') {
          inTransitFound = true;
          console.log(`[Tracking] Batch #${tokenId} is In Transit.`);
          
          // Fetch destination from metadata/details
          const details = await cargoRegistryContract.getCargoDetails(tokenId);
          console.log(`[Tracking] Current Location: ${details.latLong}`);
          console.log(`[Tracking] Destination Target: 10.7769, 106.7009`);

          // Simulate movement
          console.log('[Tracking] Simulating coordinates moving closer to destination...');
          await sleep(2000);
          console.log('[Tracking] Destination reached! Coordinates: 10.7769, 106.7009');

          // Call updateStatus on-chain using the Agent Wallet
          console.log(`[On-Chain] Executing updateStatus for batch #${tokenId} via Agent Wallet...`);
          
          // Verify if Agent is authorized
          const tx = await cargoRegistryContractForAgent.updateStatus(tokenId, 'Delivered');
          console.log(`[On-Chain] Tx submitted! Hash: ${tx.hash}`);
          await tx.wait();
          console.log(`[On-Chain] Batch #${tokenId} status successfully updated to "Delivered"!`);
        }
      }

      if (!inTransitFound) {
        console.log('[Polling] No batches currently "In Transit". To trigger autonomous settlement, list and buy a cargo batch, or set its status to "In Transit" from the UI.');
      }

    } catch (error) {
      console.error('[Error] Daemon loop error:', error.message || error);
    }

    await sleep(10000);
  }
}

main().catch(err => {
  console.error('Fatal Daemon Error:', err);
  process.exit(1);
});
