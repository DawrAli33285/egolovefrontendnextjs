'use client';

import { ReactNode, useState, useEffect } from 'react';
import i18n from '@/i18n';

export default function I18nProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(i18n.isInitialized);

  useEffect(() => {
    if (i18n.isInitialized) {
      setReady(true);
      return;
    }
    i18n.on('initialized', () => setReady(true));
    return () => { i18n.off('initialized', () => setReady(true)); };
  }, []);

  if (!ready) return null;

  return <>{children}</>;
}