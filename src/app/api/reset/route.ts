import { NextRequest, NextResponse } from 'next/server';
import { resetData } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  // Production protection: In production, the reset endpoint is disabled by default.
  // If explicitly allowed via ENABLE_DEMO_RESET=true, it still requires a matching DEMO_RESET_SECRET header if defined.
  if (process.env.NODE_ENV === 'production') {
    if (process.env.ENABLE_DEMO_RESET !== 'true') {
      return NextResponse.json(
        { error: 'Reset endpoint is disabled in production.' },
        { status: 403 }
      );
    }

    const secret = process.env.DEMO_RESET_SECRET;
    if (secret) {
      const authHeader = request.headers.get('x-demo-reset-secret');
      if (authHeader !== secret) {
        return NextResponse.json(
          { error: 'Unauthorized: Invalid or missing demo reset authorization secret.' },
          { status: 401 }
        );
      }
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
