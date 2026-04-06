'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { PREMIUM_QUESTIONS } from '@/data/questions';
import { PILLARS } from '@/data/pillars';
import logo from '../../assets/logo.png'

const LIKERT = [
  { value: 0,   labelEn: 'Not at all',   labelEs: 'Para nada',       labelFr: 'Pas du tout',       emoji: '😶' },
  { value: 2.5, labelEn: 'A little',     labelEs: 'Un poco',         labelFr: 'Un peu',             emoji: '🤏' },
  { value: 5,   labelEn: 'Moderately',   labelEs: 'Moderadamente',   labelFr: 'Modérément',         emoji: '🙂' },
  { value: 7.5, labelEn: 'A lot',        labelEs: 'Bastante',        labelFr: 'Beaucoup',           emoji: '😊' },
  { value: 10,  labelEn: 'Totally',      labelEs: 'Totalmente',      labelFr: 'Totalement',         emoji: '🔥' },
];

const SECTION_LABEL: Record<string, { en: string; es: string; fr: string; icon: string }> = {
  '---': { en: 'Core',               es: 'Esencial',            fr: 'Essentiel',           icon: '⭐' },
  A:    { en: 'Origins',             es: 'Orígenes',            fr: 'Origines',            icon: '🌱' },
  B:    { en: 'Reactions',           es: 'Reacciones',          fr: 'Réactions',           icon: '⚡' },
  C:    { en: 'Capacity to Change',  es: 'Capacidad de Cambio', fr: 'Capacité de Changement', icon: '🔄' },
  D:    { en: 'Life Impacts',        es: 'Impactos',            fr: 'Impacts',             icon: '🌍' },
};

const PILLAR_COLORS = [
  { ring: 'ring-blue-400',    bg: 'bg-blue-500',    light: 'bg-blue-50',    text: 'text-blue-700',    bar: 'from-blue-400 to-blue-600' },
  { ring: 'ring-amber-400',   bg: 'bg-amber-500',   light: 'bg-amber-50',   text: 'text-amber-700',   bar: 'from-amber-400 to-amber-600' },
  { ring: 'ring-rose-400',    bg: 'bg-rose-500',    light: 'bg-rose-50',    text: 'text-rose-700',    bar: 'from-rose-400 to-rose-600' },
  { ring: 'ring-emerald-400', bg: 'bg-emerald-500', light: 'bg-emerald-50', text: 'text-emerald-700', bar: 'from-emerald-400 to-emerald-600' },
  { ring: 'ring-purple-400',  bg: 'bg-purple-500',  light: 'bg-purple-50',  text: 'text-purple-700',  bar: 'from-purple-400 to-purple-600' },
  { ring: 'ring-red-400',     bg: 'bg-red-500',     light: 'bg-red-50',     text: 'text-red-700',     bar: 'from-red-400 to-red-600' },
  { ring: 'ring-lime-400',    bg: 'bg-lime-500',    light: 'bg-lime-50',    text: 'text-lime-700',    bar: 'from-lime-400 to-lime-600' },
  { ring: 'ring-indigo-400',  bg: 'bg-indigo-500',  light: 'bg-indigo-50',  text: 'text-indigo-700',  bar: 'from-indigo-400 to-indigo-600' },
  { ring: 'ring-teal-400',    bg: 'bg-teal-500',    light: 'bg-teal-50',    text: 'text-teal-700',    bar: 'from-teal-400 to-teal-600' },
];

