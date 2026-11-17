import { NextResponse } from 'next/server';
import { getMatches } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const matchesData = getMatches();
    return NextResponse.json(matchesData, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0'
      }
    });
  } catch (error) {
    console.error('Error fetching matches:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve matches' },
      { status: 500 }
    );
  }
}
