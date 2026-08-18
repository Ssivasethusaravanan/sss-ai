'use client';

import { Key, Eye, EyeOff, Sparkles } from 'lucide-react';
import { useState, FormEvent } from 'react';

interface ApiKeyScreenProps {
  onSaveKey: (key: string) => void;
}

export default function ApiKeyScreen({ onSaveKey }: ApiKeyScreenProps) {
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!apiKeyInput.trim()) return;
    onSaveKey(apiKeyInput.trim());
  }

  return (
    <div className="flex flex-col min-h-screen bg-neutral-950 text-neutral-50 font-sans items-center justify-center px-4">
      {/* Glow Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-emerald-500/8 blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-1/4 left-1/3 w-[400px] h-[400px] rounded-full bg-cyan-500/8 blur-[100px] animate-pulse-slow" />
      </div>

      <div className="relative z-10 w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center shadow-xl shadow-emerald-500/25 animate-float">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
            NVIDIA AI Chat
          </h1>
          <p className="text-neutral-400 text-sm mt-2">
            Test all NVIDIA NIM models for free
          </p>
        </div>

        {/* API Key Card */}
        <div className="bg-neutral-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Key className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="font-semibold text-lg text-neutral-100">Enter Your API Key</h2>
              <p className="text-xs text-neutral-400">Stored locally in your browser only</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="nvapi-..."
                autoFocus
                className="w-full bg-neutral-800/80 border border-neutral-700/50 rounded-xl px-4 py-3.5 pr-12 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all font-mono"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <button
              type="submit"
              disabled={!apiKeyInput.trim()}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-neutral-950 font-semibold text-sm hover:from-emerald-400 hover:to-cyan-400 disabled:from-neutral-700 disabled:to-neutral-700 disabled:text-neutral-500 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30"
            >
              Start Chatting
            </button>
          </form>

          {/* Features Grid */}
          <div className="grid grid-cols-2 gap-3 mt-6 pt-5 border-t border-white/5">
            {[
              { icon: '🦙', label: 'Llama 3.1 405B' },
              { icon: '🔬', label: 'DeepSeek R1' },
              { icon: '🟢', label: 'Nemotron 70B' },
              { icon: '⚡', label: 'Mixtral 8x22B' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2 text-xs text-neutral-500">
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </div>
            ))}
          </div>

          <div className="mt-4">
            <p className="text-xs text-neutral-500 leading-relaxed">
              Get your free API key from{' '}
              <a
                href="https://build.nvidia.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2 transition-colors"
              >
                build.nvidia.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
