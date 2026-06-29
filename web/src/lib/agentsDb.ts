import fs from 'fs';
import path from 'path';

export interface ActiveAgent {
  id: string;
  name: string;
  agentWalletAddress: string;
  deviceId: string;
  status: string;
  agentURI?: string;
  createdAt: string;
}

const DB_FILE = path.join(process.cwd(), 'agents_db.json');

function ensureDbFile() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify([]));
    }
  } catch (e) {
    console.warn('Warning: Cannot write agents DB file (read-only filesystem):', DB_FILE);
  }
}

export async function getActiveAgents(): Promise<ActiveAgent[]> {
  ensureDbFile();
  try {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    console.error('Error reading active agents database:', e);
    return [];
  }
}

export async function saveActiveAgent(agent: ActiveAgent): Promise<boolean> {
  ensureDbFile();
  try {
    const agents = await getActiveAgents();
    // Prevent duplicate deviceId
    const index = agents.findIndex(a => a.deviceId === agent.deviceId);
    if (index !== -1) {
      agents[index] = agent;
    } else {
      agents.push(agent);
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(agents, null, 2));
    return true;
  } catch (e) {
    console.error('Error writing to active agents database:', e);
    return false;
  }
}
