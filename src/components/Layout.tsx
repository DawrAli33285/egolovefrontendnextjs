'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useApp } from '@/context/AppContext';
import Image from 'next/image';
import { ReactNode } from 'react';
import logo from '../assets/logo.png'
const STANDALONE = ['/', '/login', '/register'];
const HIDE_HEADER = ['/quiz', '/premium-quiz'];

export default function Layout({ children }: { children: ReactNode }) {
  const { t, i18n } = useTranslation();
  const { user, subscribed, logout } = useApp();
  const router = useRouter();
  const pathname = usePathname();

  const isStandalone = STANDALONE.includes(pathname);
  const hideHeader = HIDE_HEADER.includes(pathname);

  return (
    <div className="min-h-screen bg-[#F9FAFB] font-sans">
      {!isStandalone && !hideHeader && (
        <header className="bg-white border-b border-gray-200 sticky top-0 z-[200] shadow-sm">
          <div className="max-w-2xl mx-auto px-5 h-14 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 shrink-0">
            <Image src={logo} alt="EgoXLove" width={50} height={50} />
            </Link>
            <div className="flex items-center gap-2">
              {subscribed ? (
                <Link href="/premium-quiz" className="hidden sm:flex items-center gap-1 bg-gradient-to-r from-yellow-500 to-yellow-700 text-white text-[10px] font-black px-3 py-1.5 rounded-full hover:brightness-110 transition shadow-sm">
                  ⭐ Premium Quiz
                </Link>
              ) : (
                <Link href="/subscription" className="hidden sm:flex items-center gap-1 border border-yellow-400 text-yellow-700 text-[10px] font-bold px-3 py-1.5 rounded-full hover:bg-yellow-50 transition">
                  ⭐ Go Premium
                </Link>
              )}
              <button
                onClick={() => i18n.changeLanguage(i18n.language === 'en' ? 'es' : 'en')}
                className="text-[11px] font-bold text-gray-500 border border-gray-200 px-2.5 py-1 rounded-full hover:border-violet-300 hover:text-violet-700 transition"
              >
                {i18n.language === 'en' ? 'ES' : 'EN'}
              </button>
              {user ? (
                <>
                  <Link href="/profile" title="My Profile" className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center hover:scale-110 transition-transform shadow-sm select-none">
                    {user.avatar
                      ? <img src={user.avatar} alt="avatar" className="w-full h-full object-cover rounded-full" />
                      : <span className="text-white text-xs font-bold">{user.name?.slice(0, 2).toUpperCase()}</span>
                    }
                  </Link>
                  <button
                    onClick={() => { logout(); router.push('/'); }}
                    className="hidden sm:block text-xs text-gray-400 hover:text-gray-700 transition font-medium"
                  >
                    {t('nav.logout')}
                  </button>
                </>
              ) : (
                <Link href="/login" className="bg-gradient-to-r from-violet-600 to-purple-700 text-white px-4 py-1.5 rounded-full text-xs font-bold hover:brightness-110 transition shadow-sm">
                  {t('nav.login')}
                </Link>
              )}
            </div>
          </div>
        </header>
      )}
      {children}
    </div>
  );
}