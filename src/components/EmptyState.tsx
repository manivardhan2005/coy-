'use client';

import React from 'react';
import { Compass, RotateCcw, Heart, Users } from 'lucide-react';

interface EmptyStateProps {
  onReset: () => void;
  onGoToMatches: () => void;
  matchesCount: number;
  isResetting: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  onReset,
  onGoToMatches,
  matchesCount,
  isResetting,
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 h-full max-w-sm mx-auto animate-fade-in">
      {/* Radar pulse visual */}
      <div className="relative mb-6">
        <div className="w-24 h-24 rounded-full bg-pink-500/10 border border-pink-500/30 flex items-center justify-center animate-pulse">
          <Compass className="w-10 h-10 text-pink-400" />
        </div>
        <div className="absolute inset-0 rounded-full border border-pink-500/20 scale-125 animate-ping opacity-30" />
      </div>

      <h3 className="text-2xl font-black text-white tracking-tight">
        You&apos;re All Caught Up!
      </h3>
      <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
        You&apos;ve reviewed all available profiles in your campus pool. New members will appear here as they join Coy.
      </p>

      {/* Stats summary pill */}
      <div className="flex items-center gap-4 my-6 p-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-xs w-full justify-around">
        <div className="flex items-center gap-1.5 text-zinc-300">
          <Heart className="w-4 h-4 text-pink-400" />
          <span><strong className="text-white">{matchesCount}</strong> Mutual Matches</span>
        </div>
        <div className="w-px h-6 bg-zinc-800" />
        <div className="flex items-center gap-1.5 text-zinc-300">
          <Users className="w-4 h-4 text-purple-400" />
          <span>32 Evaluated</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-3 w-full">
        {matchesCount > 0 && (
          <button
            onClick={onGoToMatches}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-pink-500/20 hover:brightness-110 active:scale-98 transition-all"
          >
            <Heart className="w-4 h-4 fill-current stroke-none" />
            View {matchesCount} Mutual {matchesCount === 1 ? 'Match' : 'Matches'}
          </button>
        )}

        <button
          onClick={onReset}
          disabled={isResetting}
          className="w-full py-3 px-4 rounded-xl bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 font-semibold text-xs flex items-center justify-center gap-2 active:scale-98 transition-all disabled:opacity-50"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
          {isResetting ? 'Resetting Demo...' : 'Reset Feed (Demo Mode)'}
        </button>
      </div>
    </div>
  );
};
