import fs from 'fs';
import path from 'path';

export interface AccessRequest {
  id: string;
  requester: string;
  tokenId: number;
  encryptedKey: string; // Encrypted using ECDH shared secret
  status: string; // 'Pending' | 'Approved' | 'Rejected'
  requesterPublicKey: string;
  ownerPublicKey?: string;
  createdAt: string;
}

export interface CropKey {
  tokenId: number;
  aesKey: string;
  ownerPublicKey: string;
  ownerPrivateKey: string;
  createdAt: string;
}

export interface UserECDH {
  address: string;
  publicKey: string;
  privateKey: string;
}

const REQUESTS_FILE = path.join(process.cwd(), 'access_requests_db.json');
const KEYS_FILE = path.join(process.cwd(), 'crop_keys_db.json');
const USER_KEYS_FILE = path.join(process.cwd(), 'user_ecdh_keys_db.json');

function ensureDbFile(filePath: string) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify([]));
  }
}

// Access Requests Helpers
export async function getAccessRequests(): Promise<AccessRequest[]> {
  ensureDbFile(REQUESTS_FILE);
  try {
    const data = fs.readFileSync(REQUESTS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
}

export async function saveAccessRequest(req: AccessRequest): Promise<boolean> {
  ensureDbFile(REQUESTS_FILE);
  try {
    const reqs = await getAccessRequests();
    // Prevent duplicates
    const index = reqs.findIndex(r => r.requester.toLowerCase() === req.requester.toLowerCase() && r.tokenId === req.tokenId);
    if (index !== -1) {
      reqs[index] = req;
    } else {
      reqs.push(req);
    }
    fs.writeFileSync(REQUESTS_FILE, JSON.stringify(reqs, null, 2));
    return true;
  } catch (e) {
    console.error('Error saving access request:', e);
    return false;
  }
}

export async function updateAccessRequestStatus(
  id: string,
  status: string,
  encryptedKey?: string,
  ownerPublicKey?: string
): Promise<boolean> {
  ensureDbFile(REQUESTS_FILE);
  try {
    const reqs = await getAccessRequests();
    const index = reqs.findIndex(r => r.id === id);
    if (index !== -1) {
      reqs[index].status = status;
      if (encryptedKey) reqs[index].encryptedKey = encryptedKey;
      if (ownerPublicKey) reqs[index].ownerPublicKey = ownerPublicKey;
      fs.writeFileSync(REQUESTS_FILE, JSON.stringify(reqs, null, 2));
      return true;
    }
    return false;
  } catch (e) {
    return false;
  }
}

// Crop Keys Helpers
export async function getCropKeys(): Promise<CropKey[]> {
  ensureDbFile(KEYS_FILE);
  try {
    const data = fs.readFileSync(KEYS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
}

export async function saveCropKey(
  tokenId: number,
  aesKey: string,
  ownerPublicKey: string,
  ownerPrivateKey: string
): Promise<boolean> {
  ensureDbFile(KEYS_FILE);
  try {
    const keys = await getCropKeys();
    keys.push({
      tokenId,
      aesKey,
      ownerPublicKey,
      ownerPrivateKey,
      createdAt: new Date().toISOString()
    });
    fs.writeFileSync(KEYS_FILE, JSON.stringify(keys, null, 2));
    return true;
  } catch (e) {
    return false;
  }
}

export async function getCropKey(tokenId: number): Promise<CropKey | null> {
  const keys = await getCropKeys();
  return keys.find(k => k.tokenId === tokenId) || null;
}

// User ECDH Keypair Persistance (So clients don't lose keypairs in mock environment)
export async function getUserECDHKeys(): Promise<UserECDH[]> {
  ensureDbFile(USER_KEYS_FILE);
  try {
    const data = fs.readFileSync(USER_KEYS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
}

export async function getECDHKeysForAddress(address: string): Promise<UserECDH | null> {
  const keys = await getUserECDHKeys();
  return keys.find(k => k.address.toLowerCase() === address.toLowerCase()) || null;
}

export async function saveECDHKeys(address: string, publicKey: string, privateKey: string): Promise<boolean> {
  ensureDbFile(USER_KEYS_FILE);
  try {
    const keys = await getUserECDHKeys();
    const index = keys.findIndex(k => k.address.toLowerCase() === address.toLowerCase());
    const val = { address, publicKey, privateKey };
    if (index !== -1) {
      keys[index] = val;
    } else {
      keys.push(val);
    }
    fs.writeFileSync(USER_KEYS_FILE, JSON.stringify(keys, null, 2));
    return true;
  } catch (e) {
    return false;
  }
}
