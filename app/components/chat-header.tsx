'use client';

import { Sparkles, ChevronDown, LogOut, Plus, Settings } from 'lucide-react';

export interface ModelOption {
  id: string;
  name: string;
  tag: string;
}

interface ChatHeaderProps {
  selectedModel: string;
  models: ModelOption[];
  onModelChange: (modelId: string) => void;
  onNewChat: () => void;
  onLogout: () => void;
  onOpenSettings: () => void;
  username?: string;
}

export default function ChatHeader({
  selectedModel,
  models,
  onModelChange,
  onNewChat,
  onLogout,
  onOpenSettings,
  username,
}: ChatHeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-neutral-950/70 border-b border-white/10 shadow-2xl">
      <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Left: Logo + Model Selector */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-base tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
              NVIDIA AI Chat
            </h1>
            <div className="relative inline-flex items-center">
              <select
                value={selectedModel}
                onChange={(e) => onModelChange(e.target.value)}
                className="bg-transparent text-[11px] text-neutral-400 hover:text-neutral-200 cursor-pointer focus:outline-none appearance-none pr-4 font-medium"
              >
                {models.map((m) => (
                  <option key={m.id} value={m.id} className="bg-neutral-900 text-neutral-200">
                    {m.name} ({m.tag})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 text-neutral-500 absolute right-0 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* User Badge */}
          {username && (
            <div className="flex items-center gap-2 mr-1 px-3 py-1.5 rounded-lg bg-neutral-800/50 border border-neutral-700/50">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-[11px] font-bold text-neutral-950 uppercase">
                {username.charAt(0)}
              </div>
              <span className="text-xs text-neutral-300 font-medium hidden sm:inline">
                {username}
              </span>
            </div>
          )}

          {/* Status Indicator */}
          <div className="flex items-center gap-1.5 mr-1">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>

          {/* New Chat */}
          <button
            onClick={onNewChat}
            title="New Chat (Ctrl+N)"
            className="p-2 rounded-lg bg-neutral-800/50 border border-neutral-700/50 text-neutral-400 hover:text-emerald-400 hover:border-emerald-800/50 hover:bg-emerald-950/30 transition-all"
          >
            <Plus className="w-4 h-4" />
          </button>

          {/* System Prompt Settings */}
          <button
            onClick={onOpenSettings}
            title="System Prompt"
            className="p-2 rounded-lg bg-neutral-800/50 border border-neutral-700/50 text-neutral-400 hover:text-cyan-400 hover:border-cyan-800/50 hover:bg-cyan-950/30 transition-all"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Logout */}
          <button
            onClick={onLogout}
            title="Sign Out"
            className="p-2 rounded-lg bg-neutral-800/50 border border-neutral-700/50 text-neutral-400 hover:text-red-400 hover:border-red-800/50 hover:bg-red-950/30 transition-all"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
