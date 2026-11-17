'use client';

import React, { useState } from 'react';
import { PublicProfile, SwipeAction, SwipeResponse } from '@/types';
import { SwipeCard } from './SwipeCard';
import { ActionButtons } from './ActionButtons';
import { EmptyState } from './EmptyState';

interface SwipeDeckProps {
  profiles: PublicProfile[];
  onSwipeAction: (profileId: string, action: SwipeAction) => Promise<SwipeResponse | null>;
  onOpenDetails: (profile: PublicProfile) => void;
  onResetFeed: () => void;
  onGoToMatches: () => void;
  matchesCount: number;
  isResetting: boolean;
}

export const SwipeDeck: React.FC<SwipeDeckProps> = ({
  profiles,
  onSwipeAction,
  onOpenDetails,
  onResetFeed,
  onGoToMatches,
  matchesCount,
  isResetting,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);

  // When profiles list changes or resets, update index
  React.useEffect(() => {
    setCurrentIndex(0);
  }, [profiles]);

  const activeProfile = profiles[currentIndex] || null;
  const nextProfile = profiles[currentIndex + 1] || null;

  // Desktop keyboard shortcuts: ArrowLeft = Pass, ArrowRight = Like, Space/ArrowUp = Details
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key === 'ArrowRight') {
        handleSwipe('like');
      } else if (e.key === 'ArrowLeft') {
        handleSwipe('pass');
      } else if (e.key === 'ArrowUp' || e.key === ' ') {
        e.preventDefault();
        if (activeProfile) onOpenDetails(activeProfile);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeProfile, isSwiping]);

  const handleSwipe = async (action: SwipeAction) => {
    if (!activeProfile || isSwiping) return;

    setIsSwiping(true);
    const targetId = activeProfile.id;

    // Advance to next card
    setCurrentIndex(prev => prev + 1);

    try {
      await onSwipeAction(targetId, action);
    } catch (err) {
      console.error('Failed to record swipe:', err);
    } finally {
      setIsSwiping(false);
    }
  };

  // If feed is exhausted
  if (!activeProfile) {
    return (
      <EmptyState
        onReset={onResetFeed}
        onGoToMatches={onGoToMatches}
        matchesCount={matchesCount}
        isResetting={isResetting}
      />
    );
  }

  return (
    <div className="flex flex-col items-center justify-between h-[calc(100vh-125px)] w-full max-w-sm mx-auto px-4 py-2">
      {/* Card Deck Area */}
      <div className="relative w-full flex-1 max-h-[580px] my-auto">
        {/* Next card in stack (depth effect) */}
        {nextProfile && (
          <SwipeCard
            key={nextProfile.id}
            profile={nextProfile}
            isTopCard={false}
            onSwipe={() => {}}
            onOpenDetails={() => {}}
          />
        )}

        {/* Active Top Card */}
        <SwipeCard
          key={activeProfile.id}
          profile={activeProfile}
          isTopCard={true}
          onSwipe={handleSwipe}
          onOpenDetails={onOpenDetails}
        />
      </div>

      {/* Action Buttons (Pass / Info / Like) */}
      <div className="w-full flex-shrink-0 pt-2">
        <ActionButtons
          onPass={() => handleSwipe('pass')}
          onLike={() => handleSwipe('like')}
          onInfo={() => onOpenDetails(activeProfile)}
          disabled={isSwiping}
        />
      </div>
    </div>
  );
};
