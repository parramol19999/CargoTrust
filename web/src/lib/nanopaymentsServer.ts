import fs from 'fs';
import path from 'path';
import { TelemetryLog } from './nanopayments';

// Memory cache for nonces to prevent replay attacks
const usedNonces = new Set<string>();

// Simple rate limiter cache
const rateLimitCache = new Map<string, number>();

// Local Database File Path (fallback if Supabase is not present)
const DB_FILE = path.join(process.cwd(), 'telemetry_db.json');

/**
 * Ensures the local database JSON file exists.
 */
function ensureDbFile() {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify([]));
  }
}

/**
 * Gets all telemetry logs from local JSON storage.
 */
export async function getTelemetryLogsFromDb(): Promise<TelemetryLog[]> {
  ensureDbFile();
  try {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    console.error('Error reading local telemetry database:', e);
    return [];
  }
}

/**
 * Saves a telemetry log to the local JSON database.
 */
export async function saveTelemetryLogToDb(log: TelemetryLog): Promise<boolean> {
  ensureDbFile();
  try {
    const logs = await getTelemetryLogsFromDb();
    log.id = Math.random().toString(36).substring(2, 11);
    logs.push(log);
    fs.writeFileSync(DB_FILE, JSON.stringify(logs, null, 2));
    return true;
  } catch (e) {
    console.error('Error writing to local telemetry database:', e);
    return false;
  }
}

import { verifyMessage } from 'viem';

/**
 * Server Helper: Validates payment token, prevents replays, checks rate limits,
 * and cryptographically verifies the EIP-191 personal signature from the buyer.
 */
export async function validatePaymentToken(
  tokenStr: string,
  ip: string
): Promise<{ success: boolean; error?: string; payload?: any }> {
  try {
    if (!tokenStr) {
      return { success: false, error: 'Payment token missing.' };
    }

    const decodedStr = Buffer.from(tokenStr, 'base64').toString('utf8');
    const payload = JSON.parse(decodedStr);

    const { nonce, amount, tokenId, buyerAddress, signature } = payload;

    if (!nonce || !amount || !tokenId || !buyerAddress || !signature) {
      return { success: false, error: 'Malformed payment token.' };
    }

    // 1. Replay Attack Prevention
    if (usedNonces.has(nonce)) {
      return { success: false, error: 'Replay attack detected: token nonce already spent.' };
    }
    usedNonces.add(nonce);

    // Keep usedNonces capped to prevent memory exhaustion
    if (usedNonces.size > 10000) {
      const first = Array.from(usedNonces)[0];
      usedNonces.delete(first);
    }

    // 2. Rate Limiting Check (max 1 request per 1 second per client IP)
    const now = Date.now();
    const lastRequestTime = rateLimitCache.get(ip) || 0;
    if (now - lastRequestTime < 1000) {
      return { success: false, error: 'Rate limit exceeded: please wait 1 second between streaming reads.' };
    }
    rateLimitCache.set(ip, now);

    // 3. Cryptographic Signature Verification
    const sessionNonce = nonce.split('-')[0];
    const message = `Authorize Telemetry Stream Session for Crop Twin #${tokenId} (Session: ${sessionNonce})`;
    const isSignatureValid = await verifyMessage({
      address: buyerAddress as `0x${string}`,
      message,
      signature: signature as `0x${string}`,
    });

    if (!isSignatureValid) {
      return { success: false, error: 'Cryptographic signature verification failed.' };
    }

    return { success: true, payload };
  } catch (e) {
    return { success: false, error: 'Invalid payment token encoding or signature format.' };
  }
}
