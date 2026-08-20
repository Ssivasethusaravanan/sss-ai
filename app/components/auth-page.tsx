'use client';

import { Sparkles, Mail, Lock, User, Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react';
import { useState, FormEvent } from 'react';

interface AuthUser {
  id: number;
  username: string;
  email: string;
}

interface AuthPageProps {
  onAuthSuccess: (user: AuthUser) => void;
}

export default function AuthPage({ onAuthSuccess }: AuthPageProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const body =
        mode === 'login'
          ? { email, password }
          : { username, email, password };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong');
        return;
      }

      onAuthSuccess(data.user);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  function switchMode() {
    setMode(mode === 'login' ? 'register' : 'login');
    setError('');
    setUsername('');
    setEmail('');
    setPassword('');
  }

  const isFormValid =
    mode === 'login'
      ? email.trim() && password.trim()
      : username.trim() && email.trim() && password.trim();

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
            {mode === 'login'
              ? 'Sign in to continue chatting'
              : 'Create your account to get started'}
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-neutral-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
          {/* Mode Toggle */}
          <div className="flex bg-neutral-800/80 rounded-xl p-1 mb-6">
            <button
              onClick={() => mode !== 'login' && switchMode()}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                mode === 'login'
                  ? 'bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 text-emerald-400 border border-emerald-500/30 shadow-lg'
                  : 'text-neutral-400 hover:text-neutral-300'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => mode !== 'register' && switchMode()}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                mode === 'register'
                  ? 'bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 text-emerald-400 border border-emerald-500/30 shadow-lg'
                  : 'text-neutral-400 hover:text-neutral-300'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-red-950/60 border border-red-800/40 text-sm text-red-300 animate-fade-in">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username (Register only) */}
            {mode === 'register' && (
              <div className="relative animate-fade-in">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username"
                  autoComplete="username"
                  className="w-full bg-neutral-800/80 border border-neutral-700/50 rounded-xl pl-11 pr-4 py-3.5 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                />
              </div>
            )}

            {/* Email */}
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                autoComplete="email"
                autoFocus
                className="w-full bg-neutral-800/80 border border-neutral-700/50 rounded-xl pl-11 pr-4 py-3.5 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
              />
            </div>

            {/* Password */}
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                className="w-full bg-neutral-800/80 border border-neutral-700/50 rounded-xl pl-11 pr-12 py-3.5 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={!isFormValid || isLoading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-neutral-950 font-semibold text-sm hover:from-emerald-400 hover:to-cyan-400 disabled:from-neutral-700 disabled:to-neutral-700 disabled:text-neutral-500 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {mode === 'login' ? 'Signing in...' : 'Creating account...'}
                </>
              ) : (
                <>
                  {mode === 'login' ? 'Sign In' : 'Create Account'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 mt-6">
            <div className="flex-1 h-px bg-white/5" />
            <span className="text-[11px] text-neutral-600 uppercase tracking-wider">
              {mode === 'login' ? 'New here?' : 'Already have an account?'}
            </span>
            <div className="flex-1 h-px bg-white/5" />
          </div>

          <button
            onClick={switchMode}
            className="w-full mt-4 py-3 rounded-xl border border-neutral-700/50 text-sm text-neutral-400 hover:text-emerald-400 hover:border-emerald-800/50 hover:bg-emerald-950/20 transition-all"
          >
            {mode === 'login' ? 'Create an account' : 'Sign in instead'}
          </button>
        </div>

        {/* Features */}
        <div className="flex items-center justify-center gap-6 mt-6">
          {['🦙 Llama 3.1', '🟢 Nemotron', '⚡ Streaming', '🔒 Secure'].map(
            (item) => (
              <span key={item} className="text-[11px] text-neutral-600">
                {item}
              </span>
            )
          )}
        </div>
      </div>
    </div>
  );
}
