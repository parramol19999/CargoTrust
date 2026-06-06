import { NextResponse, NextRequest } from 'next/server';
import { generateStableFXQuote } from '@/lib/stablefx';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tokenIdStr = searchParams.get('tokenId');
  const fromToken = searchParams.get('fromToken');
  const toToken = searchParams.get('toToken');
  const targetAmount = searchParams.get('targetAmount');
  const buyerAddress = searchParams.get('buyerAddress');
  const slippageStr = searchParams.get('slippage');

  if (!tokenIdStr || !fromToken || !toToken || !targetAmount || !buyerAddress) {
    return NextResponse.json(
      { error: 'Missing required parameters: tokenId, fromToken, toToken, targetAmount, buyerAddress.' },
      { status: 400 }
    );
  }

  try {
    const tokenId = parseInt(tokenIdStr);
    const slippage = slippageStr ? parseFloat(slippageStr) : 0.5;

    const quote = await generateStableFXQuote(
      tokenId,
      fromToken,
      toToken,
      targetAmount,
      buyerAddress,
      slippage
    );

    return NextResponse.json({ success: true, quote });
  } catch (error: any) {
    console.error('Error generating StableFX quote:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
