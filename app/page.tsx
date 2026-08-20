'use client';

import { useState, useRef, useEffect, useCallback, FormEvent } from 'react';
import { Bot, Loader2, AlertCircle, Menu, Plus, MessageSquare, X } from 'lucide-react';
import ChatHeader, { ModelOption } from './components/chat-header';
import ChatInput from './components/chat-input';
import ChatMessage, { MessageData } from './components/chat-message';
import AuthPage from './components/auth-page';
import SystemPromptModal from './components/system-prompt-modal';

const AVAILABLE_MODELS: ModelOption[] = [
  { id: 'meta/llama-3.1-8b-instruct', name: 'Llama 3.1 8B', tag: 'Fast' },
  { id: 'meta/llama-3.1-70b-instruct', name: 'Llama 3.1 70B', tag: 'Balanced' },
  { id: 'nvidia/llama-3.3-nemotron-super-49b-v1.5', name: 'Nemotron Super 49B', tag: 'NVIDIA' },
  { id: 'nvidia/nemotron-3-super-120b-a12b', name: 'Nemotron Super 120B', tag: 'Advanced' },
  { id: 'nvidia/nemotron-3-ultra-550b-a55b', name: 'Nemotron Ultra 550B', tag: 'Flagship' },
];

interface AuthUser {
  id: number;
  username: string;
  email: string;
}

interface ChatHistoryItem {
  id: string;
  title: string;
  updated_at: string;
}

