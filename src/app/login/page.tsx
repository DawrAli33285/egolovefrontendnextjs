'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useApp } from '@/context/AppContext';
import Logo from '../../components/logo';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { BASE_URL } from '../../lib/base';

const TOAST_ID = 'login-toast';

export default function LoginPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { login } = useApp();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await axios.post(`${BASE_URL}/users/login`, form);
      login({ token: data.token, ...data.user });
      toast.success(data.message || 'Login successful!', { containerId: TOAST_ID });
      setTimeout(() => router.push(data.user.isPremium ? '/premium-quiz' : '/quiz'), 800);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Something went wrong.', { containerId: TOAST_ID });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-amber-50 flex items-center justify-center p-5">
      <ToastContainer containerId={TOAST_ID} autoClose={4000} newestOnTop theme="light" />
      <div className="bg-white rounded-3xl shadow-2xl shadow-purple-100 p-10 w-full max-w-md">
        <div className="flex justify-center mb-6"><Logo size={60} /></div>
        <h2 className="text-2xl font-black text-indigo-950 text-center mb-1">{t('login.title')}</h2>
        <p className="text-gray-500 text-sm text-center mb-8">{t('login.subtitle')}</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">{t('login.email')}</label>
            <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-100 transition"
              placeholder="you@example.com" required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">{t('login.password')}</label>
            <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-100 transition"
              placeholder="••••••••" required />
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-gradient-to-r from-violet-600 to-purple-700 text-white py-3.5 rounded-xl font-bold text-sm hover:brightness-110 hover:-translate-y-0.5 transition-all duration-200 shadow-lg shadow-purple-200 disabled:opacity-60">
            {loading ? 'Signing in…' : t('login.submit')}
          </button>
        </form>

        <div className="mt-6 text-center space-y-3">
          <p className="text-sm text-gray-500">
            {t('login.noAccount')}{' '}
            <Link href="/register" className="text-violet-600 font-semibold hover:underline">{t('login.register')}</Link>
          </p>
          <Link href="/" className="block text-xs text-gray-400 hover:text-gray-600 transition">← Back to home</Link>
        </div>
      </div>
    </div>
  );
}