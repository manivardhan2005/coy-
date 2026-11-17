'use client';

import React from 'react';
import { MatchRecord, PublicProfile } from '@/types';
import { Heart, MessageCircle, Sparkles, GraduationCap } from 'lucide-react';

interface MatchesViewProps {
  matches: MatchRecord[];
  onSelectMatch: (profile: PublicProfile) => void;
  onGoToDiscover: () => void;
}

export const MatchesView: React.FC<MatchesViewProps> = ({
  matches,
  onSelectMatch,
  onGoToDiscover,
}) => {
  if (matches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-8 h-full max-w-sm mx-auto animate-fade-in">
        <div className="w-20 h-20 rounded-full bg-pink-500/10 border border-pink-500/20 flex items-center justify-center mb-5">
          <Heart className="w-8 h-8 text-pink-500/60" />
        </div>
        <h3 className="text-xl font-bold text-white">No Matches Yet</h3>
        <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
          Swipe right on people you find interesting in the <strong className="text-pink-400 font-semibold">Discover</strong> tab. When the interest is mutual, they will show up here!
        </p>
        <button
          onClick={onGoToDiscover}
          className="mt-6 px-6 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 text-white font-bold text-xs shadow-lg shadow-pink-500/20 hover:brightness-110 active:scale-98 transition-all flex items-center gap-1.5"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Start Swiping
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 w-full max-w-md mx-auto space-y-4 pb-24 animate-fade-in">
      <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
        <div>
          <h2 className="text-xl font-black text-white">Mutual Matches</h2>
          <p className="text-xs text-zinc-400">People who secretly liked you back</p>
        </div>
        <span className="px-3 py-1 rounded-full bg-pink-500/20 text-pink-400 font-bold text-xs border border-pink-500/30">
          {matches.length} {matches.length === 1 ? 'Match' : 'Matches'}
        </span>
      </div>

      {/* Grid of matches */}
      <div className="grid grid-cols-2 gap-3 pt-2">
        {matches.map((item) => {
          const { profile, matchedAt } = item;
          const matchDate = new Date(matchedAt);
          const timeFormatted = matchDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

          return (
            <div
              key={item.id}
              onClick={() => onSelectMatch(profile)}
              className="group relative rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 hover:border-pink-500/50 transition-all duration-200 cursor-pointer shadow-lg hover:shadow-pink-500/10 active:scale-98 flex flex-col"
            >
              {/* Photo */}
              <div className="relative w-full aspect-[4/5] overflow-hidden">
                <img
                  src={profile.photo}
                  alt={profile.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

                {/* Match heart badge */}
                <div className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-pink-500 text-white flex items-center justify-center shadow-md">
                  <Heart className="w-3.5 h-3.5 fill-current stroke-none" />
                </div>

                {/* Overlay Name & Age */}
                <div className="absolute bottom-2.5 left-2.5 right-2.5 text-white">
                  <h4 className="font-bold text-sm leading-tight truncate">
                    {profile.name}, {profile.age}
                  </h4>
                  <p className="text-[10px] text-pink-300 font-medium truncate flex items-center gap-1 mt-0.5">
                    <GraduationCap className="w-3 h-3 flex-shrink-0" />
                    {profile.college}
                  </p>
                </div>
              </div>

              {/* Bottom message callout */}
              <div className="p-2.5 bg-zinc-900/90 flex items-center justify-between text-[11px] text-zinc-400">
                <span className="text-[10px] text-zinc-500">Matched {timeFormatted}</span>
                <span className="flex items-center gap-1 text-pink-400 font-semibold group-hover:text-pink-300">
                  <MessageCircle className="w-3 h-3" />
                  Chat
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