function computePremiumResults(answers: Record<number, number>, questions: any[]) {
  const pillarData: Record<number, { ego: number; love: number; count: number }> = {};

  questions.forEach((q: any, i: number) => {
    const answerIndex = answers[i];
    if (answerIndex === undefined) return;

    const likertValue = LIKERT[answerIndex].value;
    let egopts: number, lovepts: number;

    if (q.type === 'EGO') {
      egopts  = likertValue;
      lovepts = 10 - likertValue;
    } else {
      lovepts = likertValue;
      egopts  = 10 - likertValue;
    }

    if (!pillarData[q.pillar]) pillarData[q.pillar] = { ego: 0, love: 0, count: 0 };
    pillarData[q.pillar].ego  += egopts;
    pillarData[q.pillar].love += lovepts;
    pillarData[q.pillar].count++;
  });

  const pillarPercents: Record<number, { ego: number; love: number }> = {};
  for (const [pid, d] of Object.entries(pillarData)) {
    const max = d.count * 10;
    pillarPercents[Number(pid)] = {
      ego:  max > 0 ? Math.round((d.ego  / max) * 100) : 50,
      love: max > 0 ? Math.round((d.love / max) * 100) : 50,
    };
  }

  let wEgo = 0, wLove = 0, wTotal = 0;
  for (const p of PILLARS) {
    const pp = pillarPercents[p.id];
    if (!pp) continue;
    wEgo   += pp.ego  * p.weight;
    wLove  += pp.love * p.weight;
    wTotal += p.weight;
  }

  const global = wTotal > 0
    ? { ego: Math.round(wEgo / wTotal), love: Math.round(wLove / wTotal) }
    : { ego: 50, love: 50 };

  return { pillarPercents, global };
}

