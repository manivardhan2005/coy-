'use client';

import React, { useState } from 'react';
import { X, Send, Sparkles, Heart } from 'lucide-react';
import { PublicProfile } from '@/types';

interface ChatModalProps {
  profile: PublicProfile | null;
  onClose: () => void;
}

interface Message {
  id: string;
  sender: 'user' | 'match';
  text: string;
  time: string;
}

export const ChatModal: React.FC<ChatModalProps> = ({ profile, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm1',
      sender: 'match',
      text: `Hey! Super happy we matched on Coy! 😊`,
      time: 'Just now'
    }
  ]);
  const [inputValue, setInputValue] = useState('');

  if (!profile) return null;

  const icebreakers = [
    `Which campus cafe has the best coffee?`,
    `What's your hot take on college fests?`,
    `Loved your bio! Let's swap Spotify recs?`
  ];

  const handleSend = (text: string) => {
    if (!text.trim()) return;

    const newMsg: Message = {
      id: `m_${Date.now()}`,
      sender: 'user',
      text: text.trim(),
      time: 'Just now'
    };

    setMessages(prev => [...prev, newMsg]);
    setInputValue('');

    // Simulated quick friendly reply
    setTimeout(() => {
      const replyMsg: Message = {
        id: `reply_${Date.now()}`,
        sender: 'match',
        text: `Haha totally agree! Can't believe we both swiped right on here 🙈`,
        time: 'Just now'
      };
      setMessages(prev => [...prev, replyMsg]);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4 animate-fade-in">
      <div className="relative w-full max-w-md h-[90vh] sm:h-[650px] sm:rounded-3xl rounded-t-3xl bg-zinc-900 border border-zinc-800 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900/90 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-full overflow-hidden border border-pink-500/50">
              <img src={profile.photo} alt={profile.name} className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-sm text-white">{profile.name}</h3>
                <Heart className="w-3 h-3 text-pink-500 fill-current" />
              </div>
              <p className="text-[10px] text-pink-300 truncate max-w-[180px]">{profile.college}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all"
            aria-label="Close chat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message history */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="text-center py-2">
            <span className="text-[10px] font-medium text-zinc-400 bg-zinc-800/80 px-2.5 py-1 rounded-full border border-zinc-700/50">
              Mutual Match • Double-Blind Verified
            </span>
          </div>

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[78%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-br-none'
                    : 'bg-zinc-800 text-zinc-100 rounded-bl-none border border-zinc-700/60'
                }`}
              >
                {msg.text}
              </div>
              <span className="text-[9px] text-zinc-400 mt-1 px-1">{msg.time}</span>
            </div>
          ))}
        </div>

        {/* Suggested Icebreakers */}
        <div className="p-2.5 bg-zinc-950/60 border-t border-zinc-800/60 flex items-center gap-1.5 overflow-x-auto text-[11px] no-scrollbar">
          <Sparkles className="w-3.5 h-3.5 text-pink-400 flex-shrink-0 ml-1" />
          {icebreakers.map((ib, i) => (
            <button
              key={i}
              onClick={() => handleSend(ib)}
              className="flex-shrink-0 px-2.5 py-1 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 text-[11px] transition-all"
            >
              {ib}
            </button>
          ))}
        </div>

        {/* Input box */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(inputValue);
          }}
          className="p-3 bg-zinc-900 border-t border-zinc-800 flex items-center gap-2"
        >
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={`Message ${profile.name.split(' ')[0]}...`}
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-pink-500"
          />
          <button
            type="submit"
            disabled={!inputValue.trim()}
            className="p-2.5 rounded-xl bg-pink-500 hover:bg-pink-600 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
