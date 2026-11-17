'use client';

import React, { useState } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { MapPin, GraduationCap, Info, Sparkles } from 'lucide-react';
import { PublicProfile, SwipeAction } from '@/types';

interface SwipeCardProps {
  profile: PublicProfile;
  isTopCard: boolean;
  onSwipe: (action: SwipeAction) => void;
  onOpenDetails: (profile: PublicProfile) => void;
}

export const SwipeCard: React.FC<SwipeCardProps> = ({
  profile,
  isTopCard,
  onSwipe,
  onOpenDetails,
}) => {
  const [exitX, setExitX] = useState<number | null>(null);

  // Motion values for smooth drag and rotation
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-250, 250], [-22, 22]);
  
  // Opacities for the LIKE and NOPE stamps
  const likeOpacity = useTransform(x, [20, 120], [0, 1]);
  const nopeOpacity = useTransform(x, [-20, -120], [0, 1]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    const swipeThreshold = 100;
    const velocityThreshold = 400;

    if (info.offset.x > swipeThreshold || info.velocity.x > velocityThreshold) {
      setExitX(600);
      onSwipe('like');
    } else if (info.offset.x < -swipeThreshold || info.velocity.x < -velocityThreshold) {
      setExitX(-600);
      onSwipe('pass');
    }
  };

  if (!isTopCard) {
    // Background card in deck
    return (
      <div 
        className="absolute inset-0 rounded-3xl overflow-hidden bg-zinc-900 border border-zinc-800 shadow-xl transition-all duration-300"
        style={{
          transform: 'scale(0.95) translateY(12px)',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      >
        <img
          src={profile.photo}
          alt={profile.name}
          className="w-full h-full object-cover brightness-75"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute bottom-6 left-5 right-5 text-white/70">
          <h3 className="text-xl font-bold">{profile.name}, {profile.age}</h3>
          <p className="text-xs text-zinc-400 flex items-center gap-1 mt-1">
            <GraduationCap className="w-3.5 h-3.5 text-pink-400" />
            {profile.college}
          </p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      style={{
        x,
        rotate,
        zIndex: 10,
      }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      animate={exitX !== null ? { x: exitX, opacity: 0 } : { x: 0, opacity: 1 }}
      transition={{ duration: 0.25 }}
      className="absolute inset-0 rounded-3xl overflow-hidden bg-zinc-900 border border-zinc-800/80 shadow-2xl cursor-grab active:cursor-grabbing select-none"
    >
      {/* Profile Photo */}
      <img
        src={profile.photo}
        alt={profile.name}
        className="w-full h-full object-cover pointer-events-none select-none"
        draggable={false}
      />

      {/* Dark gradient for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/35 to-transparent pointer-events-none" />

      {/* LIKE Stamp Overlay (Visible on right drag) */}
      <motion.div
        style={{ opacity: likeOpacity }}
        className="absolute top-8 left-6 border-4 border-emerald-400 text-emerald-400 font-extrabold text-2xl uppercase tracking-wider px-3.5 py-1 rounded-xl -rotate-12 pointer-events-none shadow-lg backdrop-blur-sm bg-black/20"
      >
        LIKE
      </motion.div>

      {/* NOPE Stamp Overlay (Visible on left drag) */}
      <motion.div
        style={{ opacity: nopeOpacity }}
        className="absolute top-8 right-6 border-4 border-rose-500 text-rose-500 font-extrabold text-2xl uppercase tracking-wider px-3.5 py-1 rounded-xl rotate-12 pointer-events-none shadow-lg backdrop-blur-sm bg-black/20"
      >
        PASS
      </motion.div>

      {/* Profile Info Overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-5 pt-8 text-white pointer-events-auto">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-baseline gap-2">
              <h2 className="text-2xl font-black tracking-tight text-white">
                {profile.name}
              </h2>
              <span className="text-xl font-medium text-zinc-300">
                {profile.age}
              </span>
            </div>

            {/* College & Department */}
            <div className="flex flex-col gap-0.5 mt-1">
              <div className="flex items-center gap-1.5 text-xs font-medium text-pink-300">
                <GraduationCap className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{profile.college}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{profile.city}</span>
              </div>
            </div>
          </div>

          {/* Info button to open full bio details */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetails(profile);
            }}
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 backdrop-blur-md border border-white/20 text-white transition-all shadow-md"
            title="View Full Profile"
            aria-label="View Full Profile"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>

        {/* Short Bio */}
        <p className="mt-3 text-sm text-zinc-200 line-clamp-2 leading-relaxed font-normal">
          {profile.bio}
        </p>

        {/* Interest tags */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {profile.interests.slice(0, 3).map((tag, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full bg-zinc-800/80 text-zinc-200 border border-zinc-700/60 backdrop-blur-sm"
            >
              <Sparkles className="w-2.5 h-2.5 text-pink-400" />
              {tag}
            </span>
          ))}
          {profile.interests.length > 3 && (
            <span className="text-[11px] font-medium px-2 py-1 rounded-full bg-zinc-800/60 text-zinc-400">
              +{profile.interests.length - 3}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};