export default function ChatApp() {
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auth state
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Chat History state
  const [chats, setChats] = useState<ChatHistoryItem[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isChatsLoading, setIsChatsLoading] = useState(false);

  const [selectedModel, setSelectedModel] = useState(AVAILABLE_MODELS[1].id); // Default to 70B
  const [systemPrompt, setSystemPrompt] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Fetch past chats
  const fetchChats = useCallback(async () => {
    setIsChatsLoading(true);
    try {
      const res = await fetch('/api/chats');
      const data = await res.json();
      if (data.chats) {
        setChats(data.chats);
      }
    } catch {
      // Ignore
    } finally {
      setIsChatsLoading(false);
    }
  }, []);

  // Check auth status on mount
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
          fetchChats();
        }
      } catch {
        // Not authenticated
      } finally {
        setIsAuthLoading(false);
      }
    }
    checkAuth();
  }, [fetchChats]);

  // Load persisted state
  useEffect(() => {
    const savedModel = localStorage.getItem('nvidia_model');
    if (savedModel) setSelectedModel(savedModel);
    const savedPrompt = localStorage.getItem('nvidia_system_prompt');
    if (savedPrompt) setSystemPrompt(savedPrompt);
  }, []);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        handleNewChat();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  });

  // ──── Handlers ────

  function handleNewChat() {
    if (isLoading) handleStop();
    setCurrentChatId(null);
    setMessages([]);
    setError(null);
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  }

  async function handleSelectChat(chatId: string) {
    if (isLoading) handleStop();
    setCurrentChatId(chatId);
    setMessages([]);
    setError(null);
    if (window.innerWidth < 768) setIsSidebarOpen(false);

    try {
      const res = await fetch(`/api/chats/${chatId}/messages`);
      const data = await res.json();
      if (data.messages) {
        setMessages(data.messages);
      } else {
        setError(data.error || 'Failed to load messages');
      }
    } catch {
      setError('Failed to load chat messages.');
    }
  }

  function handleModelChange(modelId: string) {
    setSelectedModel(modelId);
    localStorage.setItem('nvidia_model', modelId);
  }

  function handleSystemPromptSave(prompt: string) {
    setSystemPrompt(prompt);
    localStorage.setItem('nvidia_system_prompt', prompt);
  }

  const handleStop = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsLoading(false);
  }, []);

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignore logout errors
    }
    setUser(null);
    setMessages([]);
    setChats([]);
    setCurrentChatId(null);
    setError(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    setError(null);
    const userMessage: MessageData = {
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

    const startTime = Date.now();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          model: selectedModel,
          systemPrompt: systemPrompt || undefined,
          chatId: currentChatId,
        }),
      });

      if (res.status === 401) {
        setUser(null);
        setError('Session expired. Please sign in again.');
        setMessages((prev) => prev.filter((m) => m.id !== assistantId));
        return;
      }

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(errorData.error || `HTTP ${res.status}`);
      }

      const returnedChatId = res.headers.get('X-Chat-Id');
      if (returnedChatId && returnedChatId !== currentChatId) {
        setCurrentChatId(returnedChatId);
        fetchChats(); // Refresh history
      }

      if (!res.body) throw new Error('No response stream received');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        fullContent += chunk;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: fullContent } : m
          )
        );
      }

      const responseTime = Date.now() - startTime;

      // Finalize with response time
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? {
                ...m,
                content: fullContent || 'No response received. Check your model selection or API quota.',
                responseTime,
              }
            : m
        )
      );
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        // User cancelled — keep whatever content was streamed
        setMessages((prev) => prev.filter((m) => m.id !== assistantId || m.content !== ''));
      } else {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error occurred';
        setError(errorMsg);
        setMessages((prev) => prev.filter((m) => m.id !== assistantId));
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }

  // ──── Loading State ────
  if (isAuthLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-neutral-950 text-neutral-50 items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
      </div>
    );
  }

  // ──── Auth Gate ────
  if (!user) {
    return <AuthPage onAuthSuccess={(u) => { setUser(u); fetchChats(); }} />;
  }

  const currentModelName = AVAILABLE_MODELS.find((m) => m.id === selectedModel)?.name || 'AI';

  // ──── Chat App ────
  return (
    <div className="flex h-screen overflow-hidden bg-neutral-950 text-neutral-50 font-sans">
      
      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-40 w-72 bg-neutral-900 border-r border-white/10 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex flex-col h-full p-4">
          <button 
            onClick={handleNewChat}
            className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium transition-colors mb-6 shadow-lg shadow-emerald-900/20"
          >
            <Plus className="w-5 h-5" />
            New Chat
          </button>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-2">
            <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3 px-2">Recent Chats</h3>
            {isChatsLoading ? (
              <div className="flex justify-center p-4">
                <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
              </div>
            ) : chats.length === 0 ? (
              <p className="text-sm text-neutral-500 px-2">No past chats found.</p>
            ) : (
              chats.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => handleSelectChat(chat.id)}
                  className={`flex items-center gap-3 w-full text-left px-3 py-3 rounded-xl transition-colors ${currentChatId === chat.id ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-900/50' : 'text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200'}`}
                >
                  <MessageSquare className="w-4 h-4 shrink-0" />
                  <span className="text-sm font-medium truncate flex-1">{chat.title}</span>
                </button>
              ))
            )}
          </div>
          
          {/* Mobile close button inside sidebar */}
          <button 
            className="md:hidden absolute top-4 right-4 text-neutral-400 hover:text-white"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0 h-full relative">
        
        {/* Header overrides */}
        <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-neutral-950/80 backdrop-blur-xl border-b border-white/5">
          <div className="flex items-center gap-3">
            <button 
              className="p-2 -ml-2 text-neutral-400 hover:text-white md:hidden rounded-lg hover:bg-neutral-800"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <ChatHeader
              selectedModel={selectedModel}
              models={AVAILABLE_MODELS}
              onModelChange={handleModelChange}
              onNewChat={handleNewChat}
              onLogout={handleLogout}
              onOpenSettings={() => setShowSettings(true)}
              username={user.username}
            />
          </div>
        </header>

        {/* System Prompt Modal */}
        <SystemPromptModal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          onSave={handleSystemPromptSave}
          currentPrompt={systemPrompt}
        />

        {/* Main Chat Area */}
        <main className="flex-1 overflow-y-auto w-full px-4 pt-6 pb-44 scroll-smooth">
          <div className="max-w-4xl mx-auto flex flex-col">
            {messages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center animate-fade-in mt-12">
                <div className="w-20 h-20 mb-6 rounded-2xl bg-neutral-900 border border-white/5 flex items-center justify-center shadow-2xl shadow-emerald-900/20">
                  <Bot className="w-10 h-10 text-emerald-400" />
                </div>
                <h2 className="text-3xl font-bold mb-3 tracking-tight">How can I help you today?</h2>
                <p className="text-neutral-400 max-w-md text-sm leading-relaxed">
                  Test NVIDIA NIM models in real time. Switch models, set system prompts, and compare responses.
                </p>

                {/* System Prompt Indicator */}
                {systemPrompt && (
                  <div className="mt-4 px-4 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-400 max-w-md">
                    System prompt active: &quot;{systemPrompt.slice(0, 60)}...&quot;
                  </div>
                )}

                {/* Suggestion Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-8 w-full max-w-lg">
                  {[
                    { icon: '💡', text: 'Explain async/await in JavaScript' },
                    { icon: '🚀', text: 'Write a REST API in Python with FastAPI' },
                    { icon: '🔍', text: 'Compare React vs Vue vs Svelte' },
                    { icon: '🧠', text: 'Explain transformer architecture step by step' },
                  ].map((s) => (
                    <button
                      key={s.text}
                      onClick={() => setInput(s.text)}
                      className="text-left px-4 py-3 rounded-2xl bg-neutral-900/60 border border-white/5 text-sm text-neutral-300 hover:bg-neutral-800/80 hover:border-emerald-900/30 hover:text-neutral-100 transition-all group"
                    >
                      <span className="mr-2 group-hover:scale-110 inline-block transition-transform">{s.icon}</span>
                      {s.text}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                {messages.map((m) => (
                  <ChatMessage key={m.id} message={m} />
                ))}

                {/* Loading Indicator */}
                {isLoading && messages[messages.length - 1]?.content === '' && (
                  <div className="flex gap-4 mr-auto max-w-[85%] animate-fade-in">
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
          </div>
        </main>

        {/* Error Banner */}
        {error && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 max-w-lg w-full px-4 animate-fade-in">
            <div className="bg-red-950/90 backdrop-blur-xl border border-red-800/50 rounded-2xl px-5 py-4 shadow-2xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-red-200 font-medium">API Error</p>
                <p className="text-xs text-red-300/80 mt-1 break-all">{error}</p>
              </div>
              <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300 text-sm font-bold">✕</button>
            </div>
          </div>
        )}

        {/* Input */}
        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-neutral-950 via-neutral-950 to-transparent">
          <div className="max-w-4xl mx-auto">
            <ChatInput
              input={input}
              onInputChange={setInput}
              onSubmit={handleSubmit}
              onStop={handleStop}
              isLoading={isLoading}
              modelName={currentModelName}
            />
          </div>
        </div>
      </div>
      
      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-30 md:hidden animate-fade-in"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}
