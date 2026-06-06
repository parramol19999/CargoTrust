import { NextResponse, NextRequest } from 'next/server';
import { createApiKey, getApiKeys, toggleApiKey, deleteApiKey } from '@/lib/developerDb';

export async function GET(request: NextRequest) {
  try {
    const keys = await getApiKeys();
    return NextResponse.json({ success: true, keys });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;
    if (!userId) {
      return NextResponse.json({ success: false, error: 'userId is required' }, { status: 400 });
    }
    const newKey = await createApiKey(userId);
    return NextResponse.json({ success: true, key: newKey });
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
    const result = await toggleApiKey(id, active);
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
    const result = await deleteApiKey(id);
    return NextResponse.json({ success: result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
