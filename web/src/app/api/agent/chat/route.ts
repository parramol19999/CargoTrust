import { NextResponse, NextRequest } from 'next/server';
import { createPublicClient, http } from 'viem';
import { 
  CARGO_REGISTRY_ADDRESS, 
  VERIFIER_REGISTRY_ADDRESS, 
  CROP_LENDING_POOL_ADDRESS, 
  CARGO_ESCROW_ADDRESS,
  USDC_ADDRESS
} from '@/lib/constants';
import CARGO_REGISTRY_ABI from '@/components/CargoRegistryABI.json';
import { saveActiveAgent } from '@/lib/agentsDb';

// Set up Viem Client for Arc Testnet
const viemClient = createPublicClient({
  transport: http('https://rpc.testnet.arc.network')
});

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid messages format' }, { status: 400 });
    }

    const systemPrompt = `You are the CargoTrust AI Autonomous Supply Chain Orchestrator Agent (CargoPilot).
You coordinate crop traceability, verifier certifications, escrow settlement, and trade credit LTV analysis on the Arc Testnet using USDC.
Available contracts:
- CargoRegistry (ERC-721 Crop Digital Twins): ${CARGO_REGISTRY_ADDRESS}
- CargoEscrow (ERC-8183 Escrow Manager): ${CARGO_ESCROW_ADDRESS}
- VerifierRegistry (USDC Staking & Credentials): ${VERIFIER_REGISTRY_ADDRESS}
- CropLendingPool (NFT Collateral Lending): ${CROP_LENDING_POOL_ADDRESS}
- USDC Gas & Asset Token: ${USDC_ADDRESS} (Gas: 18 decimals, ERC20 transfers: 6 decimals)

You have access to tools. If the user wants to take an action, you can suggest it. Since you cannot sign transactions directly without their wallet, you must format a JSON block in your response to invoke a tool, which the frontend will intercept and execute.
Output tool calls strictly in this format:
\`\`\`json
{
  "tool_call": {
    "name": "mint_twin" | "list_crop" | "request_credit" | "register_verifier_agent" | "simulate_quality_check",
    "parameters": {
      "tokenId"?: number,
      "origin"?: string,
      "priceUsdc"?: string,
      "weight"?: number,
      "agentAddress"?: string,
      "name"?: string,
      "deviceId"?: string
    }
  }
}
\`\`\`

If you don't need to make a tool call, do not output that JSON block.
Keep your response concise, helpful, and professional. Always show your reasoning step by step.`;

    const apiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages
    ];

    let apiResponse;
    let apiKey = process.env.DEEPSEEK_API_KEY;
    let useDeepseek = true;

    // Check if key is mock or real
    if (!apiKey || apiKey.startsWith('sk-mock') || apiKey === 'YOUR_DEEPSEEK_KEY') {
      apiKey = process.env.OPENAI_API_KEY;
      useDeepseek = false;
    }

    try {
      if (useDeepseek && apiKey) {
        // Call DeepSeek
        apiResponse = await fetch(DEEPSEEK_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: 'deepseek-chat', // maps to deepseek-v4-flash
            messages: apiMessages,
            temperature: 0.1
          })
        });
      } else if (apiKey) {
        // Fallback to OpenAI
        apiResponse = await fetch(OPENAI_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: apiMessages,
            temperature: 0.1
          })
        });
      }
    } catch (fetchError: any) {
      console.error('Fetch error during LLM call:', fetchError);
    }

    // If API call failed or keys are not available, use local simulation
    if (!apiResponse || !apiResponse.ok) {
      console.warn('LLM API not responding or invalid key. Falling back to local orchestrator simulation.');
      const lastMessage = messages[messages.length - 1].content.toLowerCase();
      let reply = "";
      let toolBlock = null;

      if (lastMessage.includes('mint') || lastMessage.includes('harvest') || lastMessage.includes('twin')) {
        reply = "I have analyzed your crop details and determined that it qualifies for on-chain digital twin minting. Let's initiate the mint transaction for this batch.";
        toolBlock = {
          tool_call: {
            name: "mint_twin",
            parameters: {
              origin: "Dalat, Vietnam",
              weight: 500,
              priceUsdc: "150000000" // 150 USDC
            }
          }
        };
      } else if (lastMessage.includes('credit') || lastMessage.includes('lend') || lastMessage.includes('borrow')) {
        reply = "I have evaluated the CropLendingPool status. Based on the collateral value, I recommend drawing a 50% LTV loan of 75 USDC. Let's send the request to lock your NFT and borrow USDC.";
        toolBlock = {
          tool_call: {
            name: "request_credit",
            parameters: {
              tokenId: 1
            }
          }
        };
      } else if (lastMessage.includes('verify') || lastMessage.includes('inspect') || lastMessage.includes('certify')) {
        reply = "I am initializing a simulated lab inspection certification for Crop Twin #1. Let's verify the temperature controls and submit the attestation.";
        toolBlock = {
          tool_call: {
            name: "simulate_quality_check",
            parameters: {
              tokenId: 1
            }
          }
        };
      } else if (lastMessage.includes('register') || lastMessage.includes('agent')) {
        reply = "Let's register a new IoT Temperature Tracker Agent on the AgentRegistry contract to monitor your shipments.";
        toolBlock = {
          tool_call: {
            name: "register_verifier_agent",
            parameters: {
              name: "IoT Temperature Tracker Dalat-03",
              deviceId: "DEV-8849",
              agentAddress: "0x64e43D0c90A5Fbf31336Cc43CdD3Cc289B8550000"
            }
          }
        };
      } else {
        reply = "Hello! I am CargoPilot, your Autonomous Supply Chain Coordinator. I can help you mint crop twins, list batches for sale, request collateralized loans, register IoT tracking agents, and inspect cold-chain telemetry logs. What would you like to do?";
      }

      const responseContent = toolBlock 
        ? `${reply}\n\n\`\`\`json\n${JSON.stringify(toolBlock, null, 2)}\n\`\`\``
        : reply;

      return NextResponse.json({
        content: responseContent,
        reasoning: "Local simulator resolved client intent based on keyword mapping."
      });
    }

    const data = await apiResponse.json();
    const content = data.choices[0].message.content || '';
    const reasoning = data.choices[0].message.reasoning_content || '';

    return NextResponse.json({
      content,
      reasoning
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
