import { NextResponse, NextRequest } from 'next/server';
import { saveAccessRequest, getAccessRequests } from '@/lib/privacyDb';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const requester = searchParams.get('requester');
    const tokenIdStr = searchParams.get('tokenId');

    const requests = await getAccessRequests();

    if (requester && tokenIdStr) {
      const tokenId = parseInt(tokenIdStr);
      const req = requests.find(
        r => r.requester.toLowerCase() === requester.toLowerCase() && r.tokenId === tokenId
      );
      return NextResponse.json({ success: true, request: req || null });
    }

    if (requester) {
      const reqs = requests.filter(r => r.requester.toLowerCase() === requester.toLowerCase());
      return NextResponse.json({ success: true, requests: reqs });
    }

    return NextResponse.json({ success: true, requests });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { requester, tokenId, requesterPublicKey } = body;

    if (!requester || !tokenId || !requesterPublicKey) {
      return NextResponse.json({ success: false, error: 'Missing parameters' }, { status: 400 });
    }

    const newReq = {
      id: `req_${Math.random().toString(36).substring(2, 9)}`,
      requester,
      tokenId: parseInt(tokenId),
      encryptedKey: '',
      status: 'Pending',
      requesterPublicKey,
      createdAt: new Date().toISOString()
    };

    await saveAccessRequest(newReq);

    return NextResponse.json({
      success: true,
      message: 'Access request submitted.',
      request: newReq
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
