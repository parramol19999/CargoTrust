import { EvmBatchProcessor } from '@subsquid/evm-processor';
import { TypeormDatabase } from '@subsquid/typeorm-store';
import { CARGO_REGISTRY_ADDRESS } from '../web/src/lib/constants'; // link to constants or define inline

// CargoRegistry events topic0 hashes
const CARGO_MINTED_TOPIC = '0xecde3b664d5f190e54d3cd2e0717e137c44df8865768e8e8e801b801b801b801'; // dummy example or standard
const CARGO_PURCHASED_TOPIC = '0x16d97c72f5ad4fb91e0bc6a4220c32cc18403de9a98ef1612de26df16d97c72f';
const CARGO_VERIFIED_TOPIC = '0x2d9bc3ea5b6a0a1fcea229da1d2f9bc3ea5b6a0a1fcea229da1d2f9bc3ea5b6a0';
const STATUS_UPDATED_TOPIC = '0xe5d9bc3ea5b6a0a1fcea229da1d2f9bc3ea5b6a0a1fcea229da1d2f9bc3ea5b6a0';

export const processor = new EvmBatchProcessor()
  .setGateway('https://v2.archive.subsquid.io/network/ethereum-mainnet') // Fallback gateway
  .setRpcEndpoint({
    url: 'https://rpc.testnet.arc.network',
    rateLimit: 10,
  })
  .setFinalityConfirmation(1)
  .setFields({
    log: {
      topics: true,
      data: true,
    },
    transaction: {
      from: true,
      value: true,
      hash: true,
    },
  })
  .addLog({
    address: ['0x734b0176702bD7CCaeCbC514936fdC9a4AfaD4F8'],
    topic0: [
      CARGO_MINTED_TOPIC,
      CARGO_PURCHASED_TOPIC,
      CARGO_VERIFIED_TOPIC,
      STATUS_UPDATED_TOPIC,
    ],
  });

export const db = new TypeormDatabase();
