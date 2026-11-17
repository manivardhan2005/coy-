import { NextRequest, NextResponse } from 'next/server';
import { resetData } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  // Production security: The reset endpoint is disabled by default in production.
  // If explicitly enabled for a controlled demo, requests must pass server-side secret validation.
  // The secret must never be exposed to client-side code.
  if (process.env.NODE_ENV === 'production') {
    if (process.env.ENABLE_DEMO_RESET !== 'true') {
      return NextResponse.json(
        { error: 'Reset endpoint is disabled in production.' },
        { status: 403 }
      );
    }

    const secret = process.env.DEMO_RESET_SECRET;
    const authHeader = request.headers.get('x-demo-reset-secret');

    if (!secret || authHeader !== secret) {
      return NextResponse.json(
        { error: 'Unauthorized: Demo reset in production requires a valid server-side authorization secret.' },
        { status: 401 }
      );
    }
  }

  try {
    const result = resetData();
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Error resetting data:', error);
    return NextResponse.json(
      { error: 'Failed to reset data' },
      { status: 500 }
    );
  }
}
