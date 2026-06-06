import { Controller, Get, Post, Body, Query, UseGuards, BadRequestException } from '@nestjs/common';
import { createPublicClient, createWalletClient, http, parseAbi } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { AuthGuard } from '../auth/auth.guard';

const REGISTRY_ABI = parseAbi([
  'function nextTokenId() view returns (uint256)',
  'function getActiveBatches() view returns (uint256[] memory, address[] memory, string[] memory)',
  'function cargoBatches(uint256 tokenId) view returns (address producer, string origin, uint256 harvestDate, string latLong, string ipfsMetadata, uint256 priceUsdc, bool isForSale, string status, address paymentToken, bool isEncrypted, string encryptedPrice, uint256 weight)',
  'function mintCargo(string origin, uint256 harvestDate, string latLong, string ipfsMetadata, bool isEncrypted, string encryptedPrice, uint256 weight) external returns (uint256)',
  'function listCargo(uint256 tokenId, uint256 priceUsdc, address paymentToken) external',
  'function purchaseCargo(uint256 tokenId) external',
  'function splitCargo(uint256 parentId, uint256[] childWeights) external'
]);

const ERC20_ABI = parseAbi([
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)'
]);

const USDC_ADDRESS = '0x3600000000000000000000000000000000000000';
const EURC_ADDRESS = '0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a';

@Controller('api/v1')
@UseGuards(AuthGuard)
export class BatchesController {
  private publicClient: any;
  private walletClient: any;
  private registryAddress: string;
  private account: any;

