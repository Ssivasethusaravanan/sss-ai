'use client';

import { Bot, User } from 'lucide-react';
import MarkdownRenderer from './markdown-renderer';

export interface MessageData {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  responseTime?: number;
}

interface ChatMessageProps {
  message: MessageData;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-4 max-w-[88%] ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}>
      {/* Avatar */}
      <div
        className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center shadow-lg border ${
          isUser
            ? 'bg-neutral-800 border-neutral-700 text-neutral-300'
            : 'bg-emerald-950 border-emerald-800 text-emerald-400'
        }`}
      >
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      {/* Message Bubble */}
      <div className="flex flex-col gap-1 min-w-0">
        <div
          className={`px-5 py-3.5 rounded-3xl leading-relaxed text-[15px] shadow-xl ${
            isUser
              ? 'bg-gradient-to-br from-neutral-800 to-neutral-900 border border-neutral-700/50 text-neutral-100 rounded-tr-sm'
              : 'bg-neutral-900/80 backdrop-blur-sm border border-emerald-900/30 text-neutral-200 rounded-tl-sm shadow-emerald-900/5'
          }`}
        >
          {isUser ? (
            <div className="whitespace-pre-wrap">{message.content}</div>
          ) : (
            <MarkdownRenderer content={message.content} />
          )}
        </div>

        {/* Response Time Badge */}
        {!isUser && message.responseTime && message.responseTime > 0 && (
          <div className="flex items-center gap-1.5 px-2 mt-1">
            <span className="text-[10px] text-neutral-600 font-mono">
              ⚡ {message.responseTime < 1000
                ? `${message.responseTime}ms`
                : `${(message.responseTime / 1000).toFixed(1)}s`}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
