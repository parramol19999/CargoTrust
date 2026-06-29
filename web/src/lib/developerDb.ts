import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface ApiKey {
  id: string;
  rawKey?: string; // only returned once upon creation!
  hashedKey: string;
  userId: string;
  active: boolean;
}

export interface Webhook {
  id: string;
  targetUrl: string;
  events: string[];
  active: boolean;
  secret: string;
}

export interface DatabaseSchema {
  api_keys: ApiKey[];
  webhooks: Webhook[];
}

const DB_PATH = path.join(process.cwd(), '../shared_db.json');

function getDb(): DatabaseSchema {
  try {
    if (!fs.existsSync(DB_PATH)) {
      fs.writeFileSync(DB_PATH, JSON.stringify({ api_keys: [], webhooks: [] }, null, 2));
    }
  } catch (err) {
    console.warn('Warning: Cannot write shared DB file (read-only filesystem):', DB_PATH);
  }
  try {
    const data = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading shared database in Next.js:', err);
    return { api_keys: [], webhooks: [] };
  }
}

function saveDb(db: DatabaseSchema) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
  } catch (err) {
    console.error('Error writing shared database in Next.js:', err);
  }
}

export async function createApiKey(userId: string): Promise<ApiKey & { rawKey: string }> {
  const db = getDb();
  const rawKey = `cg_live_${crypto.randomBytes(24).toString('hex')}`;
  const hashedKey = crypto.createHash('sha256').update(rawKey).digest('hex');
  const id = crypto.randomBytes(8).toString('hex');

  const newKey: ApiKey = {
    id,
    hashedKey,
    userId,
    active: true
  };

  db.api_keys.push(newKey);
  saveDb(db);

  return {
    ...newKey,
    rawKey
  };
}

export async function getApiKeys(): Promise<ApiKey[]> {
  const db = getDb();
  return db.api_keys;
}

export async function toggleApiKey(id: string, active: boolean): Promise<boolean> {
  const db = getDb();
  const idx = db.api_keys.findIndex((k) => k.id === id);
  if (idx === -1) return false;
  db.api_keys[idx].active = active;
  saveDb(db);
  return true;
}

export async function deleteApiKey(id: string): Promise<boolean> {
  const db = getDb();
  db.api_keys = db.api_keys.filter((k) => k.id !== id);
  saveDb(db);
  return true;
}

export async function createWebhook(targetUrl: string, events: string[]): Promise<Webhook> {
  const db = getDb();
  const id = crypto.randomBytes(8).toString('hex');
  const secret = `whsec_${crypto.randomBytes(16).toString('hex')}`;

  const newWebhook: Webhook = {
    id,
    targetUrl,
    events,
    active: true,
    secret
  };

  db.webhooks.push(newWebhook);
  saveDb(db);

  return newWebhook;
}

export async function getWebhooks(): Promise<Webhook[]> {
  const db = getDb();
  return db.webhooks;
}

export async function toggleWebhook(id: string, active: boolean): Promise<boolean> {
  const db = getDb();
  const idx = db.webhooks.findIndex((w) => w.id === id);
  if (idx === -1) return false;
  db.webhooks[idx].active = active;
  saveDb(db);
  return true;
}

export async function deleteWebhook(id: string): Promise<boolean> {
  const db = getDb();
  db.webhooks = db.webhooks.filter((w) => w.id !== id);
  saveDb(db);
  return true;
}
