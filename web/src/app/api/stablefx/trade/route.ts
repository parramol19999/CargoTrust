import { NextResponse, NextRequest } from 'next/server';
import { ethers } from 'ethers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tokenId, quote, txHash } = body;

    if (!tokenId || !quote || !txHash) {
      return NextResponse.json(
        { error: 'Missing required body elements: tokenId, quote, txHash.' },
        { status: 400 }
      );
    }

    // Server-side audit log of the StableFX conversion
    console.log(`[StableFX Trade Settle] Token ID: ${tokenId}, Tx Hash: ${txHash}`);
    console.log(`Converted EURC ${quote.paymentAmount} to USDC ${quote.targetAmount} (Rate: ${quote.rate})`);

    return NextResponse.json({
      success: true,
      status: 'Settled',
      tradeId: `fx_trd_${Math.random().toString(36).substring(2, 11)}`,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Error recording StableFX trade:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
