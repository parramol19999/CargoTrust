import * as fs from 'fs';
import * as path from 'path';

export interface ApiKey {
  id: string;
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

export function getDatabase(): DatabaseSchema {
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({ api_keys: [], webhooks: [] }, null, 2));
  }
  try {
    const data = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading shared database:', err);
    return { api_keys: [], webhooks: [] };
  }
}

export function saveDatabase(db: DatabaseSchema) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
  } catch (err) {
    console.error('Error writing to shared database:', err);
  }
}
