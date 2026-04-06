'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import { useApp } from '@/context/AppContext';
import logo from '../assets/logo.png'

const PILLAR_PILLS = ['🧭 Alignment','🎭 Authenticity','❤️ Heart vs Ego','🤝 Union','🧘 Consciousness','🎁 Generosity','🙏 Gratitude','🦉 Wisdom','☮️ Peace'];

export default function HomePage() {
  const { t, i18n } = useTranslation();
  const { user } = useApp();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1E1B4B] via-[#312E81] to-[#5B21B6] text-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[60%] h-[120%] bg-[radial-gradient(ellipse,rgba(184,134,11,0.07),transparent_70%)] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[40%] h-[80%] bg-[radial-gradient(ellipse,rgba(124,58,237,0.1),transparent_70%)] pointer-events-none" />

      <div className="max-w-xl mx-auto px-5 relative z-10">
        <nav className="flex justify-between items-center py-5">
          <Image src={logo} alt="EgoXLove" width={50} height={50} />
          <div className="flex items-center gap-2">
          <button
              onClick={() => {
                const langs = ['en', 'es', 'fr'];
                const currentIndex = langs.indexOf(i18n.language);
                const nextLang = langs[(currentIndex + 1) % langs.length];
                i18n.changeLanguage(nextLang);
              }}
              className="bg-white/10 border border-white/20 text-white px-3 py-1.5 rounded-full text-xs font-semibold hover:bg-white/20 transition"
            >
              {i18n.language === 'en' ? 'ES' : i18n.language === 'es' ? 'FR' : 'EN'}
            </button>
            {user
              ? <Link href="/profile" className="bg-white/10 border border-white/20 text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-white/20 transition">{t('nav.profile')}</Link>
              : <Link href="/login" className="bg-white/10 border border-white/20 text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-white/20 transition">{t('nav.login')}</Link>
            }
          </div>
        </nav>

        <div className="text-center pt-8 pb-6">
          <div className="flex justify-center mb-5">
          <Image src={logo} alt="EgoXLove" width={300} height={300} className="md:w-[300px] w-[50%]" />
          </div>
          <div className="inline-flex items-center gap-1.5 bg-white/8 border border-white/15 px-4 py-1.5 rounded-full text-xs mb-4">
            {t('home.badge')}
          </div>
          <h1 className="text-4xl md:text-5xl font-black leading-tight mb-4 tracking-tight">
            {t('home.headline')}<br />
            <span className="text-[#D4A845]">EGO</span>
            <span className="text-white/60 mx-2">↔</span>
            <span className="text-[#C4B5FD]">LOVE</span>
          </h1>
          <p className="text-lg opacity-85 max-w-md mx-auto mb-8 leading-relaxed">{t('home.subline')}</p>

          <Link
            href={user ? (user.isPremium ? '/premium-quiz' : '/quiz') : '/login'}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-white to-purple-50 text-[#1E1B4B] px-10 py-4 rounded-full text-base font-bold shadow-2xl hover:-translate-y-1 hover:shadow-purple-900/40 transition-all duration-200"
          >
            {t('home.cta')}
          </Link>
          <p className="text-xs opacity-50 mt-3">{t('home.sub')}</p>
        </div>

        <div className="flex flex-wrap justify-center gap-2 py-4">
          {PILLAR_PILLS.map(p => (
            <span key={p} className="bg-white/7 border border-white/10 px-3 py-1.5 rounded-full text-[11px] whitespace-nowrap">{p}</span>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-3 pb-10 max-w-xs mx-auto mt-2">
          {[
            { val: '9', label: t('home.stats.pillars') },
            { val: '45', label: t('home.stats.questions') },
            { val: '4', label: t('home.stats.avatars') },
          ].map(s => (
            <div key={s.label} className="text-center py-4 bg-white/6 rounded-xl border border-white/8">
              <b className="block text-3xl font-black">{s.val}</b>
              <small className="text-[10px] opacity-60">{s.label}</small>
            </div>
          ))}
        </div>

        <div className="text-center pb-12">
          <p className="text-sm opacity-60 mb-2">Don't have an account?</p>
          <Link href="/register" className="text-[#C4B5FD] font-semibold text-sm underline underline-offset-2">
            {t('nav.register')}
          </Link>
        </div>
      </div>
    </div>
  );
}