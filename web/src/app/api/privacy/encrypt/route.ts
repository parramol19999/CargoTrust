import { NextResponse, NextRequest } from 'next/server';
import { generateCropKey, encryptValue } from '@/lib/cryptoHelper';
import { getECDHKeysForAddress, saveECDHKeys } from '@/lib/privacyDb';
import { generateECDHKeyPair } from '@/lib/cryptoHelper';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { origin, latLong, description, price, address } = body;

    if (!address) {
      return NextResponse.json({ success: false, error: 'Address is required' }, { status: 400 });
    }

    // Generate unique AES key
    const aesKey = generateCropKey();

    // Encrypt fields
    const encOrigin = encryptValue(origin || '', aesKey);
    const encLatLong = encryptValue(latLong || '', aesKey);
    const encDescription = encryptValue(description || '', aesKey);
    const encPrice = encryptValue(price || '0', aesKey);

    // Fetch or generate ECDH keys for the owner address
    let ecdhKeys = await getECDHKeysForAddress(address);
    if (!ecdhKeys) {
      const keys = generateECDHKeyPair();
      await saveECDHKeys(address, keys.publicKey, keys.privateKey);
      ecdhKeys = { address, ...keys };
    }

    return NextResponse.json({
      success: true,
      aesKey,
      ownerPublicKey: ecdhKeys.publicKey,
      ownerPrivateKey: ecdhKeys.privateKey,
      encrypted: {
        origin: encOrigin,
        latLong: encLatLong,
        description: encDescription,
        price: encPrice
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
