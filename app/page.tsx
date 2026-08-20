'use client';

import { useState, useRef, useEffect, useCallback, FormEvent } from 'react';
import { Bot, Loader2, AlertCircle } from 'lucide-react';
import ChatHeader, { ModelOption } from './components/chat-header';
import ChatInput from './components/chat-input';
import ChatMessage, { MessageData } from './components/chat-message';
import ApiKeyScreen from './components/api-key-screen';
import SystemPromptModal from './components/system-prompt-modal';

const AVAILABLE_MODELS: ModelOption[] = [
  { id: 'meta/llama-3.1-8b-instruct', name: 'Llama 3.1 8B', tag: 'Fast' },
  { id: 'meta/llama-3.1-70b-instruct', name: 'Llama 3.1 70B', tag: 'Balanced' },
  { id: 'meta/llama-3.3-70b-instruct', name: 'Llama 3.3 70B', tag: 'Advanced' },
  { id: 'meta/llama-3.1-405b-instruct', name: 'Llama 3.1 405B', tag: 'Flagship' },
  { id: 'nvidia/llama-3.1-nemotron-70b-instruct', name: 'Nemotron 70B', tag: 'NVIDIA' },
  { id: 'mistralai/mixtral-8x22b-instruct-v0.1', name: 'Mixtral 8x22B', tag: 'Mistral' },
  { id: 'deepseek-ai/deepseek-r1', name: 'DeepSeek R1', tag: 'Reasoning' },
  { id: 'deepseek-ai/deepseek-v3', name: 'DeepSeek V3', tag: 'Massive' },
  { id: 'google/gemma-2-27b-it', name: 'Gemma 2 27B', tag: 'Google' },
  { id: 'microsoft/phi-3-medium-128k-instruct', name: 'Phi 3 Medium', tag: 'Microsoft' },
];

export default function ChatApp() {
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [selectedModel, setSelectedModel] = useState(AVAILABLE_MODELS[1].id); // Default to 70B
  const [systemPrompt, setSystemPrompt] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Load persisted state
  useEffect(() => {
    const savedKey = localStorage.getItem('nvidia_api_key');
    if (savedKey) setApiKey(savedKey);
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

  function handleSaveKey(key: string) {
    setApiKey(key);
    localStorage.setItem('nvidia_api_key', key);
  }

  function handleLogout() {
    setApiKey('');
    setMessages([]);
    localStorage.removeItem('nvidia_api_key');
  }

  function handleNewChat() {
    if (isLoading) handleStop();
    setMessages([]);
    setError(null);
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
          apiKey,
          model: selectedModel,
          systemPrompt: systemPrompt || undefined,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(errorData.error || `HTTP ${res.status}`);
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

  // ──── API Key Gate ────
  if (!apiKey) {
    return <ApiKeyScreen onSaveKey={handleSaveKey} />;
  }

  const currentModelName = AVAILABLE_MODELS.find((m) => m.id === selectedModel)?.name || 'AI';

  // ──── Chat App ────
  return (
    <div className="flex flex-col min-h-screen bg-neutral-950 text-neutral-50 font-sans">

      <ChatHeader
        selectedModel={selectedModel}
        models={AVAILABLE_MODELS}
        onModelChange={handleModelChange}
        onNewChat={handleNewChat}
        onLogout={handleLogout}
        onOpenSettings={() => setShowSettings(true)}
      />

      {/* System Prompt Modal */}
      <SystemPromptModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onSave={handleSystemPromptSave}
        currentPrompt={systemPrompt}
      />

      {/* Main Chat Area */}
      <main className="flex-1 w-full max-w-4xl mx-auto p-4 flex flex-col pt-6 pb-44">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center animate-fade-in">
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
      </main>

      {/* Error Banner */}
      {error && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 max-w-lg w-full px-4 animate-fade-in">
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
      <ChatInput
        input={input}
        onInputChange={setInput}
        onSubmit={handleSubmit}
        onStop={handleStop}
        isLoading={isLoading}
        modelName={currentModelName}
      />
    </div>
  );
}
