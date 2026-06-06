import { NextResponse, NextRequest } from 'next/server';
import { getAccessRequests, getCropKey } from '@/lib/privacyDb';
import { decryptValue } from '@/lib/cryptoHelper';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tokenId, requester, producer, encryptedData } = body;

    if (!tokenId || !requester || !encryptedData) {
      return NextResponse.json({ success: false, error: 'Missing parameters' }, { status: 400 });
    }

    // Check authorization:
    // 1. Either requester is the producer
    // 2. Or there is an approved access request for this requester and tokenId
    const cropKeyData = await getCropKey(parseInt(tokenId));
    if (!cropKeyData) {
      return NextResponse.json({ success: false, error: 'Crop key metadata not found' }, { status: 404 });
    }

    // Securely resolve on-chain owner/producer (handles lending pool locking too)
    const { createPublicClient, http } = await import('viem');
    const { CARGO_REGISTRY_ADDRESS, CROP_LENDING_POOL_ADDRESS, ARC_TESTNET_RPC } = await import('@/lib/constants');

    const publicClient = createPublicClient({
      transport: http(ARC_TESTNET_RPC)
    });

    let onChainOwner = '';
    try {
      onChainOwner = await publicClient.readContract({
        address: CARGO_REGISTRY_ADDRESS,
        abi: [{ name: 'ownerOf', type: 'function', stateMutability: 'view', inputs: [{ name: 'tokenId', type: 'uint256' }], outputs: [{ name: '', type: 'address' }] }],
        functionName: 'ownerOf',
        args: [BigInt(tokenId)]
      }) as string;

      if (onChainOwner.toLowerCase() === CROP_LENDING_POOL_ADDRESS.toLowerCase()) {
        onChainOwner = await publicClient.readContract({
          address: CROP_LENDING_POOL_ADDRESS,
          abi: [{ name: 'getBorrower', type: 'function', stateMutability: 'view', inputs: [{ name: 'tokenId', type: 'uint256' }], outputs: [{ name: '', type: 'address' }] }],
          functionName: 'getBorrower',
          args: [BigInt(tokenId)]
        }) as string;
      }
    } catch (err) {
      console.error('On-chain owner check failed:', err);
    }

    const isProducer = onChainOwner && requester.toLowerCase() === onChainOwner.toLowerCase();
    
    // Check access requests
    const reqs = await getAccessRequests();
    const isApproved = reqs.some(
      r => r.requester.toLowerCase() === requester.toLowerCase() && 
           r.tokenId === parseInt(tokenId) && 
           r.status === 'Approved'
    );

    if (!isProducer && !isApproved) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized. You must submit an access request and be approved by the owner.' 
      }, { status: 403 });
    }

    // Decrypt the values
    const decryptedOrigin = decryptValue(encryptedData.origin, cropKeyData.aesKey);
    const decryptedLatLong = decryptValue(encryptedData.latLong, cropKeyData.aesKey);
    const decryptedDescription = decryptValue(encryptedData.description, cropKeyData.aesKey);
    const decryptedPrice = decryptValue(encryptedData.price, cropKeyData.aesKey);

    return NextResponse.json({
      success: true,
      decrypted: {
        origin: decryptedOrigin,
        latLong: decryptedLatLong,
        description: decryptedDescription,
        price: decryptedPrice
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
