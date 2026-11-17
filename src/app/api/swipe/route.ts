import { NextRequest, NextResponse } from 'next/server';
import { recordSwipeSafe } from '@/lib/storage';
import { SwipeAction } from '@/types';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Malformed JSON payload.' },
        { status: 400 }
      );
    }

    const { profileId, action } = (body || {}) as {
      profileId?: unknown;
      action?: unknown;
      userId?: unknown;
    };

    // STRICT INPUT VALIDATION: Prevents malformed or non-string inputs from touching storage
    if (
      typeof profileId !== 'string' ||
      profileId.trim().length === 0 ||
      typeof action !== 'string' ||
      !['like', 'pass'].includes(action)
    ) {
      return NextResponse.json(
        {
          error: "Invalid request payload. 'profileId' must be a non-empty string, and 'action' must be 'like' or 'pass'."
        },
        { status: 400 }
      );
    }

    // SECURITY: Single-tenant session guarantee.
    // Client-supplied `userId` is strictly ignored; actor identity is bound to verified server session.
    const result = await recordSwipeSafe(profileId.trim(), action as SwipeAction);

    // Duplicate swipe rejection (Idempotency / State Invariant)
    if (result.alreadySwiped) {
      return NextResponse.json(
        { error: result.message, alreadySwiped: true },
        { status: 409 } // 409 Conflict
      );
    }

    if (!result.success) {
      return NextResponse.json(result, { status: 404 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Unhandled error in POST /api/swipe:', error);
    return NextResponse.json(
      { error: 'Internal server error processing swipe: persistence or server failure.' },
      { status: 500 }
    );
  }
}
