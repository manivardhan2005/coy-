'use client';

import React from 'react';
import { Flame, Lock, Sparkles, ArrowRight } from 'lucide-react';

interface HomeTabProps {
  onGoToDiscover: () => void;
}

export const HomeTab: React.FC<HomeTabProps> = ({ onGoToDiscover }) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 h-full max-w-sm mx-auto animate-fade-in">
      {/* Subtle brand icon */}
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-pink-600 to-rose-500 flex items-center justify-center text-white shadow-xl shadow-pink-500/20 mb-6">
        <Flame className="w-8 h-8 fill-current stroke-none" />
      </div>

      <h2 className="text-2xl font-black tracking-tight text-white">
        Coy Home
      </h2>

      <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
        Placeholder tab representing Coy&apos;s primary secret crush &amp; campus invite core experience.
      </p>

      {/* Feature recap badge cards */}
      <div className="w-full mt-6 space-y-2.5 text-left">
        <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 flex-shrink-0">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-semibold text-zinc-200">Secret Crush Lock</div>
            <div className="text-[11px] text-zinc-400">Zero-knowledge double-blind matching</div>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 flex-shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-semibold text-zinc-200">College Verified</div>
            <div className="text-[11px] text-zinc-400">Trusted student campus network</div>
          </div>
        </div>
      </div>

      {/* Action button */}
      <div className="mt-8 w-full">
        <button
          onClick={onGoToDiscover}
          className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-pink-500/25 active:scale-98 transition-all"
        >
          Open &ldquo;Discover&rdquo; Tab
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
