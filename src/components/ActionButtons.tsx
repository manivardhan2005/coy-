'use client';

import React from 'react';
import { X, Heart, Info } from 'lucide-react';

interface ActionButtonsProps {
  onPass: () => void;
  onLike: () => void;
  onInfo: () => void;
  disabled?: boolean;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  onPass,
  onLike,
  onInfo,
  disabled = false,
}) => {
  return (
    <div className="flex items-center justify-center gap-6 py-4 px-6 w-full max-w-sm mx-auto select-none">
      {/* Pass / Nope Button */}
      <button
        onClick={onPass}
        disabled={disabled}
        aria-label="Pass"
        className="w-14 h-14 rounded-full flex items-center justify-center bg-zinc-900 border-2 border-rose-500/70 text-rose-500 hover:bg-rose-500 hover:text-white shadow-lg hover:shadow-rose-500/25 active:scale-90 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed group"
      >
        <X className="w-6 h-6 stroke-[2.5] transition-transform group-hover:scale-110" />
      </button>

      {/* Info Button */}
      <button
        onClick={onInfo}
        disabled={disabled}
        aria-label="View Details"
        className="w-11 h-11 rounded-full flex items-center justify-center bg-zinc-900 border border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white active:scale-90 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Info className="w-5 h-5 stroke-[2]" />
      </button>

      {/* Like Button */}
      <button
        onClick={onLike}
        disabled={disabled}
        aria-label="Like"
        className="w-14 h-14 rounded-full flex items-center justify-center bg-gradient-to-tr from-rose-600 to-pink-500 border-2 border-pink-400 text-white shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50 hover:scale-105 active:scale-90 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed group"
      >
        <Heart className="w-6 h-6 fill-current stroke-none transition-transform group-hover:scale-115" />
      </button>
    </div>
  );
};
