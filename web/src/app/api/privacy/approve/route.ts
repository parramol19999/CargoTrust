import { NextResponse, NextRequest } from 'next/server';
import { getAccessRequests, updateAccessRequestStatus, getCropKey } from '@/lib/privacyDb';
import { encryptKeyWithECDH } from '@/lib/cryptoHelper';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ success: false, error: 'Missing id or status' }, { status: 400 });
    }

    if (status === 'Rejected') {
      const success = await updateAccessRequestStatus(id, 'Rejected');
      return NextResponse.json({ success, message: 'Request rejected' });
    }

    // Find the request
    const reqs = await getAccessRequests();
    const req = reqs.find(r => r.id === id);
    if (!req) {
      return NextResponse.json({ success: false, error: 'Request not found' }, { status: 444 });
    }

    // Get the crop key
    const cropKeyData = await getCropKey(req.tokenId);
    if (!cropKeyData) {
      return NextResponse.json({ success: false, error: 'Crop key not found for this token' }, { status: 404 });
    }

    // Encrypt the AES key using ECDH
    // Recipient = requester, Sender = owner
    const encryptedAesKey = encryptKeyWithECDH(
      req.requesterPublicKey,
      cropKeyData.ownerPrivateKey,
      cropKeyData.aesKey
    );

    // Update the request status
    const success = await updateAccessRequestStatus(
      id,
      'Approved',
      encryptedAesKey,
      cropKeyData.ownerPublicKey
    );

    return NextResponse.json({
      success,
      message: 'Request approved, key shared securely using ECDH.',
      encryptedKey: encryptedAesKey,
      ownerPublicKey: cropKeyData.ownerPublicKey
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
