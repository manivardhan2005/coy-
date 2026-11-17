import { NextResponse } from 'next/server';
import { resetData } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export async function POST() {
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
