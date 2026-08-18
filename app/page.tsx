'use client';

import { useState, useRef, useEffect, FormEvent } from 'react';
import { Bot, Send, User, Sparkles, Loader2, AlertCircle, Key, Eye, EyeOff, LogOut } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load saved API key from localStorage on mount
  useEffect(() => {
    const savedKey = localStorage.getItem('nvidia_api_key');
    if (savedKey) setApiKey(savedKey);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function handleSaveKey(e: FormEvent) {
    e.preventDefault();
    if (!apiKeyInput.trim()) return;
    const key = apiKeyInput.trim();
    setApiKey(key);
    localStorage.setItem('nvidia_api_key', key);
    setApiKeyInput('');
  }

  function handleLogout() {
    setApiKey('');
    setMessages([]);
    localStorage.removeItem('nvidia_api_key');
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    setError(null);
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    const assistantId = (Date.now() + 1).toString();
    setMessages([...newMessages, { id: assistantId, role: 'assistant', content: '' }]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          apiKey,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`API Error (${res.status}): ${errorText}`);
      }

      if (!res.body) {
        throw new Error('No response body');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('0:')) {
            try {
              const text = JSON.parse(line.slice(2));
              fullContent += text;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? { ...m, content: fullContent } : m
                )
              );
            } catch {
              // skip malformed lines
            }
          }
        }
      }

      if (!fullContent) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: 'No response received. Check your API key.' }
              : m
          )
        );
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      setMessages((prev) => prev.filter((m) => m.id !== assistantId));
    } finally {
      setIsLoading(false);
    }
  }

  // ──── API Key Entry Screen ────
  if (!apiKey) {
    return (
      <div className="flex flex-col min-h-screen bg-neutral-950 text-neutral-50 font-sans items-center justify-center px-4">

        {/* Animated Background Glow */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-emerald-500/5 blur-[120px]" />
          <div className="absolute bottom-1/4 left-1/3 w-[400px] h-[400px] rounded-full bg-cyan-500/5 blur-[100px]" />
        </div>

        <div className="relative z-10 w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center shadow-xl shadow-emerald-500/25">
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
          <div className="bg-neutral-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <Key className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h2 className="font-semibold text-lg text-neutral-100">Enter Your API Key</h2>
                <p className="text-xs text-neutral-400">Stored locally in your browser only</p>
              </div>
            </div>

            <form onSubmit={handleSaveKey} className="space-y-4">
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="nvapi-..."
                  className="w-full bg-neutral-800/80 border border-neutral-700/50 rounded-xl px-4 py-3.5 pr-12 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
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

            <div className="mt-6 pt-5 border-t border-white/5">
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
                . Sign up, pick any model, and generate your key. Your key is never sent to any server except NVIDIA&apos;s API.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ──── Chat Screen ────
  return (
    <div className="flex flex-col min-h-screen bg-neutral-950 text-neutral-50 font-sans selection:bg-emerald-500/30">

      {/* Header */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-neutral-950/70 border-b border-white/10 shadow-2xl">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
                NVIDIA AI Chat
              </h1>
              <p className="text-xs text-neutral-400 font-medium">Powered by Llama 3.1 70B</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <span className="text-xs text-neutral-300 font-medium">API Active</span>
            </div>
            <button
              onClick={handleLogout}
              title="Change API Key"
              className="p-2 rounded-lg bg-neutral-800/50 border border-neutral-700/50 text-neutral-400 hover:text-red-400 hover:border-red-800/50 hover:bg-red-950/30 transition-all"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Chat Area */}
      <main className="flex-1 w-full max-w-4xl mx-auto p-4 flex flex-col pt-8 pb-40">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 mb-6 rounded-2xl bg-neutral-900 border border-white/5 flex items-center justify-center shadow-2xl shadow-emerald-900/20">
              <Bot className="w-10 h-10 text-emerald-400" />
            </div>
            <h2 className="text-3xl font-bold mb-3 tracking-tight">How can I help you today?</h2>
            <p className="text-neutral-400 max-w-md text-sm leading-relaxed">
              Experience the power of NVIDIA NIM. Ask me anything and I&apos;ll generate a response using state-of-the-art AI models.
            </p>

            {/* Suggestion Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-8 w-full max-w-lg">
              {[
                '💡 Explain quantum computing in simple terms',
                '🚀 Write a Python function to sort a list',
                '🎨 Describe the theory of relativity',
                '🧠 What are transformers in AI?',
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setInput(suggestion.slice(2).trim())}
                  className="text-left px-4 py-3 rounded-2xl bg-neutral-900/60 border border-white/5 text-sm text-neutral-300 hover:bg-neutral-800/80 hover:border-emerald-900/30 hover:text-neutral-100 transition-all"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-4 max-w-[85%] ${m.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
              >
                {/* Avatar */}
                <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center shadow-lg border ${
                  m.role === 'user'
                    ? 'bg-neutral-800 border-neutral-700 text-neutral-300'
                    : 'bg-emerald-950 border-emerald-800 text-emerald-400'
                }`}>
                  {m.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                {/* Message Bubble */}
                <div className={`px-5 py-3.5 rounded-3xl leading-relaxed text-[15px] shadow-xl ${
                  m.role === 'user'
                    ? 'bg-gradient-to-br from-neutral-800 to-neutral-900 border border-neutral-700/50 text-neutral-100 rounded-tr-sm'
                    : 'bg-neutral-900/80 backdrop-blur-sm border border-emerald-900/30 text-neutral-200 rounded-tl-sm shadow-emerald-900/5'
                }`}>
                  <div className="whitespace-pre-wrap">{m.content}</div>
                </div>
              </div>
            ))}

            {/* Loading Indicator */}
            {isLoading && messages[messages.length - 1]?.content === '' && (
              <div className="flex gap-4 mr-auto max-w-[85%]">
                <div className="w-8 h-8 shrink-0 rounded-full bg-emerald-950 border border-emerald-800 flex items-center justify-center shadow-lg text-emerald-400">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="px-5 py-3.5 rounded-3xl bg-neutral-900/80 backdrop-blur-sm border border-emerald-900/30 rounded-tl-sm flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />
                  <span className="text-sm text-neutral-400">Thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      {/* Error Banner */}
      {error && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 max-w-lg w-full mx-4">
          <div className="bg-red-950/90 backdrop-blur-xl border border-red-800/50 rounded-2xl px-5 py-4 shadow-2xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-200 font-medium">Error</p>
              <p className="text-xs text-red-300/80 mt-1 break-all">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300 text-sm font-bold">✕</button>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="fixed bottom-0 left-0 w-full bg-gradient-to-t from-neutral-950 via-neutral-950 to-transparent pt-10 pb-6 px-4">
        <div className="max-w-4xl mx-auto relative">
          <form
            onSubmit={handleSubmit}
            className="relative flex items-center bg-neutral-900/80 backdrop-blur-xl border border-neutral-700/50 rounded-full shadow-2xl p-1.5 focus-within:ring-2 focus-within:ring-emerald-500/50 focus-within:border-emerald-500/50 transition-all duration-300"
          >
            <input
              className="w-full bg-transparent border-none px-6 py-3.5 text-[15px] text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-0"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Message NVIDIA AI..."
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="shrink-0 p-3.5 ml-2 rounded-full bg-emerald-500 text-neutral-950 hover:bg-emerald-400 disabled:bg-neutral-800 disabled:text-neutral-500 disabled:cursor-not-allowed transition-colors duration-200"
            >
              <Send className="w-5 h-5 ml-0.5" />
            </button>
          </form>
          <div className="text-center mt-3">
            <span className="text-[11px] text-neutral-500 font-medium tracking-wide">
              AI can make mistakes. Verify important information.
            </span>
          </div>
        </div>
      </div>

    </div>
  );
}
