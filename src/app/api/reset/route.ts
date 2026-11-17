import { NextResponse } from 'next/server';
import { resetData } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export async function POST() {
  // Environment protection: Demo reset endpoint is protected in production unless explicitly enabled
  if (process.env.NODE_ENV === 'production' && process.env.ENABLE_DEMO_RESET !== 'true') {
    return NextResponse.json(
      { error: 'Reset endpoint is disabled in production environments without ENABLE_DEMO_RESET=true.' },
      { status: 403 }
    );
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
