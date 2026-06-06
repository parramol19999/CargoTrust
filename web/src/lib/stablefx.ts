import { ethers } from 'ethers';
import { USDC_ADDRESS, EURC_ADDRESS } from './constants';

const SIGNER_PRIVATE_KEY = process.env.STABLEFX_SIGNER_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

export interface StableFXQuote {
  tokenId: number;
  fromToken: string;
  toToken: string;
  targetAmount: string; // The listed price in USDC (e.g. "100.00")
  paymentAmount: string; // The required amount in EURC (e.g. "92.59")
  rate: number; // e.g., 1 EURC = 1.08 USDC
  slippage: number; // in percentage, e.g. 0.5
  deadline: number; // UNIX timestamp
  signature: string;
}

/**
 * Circle StableFX Mock API: Computes exchange rates and generates cryptographically signed quotes.
 */
export async function generateStableFXQuote(
  tokenId: number,
  fromToken: string,
  toToken: string,
  targetAmount: string, // listed price in target currency
  buyerAddress: string,
  slippagePercent: number = 0.5
): Promise<StableFXQuote> {
  const isEurcToUsdc = fromToken.toLowerCase() === EURC_ADDRESS.toLowerCase() && toToken.toLowerCase() === USDC_ADDRESS.toLowerCase();
  
  // Real-time market rate: 1 EURC = 1.08 USDC
  // If paying with EURC for a USDC listing, EURC amount = USDC amount / 1.08
  const baseRate = 1.08;
  const rate = isEurcToUsdc ? baseRate : 1 / baseRate;

  const targetVal = parseFloat(targetAmount);
  if (isNaN(targetVal) || targetVal <= 0) {
    throw new Error('Invalid target amount');
  }

  // Calculate payment amount based on FX rate
  let paymentVal = targetVal / rate;

  // Add slippage buffer to protect against rate shifts
  const slippageFactor = 1 + slippagePercent / 100;
  paymentVal = paymentVal * slippageFactor;

  // Round to 6 decimal places (decimals for both USDC & EURC)
  const paymentAmountStr = paymentVal.toFixed(6);

  // Set quote deadline (10 minutes from now)
  const deadline = Math.floor(Date.now() / 1000) + 600;

  // Convert amounts to 6-decimal integers for the smart contract e.g. "92.592592" -> 92592592
  const paymentAmountRaw = ethers.parseUnits(paymentAmountStr, 6).toString();

  // Create Ethereum signed quote signature
  const wallet = new ethers.Wallet(SIGNER_PRIVATE_KEY);
  
  const messageHash = ethers.solidityPackedKeccak256(
    ['uint256', 'address', 'uint256', 'uint256', 'address'],
    [tokenId, fromToken, paymentAmountRaw, deadline, buyerAddress]
  );
  
  const signature = await wallet.signMessage(ethers.getBytes(messageHash));

  return {
    tokenId,
    fromToken,
    toToken,
    targetAmount,
    paymentAmount: paymentAmountStr,
    rate,
    slippage: slippagePercent,
    deadline,
    signature,
  };
}
