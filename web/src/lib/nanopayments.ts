export interface TelemetryLog {
  id?: string;
  tokenId: number;
  temperature: number;
  latitude: string;
  longitude: string;
  timestamp: string;
  paymentRef: string;
}

/**
 * Client Helper: Initiates a client-side Nanopayment payment token.
 */
export function generateClientPaymentToken(
  buyerAddress: string,
  amount: string = '0.000001',
  tokenId: number
): string {
  const nonce = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  const payload = {
    buyerAddress,
    amount,
    currency: 'USDC',
    tokenId,
    nonce,
    signature: `sig_${Math.random().toString(36).substring(2, 15)}`, // Simulated cryptographic signature from buyer modular wallet
  };
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

/**
 * Generates mock IoT sensor reading for a specific batch/token ID.
 */
export function generateMockTelemetryReading(tokenId: number): Omit<TelemetryLog, 'paymentRef'> {
  // Cold-chain target: 2.0 to 8.0 degrees Celsius
  const baseTemp = 4.5;
  const variance = Math.sin(Date.now() / 10000) * 1.5 + (Math.random() - 0.5) * 0.4;
  const temperature = parseFloat((baseTemp + variance).toFixed(2));

  // Latitude and longitude mock variance around Buenos Aires
  const baseLat = -34.6037;
  const baseLong = -58.3816;
  const latOffset = Math.sin(Date.now() / 50000) * 0.01;
  const longOffset = Math.cos(Date.now() / 50000) * 0.01;

  return {
    tokenId,
    temperature,
    latitude: (baseLat + latOffset).toFixed(6),
    longitude: (baseLong + longOffset).toFixed(6),
    timestamp: new Date().toISOString(),
  };
}
