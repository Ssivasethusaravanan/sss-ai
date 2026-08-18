'use client';

import { Send, Square } from 'lucide-react';
import { FormEvent, KeyboardEvent, useRef, useEffect } from 'react';

interface ChatInputProps {
  input: string;
  onInputChange: (value: string) => void;
  onSubmit: (e: FormEvent) => void;
  onStop: () => void;
  isLoading: boolean;
  modelName: string;
}

export default function ChatInput({
  input,
  onInputChange,
  onSubmit,
  onStop,
  isLoading,
  modelName,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [input]);

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isLoading) {
        onSubmit(e as unknown as FormEvent);
      }
    }
  }

  return (
    <div className="fixed bottom-0 left-0 w-full bg-gradient-to-t from-neutral-950 via-neutral-950/95 to-transparent pt-8 pb-5 px-4 z-40">
      <div className="max-w-4xl mx-auto relative">
        <form
          onSubmit={onSubmit}
          className="relative flex items-end bg-neutral-900/80 backdrop-blur-xl border border-neutral-700/50 rounded-2xl shadow-2xl p-2 focus-within:ring-2 focus-within:ring-emerald-500/40 focus-within:border-emerald-500/40 transition-all duration-300"
        >
          <textarea
            ref={textareaRef}
            className="w-full bg-transparent border-none px-4 py-2.5 text-[15px] text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-0 resize-none min-h-[44px] max-h-[200px] leading-relaxed"
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${modelName}...`}
            disabled={isLoading}
            rows={1}
          />
          <div className="flex items-center gap-2 shrink-0 pb-0.5 pr-1">
            {/* Character count */}
            {input.length > 0 && (
              <span className="text-[10px] text-neutral-600 font-mono tabular-nums">
                {input.length}
              </span>
            )}

            {isLoading ? (
              <button
                type="button"
                onClick={onStop}
                className="p-2.5 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 transition-colors"
                title="Stop generating"
              >
                <Square className="w-4 h-4 fill-current" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim()}
                className="p-2.5 rounded-xl bg-emerald-500 text-neutral-950 hover:bg-emerald-400 disabled:bg-neutral-800 disabled:text-neutral-500 disabled:cursor-not-allowed transition-colors duration-200"
              >
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>
        </form>
        <div className="flex items-center justify-between mt-2.5 px-2">
          <span className="text-[10px] text-neutral-600 font-medium">
            Shift+Enter for new line
          </span>
          <span className="text-[10px] text-neutral-600 font-medium">
            Powered by NVIDIA NIM
          </span>
        </div>
      </div>
    </div>
  );
}
