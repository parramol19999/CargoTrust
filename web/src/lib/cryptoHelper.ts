import crypto from 'crypto';

/**
 * Generates a unique, high-entropy 256-bit AES key (hex representation).
 */
export function generateCropKey(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Encrypts a string value using AES-256-CBC.
 */
export function encryptValue(value: string, keyHex: string): string {
  if (!value) return '';
  const key = Buffer.from(keyHex, 'hex');
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(value, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  // Format: iv:encrypted
  return `${iv.toString('hex')}:${encrypted}`;
}

/**
 * Decrypts an AES-256-CBC encrypted string value.
 */
export function decryptValue(encryptedValue: string, keyHex: string): string {
  if (!encryptedValue || !encryptedValue.includes(':')) return '';
  try {
    const [ivHex, encryptedHex] = encryptedValue.split(':');
    const key = Buffer.from(keyHex, 'hex');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.error('Decryption failed:', err);
    return '[Decryption Error]';
  }
}

/**
 * Encrypts the crop twin metadata record (origin, latLong, price).
 */
export function encryptCropMetadata(
  origin: string,
  latLong: string,
  price: string,
  keyHex: string
) {
  return {
    origin: encryptValue(origin, keyHex),
    latLong: encryptValue(latLong, keyHex),
    price: encryptValue(price, keyHex),
  };
}

/**
 * Generates an ECDH keypair (secp256k1 curve) returning keys in hex.
 */
export function generateECDHKeyPair() {
  const ecdh = crypto.createECDH('secp256k1');
  ecdh.generateKeys();
  return {
    publicKey: ecdh.getPublicKey('hex'),
    privateKey: ecdh.getPrivateKey('hex'),
  };
}

/**
 * Encrypts the AES key using ECDH shared secret derived from recipient's public key and sender's private key.
 */
export function encryptKeyWithECDH(
  recipientPublicKeyHex: string,
  senderPrivateKeyHex: string,
  aesKeyHex: string
): string {
  try {
    const ecdh = crypto.createECDH('secp256k1');
    ecdh.setPrivateKey(Buffer.from(senderPrivateKeyHex, 'hex'));
    const sharedSecret = ecdh.computeSecret(Buffer.from(recipientPublicKeyHex, 'hex'));
    
    // Hash shared secret to create a 256-bit key
    const sharedKey = crypto.createHash('sha256').update(sharedSecret).digest();
    
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', sharedKey, iv);
    let encrypted = cipher.update(aesKeyHex, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return `${iv.toString('hex')}:${encrypted}`;
  } catch (err) {
    console.error('ECDH key encryption failed:', err);
    throw new Error('ECDH key encryption failed');
  }
}

/**
 * Decrypts the AES key using ECDH shared secret derived from sender's public key and recipient's private key.
 */
export function decryptKeyWithECDH(
  senderPublicKeyHex: string,
  recipientPrivateKeyHex: string,
  encryptedAesKeyHex: string
): string {
  try {
    const [ivHex, encryptedHex] = encryptedAesKeyHex.split(':');
    const ecdh = crypto.createECDH('secp256k1');
    ecdh.setPrivateKey(Buffer.from(recipientPrivateKeyHex, 'hex'));
    const sharedSecret = ecdh.computeSecret(Buffer.from(senderPublicKeyHex, 'hex'));
    
    const sharedKey = crypto.createHash('sha256').update(sharedSecret).digest();
    const iv = Buffer.from(ivHex, 'hex');
    
    const decipher = crypto.createDecipheriv('aes-256-cbc', sharedKey, iv);
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (err) {
    console.error('ECDH key decryption failed:', err);
    throw new Error('ECDH key decryption failed');
  }
}
