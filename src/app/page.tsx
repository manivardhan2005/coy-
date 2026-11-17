'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PublicProfile, MatchRecord, SwipeAction, SwipeResponse } from '@/types';
import { TopHeader, BottomTabBar, ActiveTab } from '@/components/Navigation';
import { SwipeDeck } from '@/components/SwipeDeck';
import { MatchesView } from '@/components/MatchesView';
import { HomeTab } from '@/components/HomeTab';
import { MatchModal } from '@/components/MatchModal';
import { ProfileDetailsModal } from '@/components/ProfileDetailsModal';
import { ChatModal } from '@/components/ChatModal';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('discover');
  const [profiles, setProfiles] = useState<PublicProfile[]>([]);
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isResetting, setIsResetting] = useState(false);

  // Modals state
  const [matchedProfile, setMatchedProfile] = useState<PublicProfile | null>(null);
  const [inspectProfile, setInspectProfile] = useState<PublicProfile | null>(null);
  const [chatProfile, setChatProfile] = useState<PublicProfile | null>(null);

  // Fetch feed profiles (profiles not yet swiped)
  const fetchFeed = useCallback(async () => {
    try {
      const res = await fetch('/api/feed', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setProfiles(data.profiles || []);
      }
    } catch (err) {
      console.error('Failed to fetch feed:', err);
    }
  }, []);

  // Fetch mutual matches
  const fetchMatches = useCallback(async () => {
    try {
      const res = await fetch('/api/matches', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setMatches(data.matches || []);
      }
    } catch (err) {
      console.error('Failed to fetch matches:', err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    async function init() {
      setLoading(true);
      await Promise.all([fetchFeed(), fetchMatches()]);
      setLoading(false);
    }
    init();
  }, [fetchFeed, fetchMatches]);

  // Handle Swipe (Like or Pass)
  const handleSwipeAction = async (profileId: string, action: SwipeAction): Promise<SwipeResponse | null> => {
    try {
      const res = await fetch('/api/swipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId, action }),
      });

      if (!res.ok) {
        throw new Error(`Swipe failed with status ${res.status}`);
      }

      const result: SwipeResponse = await res.json();

      // If mutual match occurred, trigger celebration modal!
      if (result.matched && result.match) {
        setMatchedProfile(result.match);
        // Refresh matches list in background
        fetchMatches();
      }

      return result;
    } catch (error) {
      console.error('Error recording swipe:', error);
      return null;
    }
  };

  // Reset Demo State
  const handleResetDemo = async () => {
    setIsResetting(true);
    try {
      const res = await fetch('/api/reset', { method: 'POST' });
      if (res.ok) {
        await Promise.all([fetchFeed(), fetchMatches()]);
        setActiveTab('discover');
      }
    } catch (err) {
      console.error('Failed to reset demo:', err);
    } finally {
      setIsResetting(false);
    }
  };

  const handleSendMessageFromMatch = (profile: PublicProfile) => {
    setMatchedProfile(null);
    setChatProfile(profile);
  };

  return (
    <main className="w-full min-h-screen bg-[#070709] flex flex-col items-center justify-between relative overflow-hidden">
      {/* Mobile container simulator (max-w-md on desktop, full-width on mobile) */}
      <div className="w-full max-w-md min-h-screen flex flex-col bg-[#0b0b0e] border-x border-zinc-900 shadow-2xl relative">
        
        {/* Top Header */}
        <TopHeader
          onResetDemo={handleResetDemo}
          isResetting={isResetting}
        />

        {/* Tab Content */}
        <div className="flex-1 flex flex-col relative overflow-hidden">
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 gap-3">
              <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
              <p className="text-xs">Loading campus network...</p>
            </div>
          ) : (
            <>
              {activeTab === 'home' && (
                <HomeTab onGoToDiscover={() => setActiveTab('discover')} />
              )}

              {activeTab === 'discover' && (
                <SwipeDeck
                  profiles={profiles}
                  onSwipeAction={handleSwipeAction}
                  onOpenDetails={(p) => setInspectProfile(p)}
                  onResetFeed={handleResetDemo}
                  onGoToMatches={() => setActiveTab('matches')}
                  matchesCount={matches.length}
                  isResetting={isResetting}
                />
              )}

              {activeTab === 'matches' && (
                <MatchesView
                  matches={matches}
                  onSelectMatch={(p) => setInspectProfile(p)}
                  onGoToDiscover={() => setActiveTab('discover')}
                />
              )}
            </>
          )}
        </div>

        {/* Bottom Tab Bar */}
        <BottomTabBar
          activeTab={activeTab}
          onTabChange={(tab) => setActiveTab(tab)}
          matchesCount={matches.length}
          onResetDemo={handleResetDemo}
          isResetting={isResetting}
        />
      </div>

      {/* Match Celebration Modal */}
      <MatchModal
        matchedProfile={matchedProfile}
        onClose={() => setMatchedProfile(null)}
        onSendMessage={handleSendMessageFromMatch}
      />

      {/* Profile Details Sheet */}
      <ProfileDetailsModal
        profile={inspectProfile}
        onClose={() => setInspectProfile(null)}
      />

      {/* Simulated Chat Modal */}
      <ChatModal
        profile={chatProfile}
        onClose={() => setChatProfile(null)}
      />
    </main>
  );
}
