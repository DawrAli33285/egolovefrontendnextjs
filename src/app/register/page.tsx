
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useApp } from '@/context/AppContext';
import Logo from '@/components/logo';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { BASE_URL } from '../../lib/base';

const TOAST_ID = 'register-toast';

export default function RegisterPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { register } = useApp();
  const [form, setForm] = useState({ full_name: '', email: '', password: '', age: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await axios.post(`${BASE_URL}/users/register`, form);
      register({ full_name: data.user.name, email: data.user.email, token: data.token });
      toast.success(data.message || 'Account created!', { containerId: TOAST_ID });
      setTimeout(() => router.push('/quiz'), 800);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Something went wrong.', { containerId: TOAST_ID });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-amber-50 flex items-center justify-center p-5">
      <ToastContainer containerId={TOAST_ID} autoClose={4000} newestOnTop theme="light" />
      <div className="bg-white rounded-3xl shadow-2xl shadow-purple-100 p-10 w-full max-w-md">
        <div className="flex justify-center mb-6"><Logo size={60} /></div>
        <h2 className="text-2xl font-black text-indigo-950 text-center mb-1">{t('register.title')}</h2>
        <p className="text-gray-500 text-sm text-center mb-8">{t('register.subtitle')}</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {[
            { key: 'full_name', label: t('register.name'), type: 'text', placeholder: 'Sophie Martin' },
            { key: 'email', label: t('register.email'), type: 'email', placeholder: 'you@example.com' },
            { key: 'password', label: t('register.password'), type: 'password', placeholder: '••••••••' },
          ].map(({ key, label, type, placeholder }) => (
            <div key={key}>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">{label}</label>
              <input type={type} value={(form as any)[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-100 transition"
                placeholder={placeholder} required />
            </div>
          ))}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Age</label>
            <input type="number" value={form.age} onChange={e => setForm(f => ({ ...f, age: e.target.value }))}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-100 transition"
              placeholder="25" min="13" max="120" required />
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-gradient-to-r from-violet-600 to-purple-700 text-white py-3.5 rounded-xl font-bold text-sm hover:brightness-110 hover:-translate-y-0.5 transition-all duration-200 shadow-lg shadow-purple-200 disabled:opacity-60">
            {loading ? 'Creating account…' : t('register.submit')}
          </button>
        </form>

        <div className="mt-5 text-center space-y-3">
          <p className="text-sm text-gray-500">
            {t('register.haveAccount')}{' '}
            <Link href="/login" className="text-violet-600 font-semibold hover:underline">{t('register.login')}</Link>
          </p>
          <Link href="/" className="block text-xs text-gray-400 hover:text-gray-600 transition">← Back to home</Link>
        </div>
      </div>
    </div>
  );
}