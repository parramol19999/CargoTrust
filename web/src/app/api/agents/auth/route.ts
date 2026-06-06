import { NextResponse, NextRequest } from 'next/server';
import { saveActiveAgent, getActiveAgents } from '@/lib/agentsDb';

export async function GET() {
  try {
    const agents = await getActiveAgents();
    return NextResponse.json({ success: true, agents });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, deviceId, agentWalletAddress, status, agentURI } = body;

    if (!name || !deviceId || !agentWalletAddress) {
      return NextResponse.json({ success: false, error: 'Missing name, deviceId, or agentWalletAddress' }, { status: 400 });
    }

    const agent = {
      id: `agent_${Math.random().toString(36).substring(2, 9)}`,
      name,
      deviceId,
      agentWalletAddress,
      status: status || 'Active',
      agentURI: agentURI || `ipfs://QmAgent${deviceId}`,
      createdAt: new Date().toISOString()
    };

    await saveActiveAgent(agent);

    return NextResponse.json({
      success: true,
      message: 'Agent session initialized and stored.',
      agent
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