function PillarDots({ current, total, answers }: { current: number; total: number; answers: Record<number, number> }) {
  const perPillar = Math.ceil(total / 9);
  return (
    <div className="flex gap-0.5 w-full">
      {PILLARS.map((p, i) => {
        const start = i * perPillar;
        const end   = Math.min(start + perPillar, total);
        const answered = Array.from({ length: end - start }, (_, k) => answers[start + k]).filter(v => v !== undefined).length;
        const pct = (answered / (end - start)) * 100;
        const active = current >= start && current < end;
        const done   = current >= end;
        const col = PILLAR_COLORS[i];
        return (
          <div key={p.id} className="flex-1 h-1.5 rounded-full bg-gray-200 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r ${col.bar} ${active ? 'opacity-100' : done ? 'opacity-80' : 'opacity-30'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        );
      })}
    </div>
  );
}

export default function PremiumQuizPage() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const lang = i18n.language === 'es' ? 'es' : i18n.language === 'fr' ? 'fr' : 'en';

  const [questions, setQuestions] = useState<any[]>(PREMIUM_QUESTIONS);
  const [loading,   setLoading]   = useState(true);
  const [current,   setCurrent]   = useState(0);
  const [answers,   setAnswers]   = useState<Record<number, number>>({});
  const [sliding,   setSliding]   = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Fetch from DB, fallback to static
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/admin/quiz/import?quizType=premium&langue=FR&lang=${lang}`);
        if (res.ok) {
          const data = await res.json();
          if (data.questions?.length > 0) {
            setQuestions(data.questions.map((q: any) => ({
              pillar:  q.pilier_id,
              section: q.correspondance_label || '---',
              type:    q.type || 'EGO',
              en:      q.question,
              es:      q.question,
              fr:      q.question,
            })));
            setLoading(false);
            return;
          }
        }
      } catch {}
      // Fallback to static
      setQuestions(PREMIUM_QUESTIONS);
      setLoading(false);
    }
    load();
  }, [lang]);

  const total      = questions.length;
  const perPillar  = Math.ceil(total / 9);

  const q        = questions[current] as any;
  const col      = PILLAR_COLORS[(q?.pillar ?? 1) - 1] ?? PILLAR_COLORS[0];
  const pillarT  = t(`pillars.${q?.pillar}`, { returnObjects: true }) as any;
  const sec      = SECTION_LABEL[q?.section] ?? SECTION_LABEL['---'];
  const isLast   = current === total - 1;
  const progress = Math.round(((current + 1) / total) * 100);
  const withinPillar = (current % perPillar) + 1;

  const handleSelect = (likertIndex: number) => {
    setAnswers(prev => ({ ...prev, [current]: likertIndex }));
  };

  const goNext = () => {
    if (isLast) { finishQuiz(); return; }
    setSliding('left');
    setTimeout(() => {
      setCurrent(c => c + 1);
      setSliding(null);
    }, 180);
  };

  const goPrev = () => {
    if (current === 0) return;
    setSliding('right');
    setTimeout(() => {
      setCurrent(c => c - 1);
      setSliding(null);
    }, 180);
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' && answers[current] !== undefined) goNext();
      if (e.key === 'ArrowLeft'  && current > 0) goPrev();
      const num = parseInt(e.key);
      if (num >= 1 && num <= 5) handleSelect(num - 1);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [current, answers]);

  const finishQuiz = () => {
    const results = computePremiumResults(answers, questions);
    sessionStorage.setItem('egoxlove_premium_results', JSON.stringify(results));
    router.push('/premium-report');
  };

  const selectedIndex  = answers[current];
  const answeredCount  = Object.keys(answers).length;

  const questionText = lang === 'es' ? q?.es : lang === 'fr' ? q?.fr : q?.en;
  const typeLabel    = q?.type === 'EGO'
    ? (lang === 'es' ? 'Afirmación EGO' : lang === 'fr' ? 'Affirmation EGO' : 'EGO Statement')
    : (lang === 'es' ? 'Afirmación LOVE' : lang === 'fr' ? 'Affirmation LOVE' : 'LOVE Statement');
  const typeBadgeClass = q?.type === 'EGO'
    ? 'bg-yellow-100 text-yellow-700 border border-yellow-200'
    : 'bg-violet-100 text-violet-700 border border-violet-200';

  if (loading || !q) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      <div className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-xl mx-auto px-4 py-3 space-y-2">

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Link href="/" className="shrink-0">
                <Image src={logo} alt="EgoXLove" width={50} height={50} />
              </Link>
              <span className="border border-yellow-500 text-yellow-700 text-[9px] font-black px-2 py-0.5 rounded-full tracking-wider">
                ⭐ PREMIUM
              </span>
            </div>
            <div className="text-right">
              <div className="text-xs font-bold text-gray-700">
                {current + 1} <span className="text-gray-400 font-normal">/ {total}</span>
              </div>
              <div className="text-[10px] text-gray-400">{answeredCount} answered</div>
              {process.env.NODE_ENV === 'development' && (
                <button
                  onClick={() => {
                    const all: Record<number, number> = {};
                    for (let i = 0; i < total; i++) all[i] = 0;
                    setAnswers(all);
                  }}
                  className="text-[9px] bg-red-100 text-red-600 px-2 py-0.5 rounded font-bold"
                >
                  DEV: Fill All
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
            <span className="font-semibold text-violet-700">{current + 1} / {total}</span>
            <span className={`px-2 py-0.5 rounded-full font-semibold text-white bg-gradient-to-r ${col.bar}`}>
              {pillarT.icon} {pillarT.name}
            </span>
            <span className="font-semibold">{progress}%</span>
          </div>
          <div className="relative h-1.5 bg-gray-100 rounded-full overflow-visible">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${col.bar} transition-all duration-500`}
              style={{ width: `${progress}%` }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all duration-500"
              style={{ left: `${progress}%` }}
            >
              <div className={`w-4 h-4 rounded-full bg-gradient-to-r ${col.bar} border-2 border-white shadow flex items-center justify-center`}>
                <span className="text-white text-[7px] font-black">▶</span>
              </div>
            </div>
          </div>

          <PillarDots current={current} total={total} answers={answers} />
        </div>
      </div>

      <div className="flex-1 max-w-xl mx-auto w-full px-4 py-5 flex flex-col gap-4">

        <div className="flex items-center justify-center gap-2 flex-wrap">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-white bg-gradient-to-r ${col.bar} shadow-sm`}>
            {pillarT.icon} {pillarT.name}
          </span>
          <span className="text-xs text-gray-500 border border-gray-200 bg-white px-2.5 py-1 rounded-full font-semibold">
            {sec.icon} {sec[lang as keyof typeof sec] ?? sec.en}
          </span>
          <span className="text-[10px] text-gray-400 font-medium">
            {withinPillar} / {perPillar}
          </span>
        </div>

        <div
          ref={cardRef}
          className={`bg-white rounded-2xl p-6 shadow-sm border border-gray-100 transition-all duration-180
            ${sliding === 'left'  ? 'opacity-0 -translate-x-3' :
              sliding === 'right' ? 'opacity-0  translate-x-3' : 'opacity-100 translate-x-0'}`}
          style={{ transition: 'opacity 0.18s ease, transform 0.18s ease' }}
        >

          <div className="flex justify-center mb-4">
            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${typeBadgeClass}`}>
              {q.type === 'EGO' ? '🟡' : '💜'} {typeLabel}
            </span>
          </div>

          <p className="text-[15px] font-semibold text-indigo-950 text-center leading-relaxed mb-6">
            {questionText}
          </p>

          <div className="space-y-2">
            {LIKERT.map((opt, idx) => {
              const isSelected = selectedIndex === idx;
              const optLabel = lang === 'es' ? opt.labelEs : lang === 'fr' ? opt.labelFr : opt.labelEn;
              return (
                <button
                  key={idx}
                  onClick={() => handleSelect(idx)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-sm text-left
                    transition-all duration-150 group
                    ${isSelected
                      ? `border-current ${col.ring} ring-2 ${col.light}`
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                >
                  <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 transition-all flex items-center justify-center
                    ${isSelected ? `border-current ${col.bg}` : 'border-gray-300'}`}>
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>

                  <span className="text-base leading-none">{opt.emoji}</span>

                  <span className={`flex-1 font-medium ${isSelected ? col.text : 'text-gray-700'}`}>
                    {optLabel}
                  </span>

                  <div className="flex gap-1 flex-shrink-0">
                    {[0, 1, 2, 3, 4].map(v => (
                      <div
                        key={v}
                        className={`w-2 h-2 rounded-full transition-all ${
                          v <= idx
                            ? isSelected ? col.bg : 'bg-gray-300'
                            : 'bg-gray-100'
                        }`}
                      />
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex gap-3 justify-center">
          <button
            onClick={goPrev}
            disabled={current === 0}
            className="px-5 py-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold
              hover:bg-gray-50 transition disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
          >
            ← {lang === 'es' ? 'Anterior' : lang === 'fr' ? 'Précédent' : 'Prev'}
          </button>

          <button
            onClick={goNext}
            disabled={selectedIndex === undefined}
            className={`px-8 py-2.5 text-white rounded-xl text-sm font-bold transition shadow-sm min-w-[160px] text-center
              bg-gradient-to-r ${col.bar}
              hover:brightness-110 active:scale-95
              disabled:opacity-40 disabled:cursor-not-allowed disabled:brightness-100`}
          >
            {isLast
              ? (lang === 'es' ? '⭐ Ver Reporte' : lang === 'fr' ? '⭐ Voir le Rapport' : '⭐ View Report')
              : (lang === 'es' ? 'Siguiente →'   : lang === 'fr' ? 'Suivant →'          : 'Next →')
            }
          </button>
        </div>

        <p className="text-center text-[11px] text-gray-400">
          {lang === 'es'
            ? 'Teclas 1–5 para responder • ← → para navegar'
            : lang === 'fr'
            ? 'Touches 1–5 pour répondre • ← → pour naviguer'
            : 'Keys 1–5 to answer  •  ← → to navigate'}
        </p>

        {answeredCount === total && (
          <button
            onClick={finishQuiz}
            className="text-center text-[11px] text-violet-500 hover:underline"
          >
            {lang === 'es' ? 'Ver resultados →' : lang === 'fr' ? 'Voir les résultats →' : 'Go to results →'}
          </button>
        )}
      </div>
    </div>
  );
}