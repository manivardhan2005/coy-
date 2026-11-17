import { NextRequest, NextResponse } from 'next/server';
import { recordSwipe } from '@/lib/storage';
import { SwipeAction } from '@/types';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { profileId, action } = body as { profileId: string; action: SwipeAction };

    if (!profileId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: profileId and action are required.' },
        { status: 400 }
      );
    }

    if (action !== 'like' && action !== 'pass') {
      return NextResponse.json(
        { error: `Invalid action '${action}'. Must be 'like' or 'pass'.` },
        { status: 400 }
      );
    }

    const result = recordSwipe(profileId, action);

    if (!result.success) {
      return NextResponse.json(result, { status: 404 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Error recording swipe:', error);
    return NextResponse.json(
      { error: 'Internal server error processing swipe' },
      { status: 500 }
    );
  }
}
