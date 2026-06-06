import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import { createPublicClient, http, parseAbi } from 'viem';
import { getDatabase, Webhook } from '../db';

const CARGO_REGISTRY_ABI_MINIMAL = parseAbi([
  'event CargoMinted(uint256 indexed tokenId, address indexed producer, string origin, uint256 priceUsdc)',
  'event CargoPurchased(uint256 indexed tokenId, address indexed buyer, uint256 price)',
  'event CargoVerified(uint256 indexed tokenId, address indexed verifier, string status)',
  'event StatusUpdated(uint256 indexed tokenId, string status)'
]);

@Injectable()
export class WebhooksService implements OnModuleInit {
  private readonly logger = new Logger(WebhooksService.name);
  private publicClient: any;
  private registryAddress: string;

  constructor() {
    this.registryAddress = process.env.CARGO_REGISTRY_ADDRESS || '0x2b27B16F0AAf518FF91690Df2B4FA39C5f5BCe99';
    
    // Initialize Viem public client for Arc Testnet
    this.publicClient = createPublicClient({
      chain: {
        id: 5042002,
        name: 'Arc Testnet',
        network: 'arc-testnet',
        nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 6 },
        rpcUrls: {
          default: { http: ['https://rpc.testnet.arc.network'] },
          public: { http: ['https://rpc.testnet.arc.network'] }
        }
      },
      transport: http('https://rpc.testnet.arc.network')
    });
  }

  onModuleInit() {
    this.logger.log('Starting blockchain event listener for webhooks...');
    this.listenToEvents();
  }

  private listenToEvents() {
    try {
      // 1. CargoMinted
      this.publicClient.watchContractEvent({
        address: this.registryAddress as `0x${string}`,
        abi: CARGO_REGISTRY_ABI_MINIMAL,
        eventName: 'CargoMinted',
        onLogs: (logs) => {
          for (const log of logs) {
            const { tokenId, producer, origin, priceUsdc } = log.args;
            this.dispatch('CargoMinted', {
              tokenId: tokenId.toString(),
              producer,
              origin,
              priceUsdc: priceUsdc.toString(),
              txHash: log.transactionHash
            });
          }
        }
      });

      // 2. CargoPurchased
      this.publicClient.watchContractEvent({
        address: this.registryAddress as `0x${string}`,
        abi: CARGO_REGISTRY_ABI_MINIMAL,
        eventName: 'CargoPurchased',
        onLogs: (logs) => {
          for (const log of logs) {
            const { tokenId, buyer, price } = log.args;
            this.dispatch('CargoPurchased', {
              tokenId: tokenId.toString(),
              buyer,
              price: price.toString(),
              txHash: log.transactionHash
            });
          }
        }
      });

      // 3. CargoVerified
      this.publicClient.watchContractEvent({
        address: this.registryAddress as `0x${string}`,
        abi: CARGO_REGISTRY_ABI_MINIMAL,
        eventName: 'CargoVerified',
        onLogs: (logs) => {
          for (const log of logs) {
            const { tokenId, verifier, status } = log.args;
            this.dispatch('CargoVerified', {
              tokenId: tokenId.toString(),
              verifier,
              status,
              txHash: log.transactionHash
            });
          }
        }
      });

      // 4. StatusUpdated
      this.publicClient.watchContractEvent({
        address: this.registryAddress as `0x${string}`,
        abi: CARGO_REGISTRY_ABI_MINIMAL,
        eventName: 'StatusUpdated',
        onLogs: (logs) => {
          for (const log of logs) {
            const { tokenId, status } = log.args;
            this.dispatch('StatusUpdated', {
              tokenId: tokenId.toString(),
              status,
              txHash: log.transactionHash
            });
          }
        }
      });

      this.logger.log(`Listening for events on CargoRegistry at ${this.registryAddress}`);
    } catch (err) {
      this.logger.error('Error establishing watchContractEvent listener:', err);
    }
  }

  public async dispatch(event: string, payload: any) {
    const db = getDatabase();
    const activeWebhooks = db.webhooks.filter((w) => w.active && w.events.includes(event));

    if (activeWebhooks.length === 0) {
      return;
    }

    const timestamp = Date.now();
    const fullPayload = {
      event,
      timestamp,
      data: payload
    };

    const payloadString = JSON.stringify(fullPayload);

    for (const hook of activeWebhooks) {
      // Security Enforcement: Target URL must be HTTPS
      if (!hook.targetUrl.startsWith('https://')) {
        this.logger.warn(`Skipping webhook dispatch: URL '${hook.targetUrl}' is not HTTPS. HTTPS is required.`);
        continue;
      }

      // Compute HMAC-SHA256 signature using the secret key
      const hmac = crypto.createHmac('sha256', hook.secret);
      const signature = hmac.update(payloadString).digest('hex');

      this.logger.log(`Dispatching event '${event}' to webhook target: ${hook.targetUrl}`);

      fetch(hook.targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-cargotrust-signature': signature,
          'x-cargotrust-timestamp': timestamp.toString()
        },
        body: payloadString
      })
      .then((res) => {
        this.logger.log(`Webhook delivery succeeded for ${hook.targetUrl} (Status: ${res.status})`);
      })
      .catch((err) => {
        this.logger.error(`Webhook delivery failed for ${hook.targetUrl}:`, err);
      });
    }
  }
}
