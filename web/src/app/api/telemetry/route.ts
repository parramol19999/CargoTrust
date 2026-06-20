import { NextResponse, NextRequest } from 'next/server';
import { 
  validatePaymentToken, 
  saveTelemetryLogToDb, 
  getTelemetryLogsFromDb
} from '@/lib/nanopaymentsServer';
import { generateMockTelemetryReading } from '@/lib/nanopayments';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tokenIdStr = searchParams.get('tokenId');

  if (!tokenIdStr) {
    return NextResponse.json({ error: 'Missing tokenId parameter.' }, { status: 400 });
  }

  const tokenId = parseInt(tokenIdStr);
  if (isNaN(tokenId)) {
    return NextResponse.json({ error: 'Invalid tokenId parameter.' }, { status: 400 });
  }

  // 1. Check for payment token header
  const paymentToken = request.headers.get('x-payment-token');
  const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';

  if (!paymentToken) {
    // Return HTTP 402 Payment Required with x402 headers
    const response = NextResponse.json(
      { 
        error: 'Payment Required', 
        message: 'Telemetry access requires a micropayment of $0.000001 USDC per request via Circle Gateway.',
        terms: {
          amount: '0.000001',
          currency: 'USDC',
          recipient: '0xAb67E0c298250d4714c3a06Ea951aAF11c17014b',
          network: 'arc-testnet'
        }
      }, 
      { status: 402 }
    );

    response.headers.set(
      'WWW-Authenticate',
      'x402 amount="0.000001", currency="USDC", network="arc-testnet", recipient="0xAb67E0c298250d4714c3a06Ea951aAF11c17014b"'
    );
    response.headers.set('Access-Control-Expose-Headers', 'WWW-Authenticate');
    return response;
  }

  // 2. Validate Payment Token (prevents replays and rate limits)
  const validation = await validatePaymentToken(paymentToken, ip);
  if (!validation.success) {
    return NextResponse.json({ error: validation.error }, { status: 402 });
  }

  try {
    // 3. Generate new IoT telemetry reading and store it
    const telemetryData = generateMockTelemetryReading(tokenId);
    const logEntry = {
      ...telemetryData,
      paymentRef: validation.payload?.nonce || `ref_${Date.now()}`
    };

    await saveTelemetryLogToDb(logEntry);

    // 4. Retrieve historical records for this token to show trends
    const allLogs = await getTelemetryLogsFromDb();
    const tokenLogs = allLogs
      .filter(log => log.tokenId === tokenId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    return NextResponse.json({
      success: true,
      current: logEntry,
      history: tokenLogs.slice(-20) // Limit to last 20 readings for rendering performance
    });

  } catch (err: any) {
    console.error('Telemetry logging error:', err);
    return NextResponse.json({ error: 'Internal database log insertion failed.' }, { status: 500 });
  }
}
