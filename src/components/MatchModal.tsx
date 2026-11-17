'use client';

import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Heart, MessageCircle, ArrowRight } from 'lucide-react';
import { PublicProfile } from '@/types';
import { CURRENT_USER } from '@/data/seedProfiles';

interface MatchModalProps {
  matchedProfile: PublicProfile | null;
  onClose: () => void;
  onSendMessage: (profile: PublicProfile) => void;
}

export const MatchModal: React.FC<MatchModalProps> = ({
  matchedProfile,
  onClose,
  onSendMessage,
}) => {
  useEffect(() => {
    if (matchedProfile) {
      // Trigger festive multi-burst confetti
      const end = Date.now() + 1.2 * 1000;
      const colors = ['#FF3366', '#FF69B4', '#FFA07A', '#9B51E0', '#FFFFFF'];

      (function frame() {
        confetti({
          particleCount: 4,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: colors,
        });
        confetti({
          particleCount: 4,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: colors,
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      })();
    }
  }, [matchedProfile]);

  if (!matchedProfile) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-sm rounded-3xl bg-gradient-to-b from-zinc-900 via-zinc-900 to-black border border-pink-500/30 p-6 text-center shadow-2xl overflow-hidden">
        {/* Background glow circle */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48 bg-pink-500/20 blur-3xl rounded-full pointer-events-none" />

        {/* Heading */}
        <div className="relative mt-2">
          <span className="inline-block px-3 py-1 rounded-full bg-pink-500/20 text-pink-400 text-xs font-bold uppercase tracking-wider mb-2 border border-pink-500/30">
            Mutual Match
          </span>
          <h2 className="text-3xl font-black italic tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-rose-400 to-orange-300">
            It&apos;s a Match!
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            You and <span className="font-semibold text-zinc-200">{matchedProfile.name}</span> secretly liked each other.
          </p>
        </div>

        {/* Circular Avatars Side by Side with Pulsing Heart */}
        <div className="relative flex items-center justify-center gap-4 my-8">
          {/* User's Avatar */}
          <div className="relative">
            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-pink-400 shadow-lg shadow-pink-500/20">
              <img
                src={CURRENT_USER.photo}
                alt={CURRENT_USER.name}
                className="w-full h-full object-cover"
              />
            </div>
            <span className="block mt-1 text-[11px] font-medium text-zinc-400">You</span>
          </div>

          {/* Connected Heart Icon */}
          <div className="relative z-10 -mx-3 flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-tr from-pink-600 to-rose-500 shadow-lg shadow-pink-500/40 text-white animate-bounce">
            <Heart className="w-5 h-5 fill-current stroke-none" />
          </div>

          {/* Matched Profile Avatar */}
          <div className="relative">
            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-pink-400 shadow-lg shadow-pink-500/20">
              <img
                src={matchedProfile.photo}
                alt={matchedProfile.name}
                className="w-full h-full object-cover"
              />
            </div>
            <span className="block mt-1 text-[11px] font-medium text-zinc-400 truncate max-w-[80px]">
              {matchedProfile.name.split(' ')[0]}
            </span>
          </div>
        </div>

        {/* College & Bio Highlight */}
        <div className="bg-zinc-800/50 rounded-2xl p-3 border border-zinc-700/50 text-left mb-6">
          <div className="text-xs font-semibold text-pink-300 truncate">
            {matchedProfile.college}
          </div>
          <div className="text-xs text-zinc-300 mt-1 italic line-clamp-2">
            &ldquo;{matchedProfile.bio}&rdquo;
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5">
          <button
            onClick={() => onSendMessage(matchedProfile)}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-pink-500/25 active:scale-98 transition-all"
          >
            <MessageCircle className="w-4 h-4" />
            Send a Message
          </button>

          <button
            onClick={onClose}
            className="w-full py-3 px-4 rounded-xl bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300 hover:text-white font-medium text-xs flex items-center justify-center gap-1.5 transition-all"
          >
            Keep Swiping
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