  constructor() {
    this.registryAddress = process.env.CARGO_REGISTRY_ADDRESS || '0x2b27B16F0AAf518FF91690Df2B4FA39C5f5BCe99';
    const privateKey = process.env.PRIVATE_KEY as `0x${string}`;
    if (!privateKey) {
      throw new Error('PRIVATE_KEY environment variable is not defined.');
    }
    const cleanKey = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}` as `0x${string}`;
    this.account = privateKeyToAccount(cleanKey);

    const transport = http('https://rpc.testnet.arc.network');
    const chain = {
      id: 5042002,
      name: 'Arc Testnet',
      network: 'arc-testnet',
      nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 6 },
      rpcUrls: {
        default: { http: ['https://rpc.testnet.arc.network'] },
        public: { http: ['https://rpc.testnet.arc.network'] }
      }
    };

    this.publicClient = createPublicClient({ chain, transport });
    this.walletClient = createWalletClient({
      chain,
      transport,
      account: this.account
    });
  }

  // Ensure USDC/EURC allowance is sufficient for the registry to pull fees
  private async ensureAllowance(tokenAddress: string, amount: bigint) {
    const currentAllowance = await this.publicClient.readContract({
      address: tokenAddress as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'allowance',
      args: [this.account.address, this.registryAddress as `0x${string}`]
    });

    if (currentAllowance < amount) {
      console.log(`Approving registry for token ${tokenAddress}. Required: ${amount}, Current: ${currentAllowance}`);
      const hash = await this.walletClient.writeContract({
        address: tokenAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [this.registryAddress as `0x${string}`, amount * 100n] // Approve extra for future transactions
      });
      await this.publicClient.waitForTransactionReceipt({ hash });
    }
  }

  @Get('batches')
  async getBatches(@Query('tokenId') tokenIdStr?: string) {
    try {
      if (tokenIdStr) {
        const tokenId = BigInt(tokenIdStr);
        const batch = await this.publicClient.readContract({
          address: this.registryAddress as `0x${string}`,
          abi: REGISTRY_ABI,
          functionName: 'cargoBatches',
          args: [tokenId]
        });

        return {
          tokenId: tokenId.toString(),
          producer: batch[0],
          origin: batch[1],
          harvestDate: batch[2].toString(),
          latLong: batch[3],
          ipfsMetadata: batch[4],
          priceUsdc: batch[5].toString(),
          isForSale: batch[6],
          status: batch[7],
          paymentToken: batch[8],
          isEncrypted: batch[9],
          encryptedPrice: batch[10],
          weight: batch[11].toString()
        };
      }

      // Fetch all active batches
      const activeBatches = await this.publicClient.readContract({
        address: this.registryAddress as `0x${string}`,
        abi: REGISTRY_ABI,
        functionName: 'getActiveBatches'
      });

      const ids = activeBatches[0];
      const owners = activeBatches[1];
      const statuses = activeBatches[2];

      const list = [];
      for (let i = 0; i < ids.length; i++) {
        list.push({
          tokenId: ids[i].toString(),
          owner: owners[i],
          status: statuses[i]
        });
      }
      return list;
    } catch (err) {
      throw new BadRequestException(`Failed to retrieve batches: ${err.message}`);
    }
  }

  @Post('batches')
  async mintBatch(
    @Body('origin') origin: string,
    @Body('harvestDate') harvestDate: number | string,
    @Body('latLong') latLong: string,
    @Body('ipfsMetadata') ipfsMetadata: string,
    @Body('weight') weight?: number,
    @Body('isEncrypted') isEncrypted?: boolean,
    @Body('encryptedPrice') encryptedPrice?: string
  ) {
    if (!origin || !harvestDate || !latLong || !ipfsMetadata) {
      throw new BadRequestException('Origin, harvestDate, latLong, and ipfsMetadata are required.');
    }

    try {
      const hDate = BigInt(harvestDate);
      const wt = weight ? BigInt(weight) : 100n;
      const isEnc = !!isEncrypted;
      const encPrice = encryptedPrice || '';

      // Approve standard 0.10 USDC fee (100,000 micro-USDC)
      await this.ensureAllowance(USDC_ADDRESS, 100000n);

      console.log(`Submitting mintCargo via developer-controlled wallet...`);
      const hash = await this.walletClient.writeContract({
        address: this.registryAddress as `0x${string}`,
        abi: REGISTRY_ABI,
        functionName: 'mintCargo',
        args: [origin, hDate, latLong, ipfsMetadata, isEnc, encPrice, wt]
      });

      const receipt = await this.publicClient.waitForTransactionReceipt({ hash });
      
      // Parse tokenId from CargoMinted event logs if needed, or get nextTokenId - 1
      const nextId = await this.publicClient.readContract({
        address: this.registryAddress as `0x${string}`,
        abi: REGISTRY_ABI,
        functionName: 'nextTokenId'
      });
      const mintedId = (nextId - 1n).toString();

      return {
        success: true,
        message: 'Crop batch digital twin successfully minted.',
        tokenId: mintedId,
        transactionHash: hash
      };
    } catch (err) {
      throw new BadRequestException(`Minting failed: ${err.message}`);
    }
  }

  @Post('batches/split')
  async splitBatch(
    @Body('parentId') parentId: number | string,
    @Body('childWeights') childWeights: number[]
  ) {
    if (!parentId || !childWeights || childWeights.length === 0) {
      throw new BadRequestException('parentId and childWeights are required.');
    }

    try {
      const pId = BigInt(parentId);
      const weights = childWeights.map((w) => BigInt(w));

      // Approve 0.10 USDC per child weight
      const totalSplitFee = 100000n * BigInt(weights.length);
      await this.ensureAllowance(USDC_ADDRESS, totalSplitFee);

      console.log(`Submitting splitCargo via developer-controlled wallet...`);
      const hash = await this.walletClient.writeContract({
        address: this.registryAddress as `0x${string}`,
        abi: REGISTRY_ABI,
        functionName: 'splitCargo',
        args: [pId, weights]
      });

      const receipt = await this.publicClient.waitForTransactionReceipt({ hash });

      return {
        success: true,
        message: `Successfully split parent batch #${parentId} into ${childWeights.length} children.`,
        transactionHash: hash
      };
    } catch (err) {
      throw new BadRequestException(`Split failed: ${err.message}`);
    }
  }

  @Post('listings')
  async listBatch(
    @Body('tokenId') tokenId: number | string,
    @Body('priceUsdc') priceUsdc: number | string,
    @Body('paymentToken') paymentToken?: string
  ) {
    if (!tokenId || !priceUsdc) {
      throw new BadRequestException('tokenId and priceUsdc are required.');
    }

    try {
      const tId = BigInt(tokenId);
      const price = BigInt(priceUsdc);
      const token = paymentToken || USDC_ADDRESS;

      console.log(`Submitting listCargo via developer-controlled wallet...`);
      const hash = await this.walletClient.writeContract({
        address: this.registryAddress as `0x${string}`,
        abi: REGISTRY_ABI,
        functionName: 'listCargo',
        args: [tId, price, token]
      });

      const receipt = await this.publicClient.waitForTransactionReceipt({ hash });

      return {
        success: true,
        message: `Cargo twin #${tokenId} listed for sale at price ${priceUsdc}.`,
        transactionHash: hash
      };
    } catch (err) {
      throw new BadRequestException(`Listing failed: ${err.message}`);
    }
  }

  @Post('listings/buy')
  async buyBatch(@Body('tokenId') tokenId: number | string) {
    if (!tokenId) {
      throw new BadRequestException('tokenId is required.');
    }

    try {
      const tId = BigInt(tokenId);

      // Fetch batch detail to know listing price & payment token
      const batch = await this.publicClient.readContract({
        address: this.registryAddress as `0x${string}`,
        abi: REGISTRY_ABI,
        functionName: 'cargoBatches',
        args: [tId]
      });

      const price = batch[5];
      const listedToken = batch[8];

      // Ensure buyer has approved enough USDC/EURC to the registry
      await this.ensureAllowance(listedToken, price);

      console.log(`Submitting purchaseCargo via developer-controlled wallet...`);
      const hash = await this.walletClient.writeContract({
        address: this.registryAddress as `0x${string}`,
        abi: REGISTRY_ABI,
        functionName: 'purchaseCargo',
        args: [tId]
      });

      const receipt = await this.publicClient.waitForTransactionReceipt({ hash });

      return {
        success: true,
        message: `Cargo twin #${tokenId} successfully purchased via developer-controlled wallet.`,
        transactionHash: hash
      };
    } catch (err) {
      throw new BadRequestException(`Purchase failed: ${err.message}`);
    }
  }
}
