'use client';

import React from 'react';
import { Flame, Compass, Heart, Home, RotateCcw } from 'lucide-react';

export type ActiveTab = 'home' | 'discover' | 'matches';

interface NavigationProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  matchesCount: number;
  onResetDemo: () => void;
  isResetting: boolean;
}

export const TopHeader: React.FC<{
  onResetDemo: () => void;
  isResetting: boolean;
}> = ({ onResetDemo, isResetting }) => {
  return (
    <header className="w-full max-w-md mx-auto flex items-center justify-between px-5 py-3 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-40">
      {/* Brand logo */}
      <div className="flex items-center gap-2 select-none">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-pink-600 to-rose-500 flex items-center justify-center text-white shadow-md shadow-pink-500/20">
          <Flame className="w-4 h-4 fill-current stroke-none" />
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-xl font-black tracking-tight text-white">coy</span>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-pink-400 px-1.5 py-0.5 rounded-full bg-pink-500/10 border border-pink-500/20">
            Discover
          </span>
        </div>
      </div>

      {/* Demo reset button */}
      <button
        onClick={onResetDemo}
        disabled={isResetting}
        className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-400 hover:text-white px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all active:scale-95 disabled:opacity-50"
        title="Reset feed to initial state"
      >
        <RotateCcw className={`w-3 h-3 ${isResetting ? 'animate-spin' : ''}`} />
        <span className="hidden sm:inline">Reset Demo</span>
      </button>
    </header>
  );
};

export const BottomTabBar: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
  matchesCount,
}) => {
  return (
    <nav className="w-full max-w-md mx-auto fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/90 backdrop-blur-lg border-t border-zinc-800/80 px-6 py-2 select-none">
      <div className="flex items-center justify-around">
        {/* Home Tab */}
        <button
          onClick={() => onTabChange('home')}
          className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition-all ${
            activeTab === 'home'
              ? 'text-pink-500 font-bold'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
          aria-label="Home Tab"
        >
          <Home className="w-5 h-5 stroke-[2]" />
          <span className="text-[10px]">Home</span>
        </button>

        {/* Discover Tab */}
        <button
          onClick={() => onTabChange('discover')}
          className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition-all relative ${
            activeTab === 'discover'
              ? 'text-pink-500 font-bold'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
          aria-label="Discover Tab"
        >
          <Compass className="w-5 h-5 stroke-[2]" />
          <span className="text-[10px]">Discover</span>
          {activeTab === 'discover' && (
            <span className="absolute -top-0.5 w-1 h-1 rounded-full bg-pink-500" />
          )}
        </button>

        {/* Matches Tab */}
        <button
          onClick={() => onTabChange('matches')}
          className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition-all relative ${
            activeTab === 'matches'
              ? 'text-pink-500 font-bold'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
          aria-label="Matches Tab"
        >
          <div className="relative">
            <Heart className={`w-5 h-5 stroke-[2] ${activeTab === 'matches' ? 'fill-pink-500 text-pink-500' : ''}`} />
            {matchesCount > 0 && (
              <span className="absolute -top-1.5 -right-2.5 px-1.5 py-0.2 rounded-full bg-pink-600 text-white text-[9px] font-bold border border-zinc-950 animate-pulse">
                {matchesCount}
              </span>
            )}
          </div>
          <span className="text-[10px]">Matches</span>
        </button>
      </div>
    </nav>
  );
};
