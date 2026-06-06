import { NextResponse, NextRequest } from 'next/server';
import { saveCropKey, getCropKey, getECDHKeysForAddress, saveECDHKeys } from '@/lib/privacyDb';
import { generateECDHKeyPair } from '@/lib/cryptoHelper';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');
    const tokenIdStr = searchParams.get('tokenId');

    if (tokenIdStr) {
      const tokenId = parseInt(tokenIdStr);
      const cropKey = await getCropKey(tokenId);
      return NextResponse.json({ success: true, cropKey });
    }

    if (address) {
      let ecdhKeys = await getECDHKeysForAddress(address);
      if (!ecdhKeys) {
        // Automatically generate a persistent keypair for this address if not exists
        const keys = generateECDHKeyPair();
        await saveECDHKeys(address, keys.publicKey, keys.privateKey);
        ecdhKeys = { address, ...keys };
      }
      return NextResponse.json({ success: true, ecdhKeys });
    }

    return NextResponse.json({ success: false, error: 'Missing address or tokenId' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tokenId, aesKey, ownerPublicKey, ownerPrivateKey } = body;

    if (!tokenId || !aesKey || !ownerPublicKey || !ownerPrivateKey) {
      return NextResponse.json({ success: false, error: 'Missing parameters' }, { status: 400 });
    }

    const success = await saveCropKey(
      parseInt(tokenId),
      aesKey,
      ownerPublicKey,
      ownerPrivateKey
    );

    return NextResponse.json({ success, message: 'Crop AES keys stored off-chain.' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
