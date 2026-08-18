'use client';

import { X, MessageSquare } from 'lucide-react';
import { useState, useEffect } from 'react';

interface SystemPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (prompt: string) => void;
  currentPrompt: string;
}

const PRESET_PROMPTS = [
  {
    label: 'Senior Developer',
    prompt: 'You are a senior software developer. Write clean, efficient, well-documented code. Explain your reasoning. Use best practices and modern patterns.',
  },
  {
    label: 'Code Reviewer',
    prompt: 'You are an expert code reviewer. Analyze code for bugs, security issues, performance problems, and suggest improvements. Be thorough but constructive.',
  },
  {
    label: 'Technical Writer',
    prompt: 'You are a technical documentation writer. Provide clear, well-structured explanations with examples. Use markdown formatting effectively.',
  },
  {
    label: 'Data Scientist',
    prompt: 'You are a data scientist expert in Python, pandas, numpy, and ML frameworks. Help with data analysis, visualization, and machine learning tasks.',
  },
];

export default function SystemPromptModal({ isOpen, onClose, onSave, currentPrompt }: SystemPromptModalProps) {
  const [prompt, setPrompt] = useState(currentPrompt);

  useEffect(() => {
    setPrompt(currentPrompt);
  }, [currentPrompt, isOpen]);

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-neutral-900 border border-white/10 rounded-2xl shadow-2xl animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h2 className="font-semibold text-neutral-100">System Prompt</h2>
              <p className="text-[11px] text-neutral-500">Customize model behavior</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-200 hover:bg-white/5 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Presets */}
        <div className="px-6 pt-4">
          <p className="text-[11px] text-neutral-500 font-medium uppercase tracking-wider mb-2.5">Quick Presets</p>
          <div className="flex flex-wrap gap-2">
            {PRESET_PROMPTS.map((preset) => (
              <button
                key={preset.label}
                onClick={() => setPrompt(preset.prompt)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  prompt === preset.prompt
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-white/5 border-white/10 text-neutral-400 hover:text-neutral-200 hover:bg-white/10'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Textarea */}
        <div className="px-6 py-4">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="You are a helpful assistant..."
            rows={5}
            className="w-full bg-neutral-800/80 border border-neutral-700/50 rounded-xl px-4 py-3 text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500/40 transition-all resize-none leading-relaxed"
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-[10px] text-neutral-600 font-mono">{prompt.length} chars</span>
            {prompt && (
              <button
                onClick={() => setPrompt('')}
                className="text-[11px] text-neutral-500 hover:text-red-400 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 px-6 py-4 border-t border-white/5">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-neutral-800 text-neutral-300 text-sm font-medium hover:bg-neutral-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onSave(prompt);
              onClose();
            }}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-neutral-950 text-sm font-semibold hover:from-emerald-400 hover:to-cyan-400 transition-all"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
