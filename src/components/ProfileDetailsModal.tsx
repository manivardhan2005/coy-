'use client';

import React from 'react';
import { X, MapPin, GraduationCap, Sparkles, BookOpen, Calendar } from 'lucide-react';
import { PublicProfile } from '@/types';

interface ProfileDetailsModalProps {
  profile: PublicProfile | null;
  onClose: () => void;
}

export const ProfileDetailsModal: React.FC<ProfileDetailsModalProps> = ({
  profile,
  onClose,
}) => {
  if (!profile) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4 animate-fade-in">
      <div 
        className="relative w-full max-w-md max-h-[88vh] sm:rounded-3xl rounded-t-3xl bg-zinc-900 border border-zinc-800 shadow-2xl overflow-y-auto flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 backdrop-blur-md transition-all"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Profile Image Header */}
        <div className="relative w-full h-80 flex-shrink-0">
          <img
            src={profile.photo}
            alt={profile.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-black/30" />
          <div className="absolute bottom-4 left-5 right-5 text-white">
            <h2 className="text-3xl font-black">
              {profile.name}, {profile.age}
            </h2>
            <p className="text-xs text-pink-300 font-medium flex items-center gap-1.5 mt-1">
              <GraduationCap className="w-4 h-4" />
              {profile.college}
            </p>
          </div>
        </div>

        {/* Details Body */}
        <div className="p-6 space-y-5 text-zinc-200">
          {/* Location & Academic Details */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="flex items-center gap-2 p-3 rounded-xl bg-zinc-800/60 border border-zinc-800">
              <MapPin className="w-4 h-4 text-pink-400" />
              <div>
                <span className="block text-zinc-400 text-[10px]">Location</span>
                <span className="font-semibold text-zinc-200">{profile.city}</span>
              </div>
            </div>

            {profile.department && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-zinc-800/60 border border-zinc-800">
                <BookOpen className="w-4 h-4 text-purple-400" />
                <div className="truncate">
                  <span className="block text-zinc-400 text-[10px]">Major</span>
                  <span className="font-semibold text-zinc-200 truncate">{profile.department}</span>
                </div>
              </div>
            )}

            {profile.graduationYear && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-zinc-800/60 border border-zinc-800">
                <Calendar className="w-4 h-4 text-blue-400" />
                <div>
                  <span className="block text-zinc-400 text-[10px]">Class of</span>
                  <span className="font-semibold text-zinc-200">{profile.graduationYear}</span>
                </div>
              </div>
            )}
          </div>

          {/* About / Bio */}
          <div>
            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
              About Me
            </h4>
            <p className="text-sm leading-relaxed text-zinc-300 bg-zinc-800/30 p-4 rounded-2xl border border-zinc-800/50">
              {profile.bio}
            </p>
          </div>

          {/* Interests */}
          <div>
            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-pink-400" />
              Interests & Vibes
            </h4>
            <div className="flex flex-wrap gap-2">
              {profile.interests.map((tag, i) => (
                <span
                  key={i}
                  className="px-3 py-1.5 rounded-full text-xs font-medium bg-zinc-800 text-pink-200 border border-pink-500/20"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Safe privacy footer note */}
          <div className="text-[11px] text-zinc-500 text-center pt-2 border-t border-zinc-800/60">
            🔒 Double-blind protected. Swiping only notifies if interest is mutual.
          </div>
        </div>
      </div>
    </div>
  );
};
