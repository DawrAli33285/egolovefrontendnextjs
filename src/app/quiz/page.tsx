'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { FREE_QUESTIONS, pillarPercents, globalPercents } from '@/data/questions';
import logo from '../../assets/logo.png';

const PILLAR_COLORS = [
  'bg-blue-100 text-blue-800',
  'bg-yellow-100 text-yellow-800',
  'bg-pink-100 text-pink-900',
  'bg-emerald-100 text-emerald-800',
  'bg-purple-100 text-purple-800',
  'bg-red-100 text-red-800',
  'bg-lime-100 text-lime-800',
  'bg-indigo-100 text-indigo-800',
  'bg-teal-100 text-teal-800',
];

const OPTION_LETTERS = ['A', 'B', 'C', 'D'];

const DEFAULT_SCORES = [
  { ego: 10, love: 0 },
  { ego: 0,  love: 10 },
  { ego: 7,  love: 3 },
  { ego: 3,  love: 7 },
];

interface NormalizedQuestion {
  pillar: number;
  text: string;
  options: string[];
  scores: { ego: number; love: number }[];
}

export default function FreeQuizPage() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const lang = i18n.language === 'es' ? 'es' : i18n.language === 'fr' ? 'fr' : 'en';

  const [questions, setQuestions] = useState<NormalizedQuestion[]>([]);
  const [loading, setLoading]     = useState(true);
  const [current, setCurrent]     = useState(0);
  const [answers, setAnswers]     = useState<Record<number, number>>({});

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/admin/quiz/import?quizType=free&langue=FR&lang=${lang}`);
        if (res.ok) {
          const data = await res.json();
          if (data.questions?.length > 0) {
            setQuestions(data.questions.map((q: any) => ({
              pillar:  q.pilier_id,
              text:    q.question,
              options: [q.reponse_a, q.reponse_b, q.reponse_c, q.reponse_d],
              scores:  DEFAULT_SCORES,
            })));
            setLoading(false);
            return;
          }
        }
      } catch {}
      // Fallback to static
      setQuestions(FREE_QUESTIONS.map(q => ({
        pillar:  q.pillar,
        text:    (q as any)[lang] || q.en,
        options: (q.options as any)[lang] || q.options.en,
        scores:  q.scores,
      })));
      setLoading(false);
    }
    load();
  }, [lang]);

  const q          = questions[current];
  const total      = questions.length;
  const progress   = total > 0 ? Math.round(((current + 1) / total) * 100) : 0;
  const pillarT    = q ? t(`pillars.${q.pillar}`, { returnObjects: true }) as any : {};
  const colorClass = q ? PILLAR_COLORS[(q.pillar - 1) % PILLAR_COLORS.length] : '';
  const isLast     = current === total - 1;

  const select  = (idx: number) => setAnswers(a => ({ ...a, [current]: idx }));
  const goPrev  = () => { if (current > 0) setCurrent(c => c - 1); };

  const goNext = () => {
    if (isLast) {
      const pillarData: Record<number, { ego: number; love: number; count: number }> = {};
      for (let i = 0; i < questions.length; i++) {
        const chosen = answers[i];
        if (chosen === undefined) continue;
        const score = questions[i].scores[chosen];
        const p     = questions[i].pillar;
        if (!pillarData[p]) pillarData[p] = { ego: 0, love: 0, count: 0 };
        pillarData[p].ego   += score.ego;
        pillarData[p].love  += score.love;
        pillarData[p].count += 1;
      }
      const percents = pillarPercents(pillarData);
      const global   = globalPercents(percents);
      sessionStorage.setItem('egoxlove_free_results', JSON.stringify({ pillarPercents: percents, global }));
      router.push('/results');
    } else {
      setCurrent(c => c + 1);
    }
  };

  if (loading || !q) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
      </div>
    );
  }

  // ---- YOUR EXACT RETURN STAYS 100% UNCHANGED BELOW ----
  return (
    <div className="min-h-screen bg-gray-50 pb-12">

      <div className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-xl mx-auto px-5 py-3">
        <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <Image src={logo} alt="EgoXLove" width={50} height={50} />
            </Link>
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                {lang === 'fr' ? 'Gratuit · Mesure ton propre niveau' : lang === 'es' ? 'Gratis · Mide tu nivel' : 'Free · Measure your level'}
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[11px] font-black text-yellow-600">EGO</span>
                <span className="text-[10px] text-gray-400">vs</span>
                <span className="text-[11px] font-black text-violet-600">LOVE</span>
              </div>
            </div>
            <div className="w-[50px]" />
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-gray-500 mb-1.5">
            <span className="font-semibold text-violet-700">{current + 1} / {total}</span>
            <span className={`px-2.5 py-1 rounded-full font-bold ${colorClass}`}>
              {pillarT.icon} {pillarT.name}
            </span>
            <span className="font-semibold">{progress}%</span>
          </div>
          <div className="relative h-1.5 bg-gray-200 rounded-full overflow-visible">
            <div
              className="h-full bg-gradient-to-r from-yellow-500 to-violet-600 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all duration-500"
              style={{ left: `${progress}%` }}
            >
              <div className="w-4 h-4 rounded-full bg-violet-600 border-2 border-white shadow flex items-center justify-center">
                <span className="text-white text-[7px] font-black">▶</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-5 pt-6">

        <div className="text-center mb-4">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${colorClass}`}>
            {pillarT.icon} {t('quiz.free')} · {pillarT.name}
          </span>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <p className="text-base font-semibold text-indigo-950 text-center leading-relaxed mb-6">
            {q.text}
          </p>

          <div className="flex flex-col gap-2.5">
            {q.options.map((opt: string, idx: number) => (
              <button
                key={idx}
                onClick={() => select(idx)}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 text-sm text-left transition-all duration-150 cursor-pointer
                  ${answers[current] === idx
                    ? 'border-violet-500 bg-violet-50 font-semibold'
                    : 'border-gray-200 hover:border-violet-200 hover:bg-violet-50/40'
                  }`}
              >
                <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors
                  ${answers[current] === idx ? 'bg-violet-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                  {OPTION_LETTERS[idx]}
                </span>
                <span className="text-gray-800 leading-snug">{opt}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3 mt-5 justify-center">
          <button
            onClick={goPrev}
            disabled={current === 0}
            className="px-6 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-200 transition disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {t('quiz.prev')}
          </button>
          <button
            onClick={goNext}
            disabled={answers[current] === undefined}
            className="px-8 py-2.5 bg-gradient-to-r from-violet-600 to-purple-700 text-white rounded-xl text-sm font-bold hover:brightness-110 transition disabled:opacity-40 disabled:cursor-not-allowed min-w-[140px] text-center"
          >
            {isLast ? t('quiz.finish') : t('quiz.next')}
          </button>
        </div>
      </div>
    </div>
  );
}