import { NextResponse } from 'next/server';
import { getFeed } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const feed = getFeed();
    return NextResponse.json(feed, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0'
      }
    });
  } catch (error) {
    console.error('Error fetching feed:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve feed profiles' },
      { status: 500 }
    );
  }
}
