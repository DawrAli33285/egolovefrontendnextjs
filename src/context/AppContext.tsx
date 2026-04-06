'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { BASE_URL } from '../lib/base';

export interface User {
  token: string;
  email: string;
  full_name?: string;
  name?: string;
  isPremium?: boolean;
  avatar?: string;
  avatarUrl?: string;
  age?: number;
  role?: string;
}

export interface PillarPercent {
  ego: number;
  love: number;
}

export interface QuizResults {
  global: { ego: number; love: number };
  pillarPercents: Record<number, PillarPercent>;
}

interface AppContextType {
  user: User | null;
  subscribed: boolean;
  plan: string | null;
  freeResults: QuizResults | null;
  premiumResults: QuizResults | null;
  login: (userData: User) => void;
  logout: () => void;
  register: (userData: User) => void;
  subscribe: (planId: string) => void;
  setFreeResults: (r: QuizResults | null) => void;
  setPremiumResults: (r: QuizResults | null) => void;
  setUser: (u: User) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });

  const [subscribed, setSubscribed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const stored = localStorage.getItem('user');
    if (!stored) return false;
    try { return JSON.parse(stored)?.isPremium || false; } catch { return false; }
  });

  const [plan, setPlan] = useState<string | null>(null);
  const [freeResults, setFreeResults] = useState<QuizResults | null>(null);
  const [premiumResults, setPremiumResults] = useState<QuizResults | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    axios.get(`${BASE_URL}/users/getUser`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(({ data }) => {
      const freshUser = { ...data.user, token };
      setUser(freshUser);
      setSubscribed(freshUser.isPremium || false);
      localStorage.setItem('user', JSON.stringify(freshUser));
    }).catch((err) => {
      console.log('getUser failed:', err.response?.status, err.message);
    });
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    if (userData.token) localStorage.setItem('token', userData.token);
  };

  const logout = () => {
    setUser(null);
    setSubscribed(false);
    setPlan(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const register = (userData: User) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    if (userData.token) localStorage.setItem('token', userData.token);
  };

  const subscribe = (planId: string) => { setSubscribed(true); setPlan(planId); };

  return (
    <AppContext.Provider value={{
      user, subscribed, plan,
      freeResults, premiumResults,
      login, logout, register, subscribe,
      setFreeResults, setPremiumResults,
      setUser,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}