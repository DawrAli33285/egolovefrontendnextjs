'use client';

import { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) router.replace('/login');
  }, [router]);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (!token) return null;

  return <>{children}</>;
}