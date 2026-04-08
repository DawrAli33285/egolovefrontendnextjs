'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function AdminLoginPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const from         = searchParams.get('from') || '/admin/quiz';

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/auth/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Login failed');
        setLoading(false);
        return;
      }

      // Force a hard navigation to ensure middleware sees the cookie
      window.location.href = from;
    } catch {
      setError('Network error — please try again');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080c14] flex items-center justify-center p-5">
      <div className="w-full max-w-sm">

        {/* Logo mark */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-base font-black text-white shadow-lg shadow-violet-900/50">
            A
          </div>
          <div>
            <div className="text-sm font-black text-slate-100 tracking-tight">Quiz Admin</div>
            <div className="text-[10px] text-slate-600 font-mono">EgoXLove · Restricted</div>
          </div>
        </div>

        {/* Card */}
        <div className="bg-[#0d1220] border border-slate-800 rounded-2xl p-8 shadow-2xl">
          <h1 className="text-lg font-black text-slate-100 mb-1">Sign in</h1>
          <p className="text-slate-600 text-xs mb-6 font-mono">Admin access only</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="admin@egoxlove.com"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-700 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 transition font-mono"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-700 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 transition font-mono"
              />
            </div>

            {error && (
              <div className="bg-red-950/50 border border-red-800/50 rounded-xl px-4 py-3 flex items-center gap-2">
                <span className="text-red-400 text-base">⚠</span>
                <span className="text-xs text-red-300">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-violet-600 hover:bg-violet-500 text-white font-black text-sm py-3 rounded-xl transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed mt-2 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in…
                </>
              ) : 'Sign in →'}
            </button>
          </form>
        </div>

        <p className="text-center text-[10px] text-slate-700 mt-6 font-mono">
          Not an admin? <a href="/" className="text-slate-600 hover:text-slate-400 transition">← Back to site</a>
        </p>

        <div className="mt-4 text-center">
        <button
  type="button"
  onClick={() => window.location.href = '/admin/register'}
  className="text-[10px] text-slate-600 hover:text-slate-400 transition"
>
  Register new admin →
</button>
        </div>
      </div>
    </div>
  );
}