'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminRegisterPage() {
  const router = useRouter();

  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [confirm, setConfirm]     = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/admin/auth/register', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, password, secretKey }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Registration failed');
        setLoading(false);
        return;
      }

      setSuccess(`Admin account created for ${data.email}. Redirecting to login…`);
      setTimeout(() => router.push('/admin/login'), 2000);

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
          <h1 className="text-lg font-black text-slate-100 mb-1">Register admin</h1>
          <p className="text-slate-600 text-xs mb-6 font-mono">Requires a valid registration key</p>

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
                autoComplete="new-password"
                placeholder="••••••••"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-700 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 transition font-mono"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Confirm password
              </label>
              <input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
                autoComplete="new-password"
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

            {success && (
              <div className="bg-emerald-950/50 border border-emerald-800/50 rounded-xl px-4 py-3 flex items-center gap-2">
                <span className="text-emerald-400 text-base">✓</span>
                <span className="text-xs text-emerald-300">{success}</span>
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
                  Registering…
                </>
              ) : 'Create account →'}
            </button>
          </form>
        </div>

        <p className="text-center text-[10px] text-slate-700 mt-6 font-mono">
          Already an admin?{' '}
          <a href="/admin/login" className="text-slate-600 hover:text-slate-400 transition">
            ← Sign in
          </a>
        </p>
      </div>
    </div>
  );
}