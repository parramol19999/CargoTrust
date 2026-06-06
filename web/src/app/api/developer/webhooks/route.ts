import { NextResponse, NextRequest } from 'next/server';
import { createWebhook, getWebhooks, toggleWebhook, deleteWebhook } from '@/lib/developerDb';

export async function GET(request: NextRequest) {
  try {
    const webhooks = await getWebhooks();
    return NextResponse.json({ success: true, webhooks });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { targetUrl, events } = body;
    
    if (!targetUrl || !events || events.length === 0) {
      return NextResponse.json({ success: false, error: 'targetUrl and events are required' }, { status: 400 });
    }

    // Security requirement: enforce HTTPS for all webhooks
    if (!targetUrl.startsWith('https://')) {
      return NextResponse.json({ success: false, error: 'Target URL must use HTTPS (secured protocol required).' }, { status: 400 });
    }

    const newWebhook = await createWebhook(targetUrl, events);
    return NextResponse.json({ success: true, webhook: newWebhook });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, active } = body;
    if (!id || active === undefined) {
      return NextResponse.json({ success: false, error: 'id and active are required' }, { status: 400 });
    }
    const result = await toggleWebhook(id, active);
    return NextResponse.json({ success: result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'id is required' }, { status: 400 });
    }
    const result = await deleteWebhook(id);
    return NextResponse.json({ success: result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
