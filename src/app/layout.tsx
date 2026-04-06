import type { Metadata } from 'next';
import './globals.css';
import { AppProvider } from '@/context/AppContext';
import StripeProvider from '@/components/StripeProvider';
import I18nProvider from '@/components/I18nProvider';

export const metadata: Metadata = {
  title: 'EgoXLove',
  description: 'Discover your EGO ↔ LOVE spectrum',
  icons: { icon: '/favicon.svg' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <I18nProvider>
          <AppProvider>
            <StripeProvider>
              {children}
            </StripeProvider>
          </AppProvider>
        </I18nProvider>
      </body>
    </html>
  );
}