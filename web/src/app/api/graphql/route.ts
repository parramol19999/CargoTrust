import { NextResponse, NextRequest } from 'next/server';
import { createPublicClient, http } from 'viem';
import { CARGO_REGISTRY_ADDRESS } from '@/lib/constants';
import CARGO_REGISTRY_ABI from '@/components/CargoRegistryABI.json';

// Setup Viem Client to query Arc
const client = createPublicClient({
  transport: http('https://rpc.testnet.arc.network')
});

const BOOTSTRAP_TWINS = [
  {
    id: "1001",
    tokenId: 1001,
    producer: "0x3f5c9e2b178a9c2a23eb29acb14e66299b9cf2a2",
    origin: "Valle del Cauca, Colombia",
    harvestDate: Math.floor(Date.now() / 1000) - 86400 * 5, // 5 days ago
    latLong: "3.4372° N, 76.5225° W",
    ipfsMetadata: "https://ipfs.io/ipfs/QmXyZ?desc=Specialty%20Organic%20Arabica%20Coffee%20Beans",
    owner: "0x89205A3A3b2A6adF154d8215522EadA51Bf891E",
    priceUsdc: "3000000", // 3 USDC
    isForSale: true,
    status: "Organic Certified",
    isEncrypted: false,
    encryptedPrice: "",
    weight: 500,
    isDemo: true,
    verifications: [
      {
        verifier: "0x4e6b5a325c4a",
        verifierName: "Intertek AgriLabs",
        notes: "Moisture content 11.2%, defect count 0. Pesticide screening negative."
      }
    ]
  },
  {
    id: "1002",
    tokenId: 1002,
    producer: "0x7a892b3a1c8f1c8e1e7f9a8b1c4e7f8e8a9f8b7c",
    origin: "Aomori Prefecture, Japan",
    harvestDate: Math.floor(Date.now() / 1000) - 86400 * 8, // 8 days ago
    latLong: "40.8244° N, 140.7400° E",
    ipfsMetadata: "https://ipfs.io/ipfs/QmPpQ?desc=Premium%20Fuji%20Apples%20Export%20Batch",
    owner: "0x25b9663748a4434595fc46259c071513",
    priceUsdc: "5500000", // 5.5 USDC
    isForSale: true,
    status: "Sourcing Inspected",
    isEncrypted: false,
    encryptedPrice: "",
    weight: 350,
    isDemo: true,
    verifications: []
  },
  {
    id: "1003",
    tokenId: 1003,
    producer: "0x5b3a8d76a1c9",
    origin: "Limpopo, South Africa",
    harvestDate: Math.floor(Date.now() / 1000) - 86400 * 12, // 12 days ago
    latLong: "23.4013° S, 29.4179° E",
    ipfsMetadata: "https://ipfs.io/ipfs/QmZzZ?desc=Golden%20Maluma%20Avocado%20Export",
    owner: "0x89205A3A3b2A6adF154d8215522EadA51Bf891E",
    priceUsdc: "180000000", // 180 USDC
    isForSale: false,
    status: "USDA Inspected",
    isEncrypted: false,
    encryptedPrice: "",
    weight: 600,
    isDemo: true,
    verifications: []
  },
  {
    id: "1004",
    tokenId: 1004,
    producer: "0x9c3a1f54d2e3",
    origin: "Roi Et, Thailand",
    harvestDate: Math.floor(Date.now() / 1000) - 86400 * 15,
    latLong: "16.0538° N, 103.6520° E",
    ipfsMetadata: "https://ipfs.io/ipfs/QmRrR?desc=Organic%20Jasmine%20Fragrant%20Rice",
    owner: "0x1087E71CD83101adF154d8215522EadA51Bf891E",
    priceUsdc: "8000000", // 8 USDC
    isForSale: true,
    status: "Verified Quality",
    isEncrypted: false,
    encryptedPrice: "",
    weight: 1200,
    isDemo: true,
    verifications: []
  }
];

// Simple in-memory cache to ensure sub-second response times (<10ms on cache hit)
let cacheTime = 0;
let cachedBatches: any[] = [...BOOTSTRAP_TWINS];

async function getCachedBatches() {
  const now = Date.now();
  // Cache for 10 seconds to keep fresh while avoiding rate limits
  if (now - cacheTime < 10000 && cachedBatches.length > BOOTSTRAP_TWINS.length) {
    return cachedBatches;
  }

  try {
    const nextTokenId: any = await client.readContract({
      address: CARGO_REGISTRY_ADDRESS,
      abi: CARGO_REGISTRY_ABI,
      functionName: 'nextTokenId',
    });

    const total = Number(nextTokenId.toString()) - 1;
    const loadedBatches = [];

     for (let i = 1; i <= total; i++) {
      try {
        const ownerAddress: any = await client.readContract({
          address: CARGO_REGISTRY_ADDRESS,
          abi: CARGO_REGISTRY_ABI,
          functionName: 'ownerOf',
          args: [BigInt(i)],
        });

        if (!ownerAddress || ownerAddress === '0x0000000000000000000000000000000000000000') {
          continue;
        }

        const details: any = await client.readContract({
          address: CARGO_REGISTRY_ADDRESS,
          abi: CARGO_REGISTRY_ABI,
          functionName: 'cargoBatches',
          args: [BigInt(i)],
        });

        const [
          producer,
          origin,
          harvestDate,
          latLong,
          ipfsMetadata,
          priceUsdc,
          isForSale,
          status,
          paymentToken,
          isEncrypted,
          encryptedPrice,
          weight
        ] = details;

        if (producer === '0x0000000000000000000000000000000000000000') {
          continue;
        }

        loadedBatches.push({
          id: i.toString(),
          tokenId: i,
          producer,
          origin,
          harvestDate: Number(harvestDate.toString()),
          latLong,
          ipfsMetadata,
          owner: ownerAddress,
          priceUsdc: priceUsdc.toString(),
          isForSale,
          status,
          isEncrypted: !!isEncrypted,
          encryptedPrice: encryptedPrice || '',
          weight: weight ? Number(weight.toString()) : 100,
          isDemo: false,
          verifications: [] as any[]
        });
      } catch (tokenErr) {
        // Silent catch for burned, split, or nonexistent tokens to keep console clean
      }
     }

    const merged = [...loadedBatches];
    
    // Add bootstrap twins to ensure the dashboard is never empty
    BOOTSTRAP_TWINS.forEach((twin) => {
      if (!merged.some(b => Number(b.tokenId) === Number(twin.tokenId))) {
        merged.push(twin);
      }
    });

    cachedBatches = merged;
    cacheTime = now;
    return cachedBatches;
  } catch (err) {
    console.error('Error in GraphQL indexing resolver:', err);
    // Fallback to bootstrap twins if client request fails
    if (cachedBatches.length === 0) {
      cachedBatches = [...BOOTSTRAP_TWINS];
    }
    return cachedBatches;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { query, variables } = await request.json();
    const batches = await getCachedBatches();

    // Determine query type and return matches
    if (query.includes('cargoTwinById') || (variables && variables.id)) {
      const targetId = variables?.id || (query.match(/id:\s*"([^"]+)"/) || query.match(/id:\s*([0-9]+)/))?.[1];
      const batch = batches.find(b => b.id === targetId);

      return NextResponse.json({
        data: {
          cargoTwinById: batch || null
        }
      });
    }

    // Default return all batches
    return NextResponse.json({
      data: {
        cargoTwins: batches
      }
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal GraphQL server error' }, { status: 500 });
  }
}

// Allow CORS preflight requests
export async function OPTIONS() {
  const response = new NextResponse(null, { status: 204 });
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}
