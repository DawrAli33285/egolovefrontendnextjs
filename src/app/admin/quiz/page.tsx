'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

interface QuizQuestion {
  id: number;
  langue: string;
  persona: string;
  pilier_id: number;
  pilier_emoji: string;
  pilier_nom: string;
  poids_pilier: number;
  pilier_description: string;
  question_id: string;
  correspondance_label: string;
  correspondance_description: string;
  question: string;
  poids_question: number;
  reponse_a: string;
  reponse_b: string;
  reponse_c: string;
  reponse_d: string;
}

interface ImportStats {
  total: number;
  inserted: number;
  skipped: number;
  errors: string[];
}

interface PillarStats {
  id: number;
  nom: string;
  emoji: string;
  count: number;
}

type QuizType = 'free' | 'premium';

interface QuizSlot {
  questions: QuizQuestion[];
  stats: ImportStats | null;
  fileName: string | null;
}

// ─── CSV Parser ───────────────────────────────────────────────────────────────
function parseCSV(text: string): QuizQuestion[] {
  const cleaned = text.replace(/^\uFEFF/, '');
  const lines = cleaned.split('\n').map(l => l.replace(/\r$/, ''));
  if (lines.length < 2) return [];

  const results: QuizQuestion[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    let inner = line;
    if (inner.startsWith('"')) inner = inner.slice(1);
    if (inner.endsWith('"'))   inner = inner.slice(0, -1);

    const cols = inner.split('","');

    const clean = (v: string): string => {
      if (!v) return '';
      if (v.startsWith('"')) v = v.slice(1);
      if (v.endsWith('"'))   v = v.slice(0, -1);
      return v.replace(/""/g, '"').trim();
    };

    const col0parts = cols[0].split(',');
    const langue  = clean(col0parts[0] || '');
    const persona = clean(col0parts[1] || '');

    if (cols.length < 15) {
      console.warn(`Row ${i} has only ${cols.length} columns, skipping`);
      continue;
    }

    try {
      results.push({
        id:                         i,
        langue,
        persona,
        pilier_id:                  parseInt(clean(cols[1]))    || 1,
        pilier_nom:                 clean(cols[2]),
        pilier_emoji:               clean(cols[3]),
        poids_pilier:               parseFloat(clean(cols[4]))  || 1.0,
        pilier_description:         clean(cols[5]),
        question_id:                clean(cols[6]),
        correspondance_label:       clean(cols[7]),
        correspondance_description: clean(cols[8]),
        question:                   clean(cols[9]),
        poids_question:             parseFloat(clean(cols[10])) || 1.0,
        reponse_a:                  clean(cols[11]),
        reponse_b:                  clean(cols[12]),
        reponse_c:                  clean(cols[13]),
        reponse_d:                  clean(cols[14]),
      });
    } catch (err) {
      console.warn(`Error parsing row ${i}:`, err);
    }
  }

  return results;
}

// ─── Colors ───────────────────────────────────────────────────────────────────
const PILLAR_COLORS: Record<number, { bg: string; text: string; border: string; dot: string }> = {
  1: { bg: 'bg-blue-950/40',    text: 'text-blue-300',    border: 'border-blue-800/50',    dot: 'bg-blue-400' },
  2: { bg: 'bg-amber-950/40',   text: 'text-amber-300',   border: 'border-amber-800/50',   dot: 'bg-amber-400' },
  3: { bg: 'bg-rose-950/40',    text: 'text-rose-300',    border: 'border-rose-800/50',    dot: 'bg-rose-400' },
  4: { bg: 'bg-emerald-950/40', text: 'text-emerald-300', border: 'border-emerald-800/50', dot: 'bg-emerald-400' },
  5: { bg: 'bg-violet-950/40',  text: 'text-violet-300',  border: 'border-violet-800/50',  dot: 'bg-violet-400' },
  6: { bg: 'bg-pink-950/40',    text: 'text-pink-300',    border: 'border-pink-800/50',    dot: 'bg-pink-400' },
  7: { bg: 'bg-teal-950/40',    text: 'text-teal-300',    border: 'border-teal-800/50',    dot: 'bg-teal-400' },
  8: { bg: 'bg-orange-950/40',  text: 'text-orange-300',  border: 'border-orange-800/50',  dot: 'bg-orange-400' },
  9: { bg: 'bg-indigo-950/40',  text: 'text-indigo-300',  border: 'border-indigo-800/50',  dot: 'bg-indigo-400' },
};

const PERSONA_COLORS: Record<string, string> = {
  All:    'bg-slate-700/60 text-slate-300 border-slate-600',
  Young:  'bg-blue-900/60 text-blue-300 border-blue-700',
  Mature: 'bg-amber-900/60 text-amber-300 border-amber-700',
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminQuizPage() {

  // ── Slot state (one per quiz type)
  const [slots, setSlots] = useState<Record<QuizType, QuizSlot>>({
    free:    { questions: [], stats: null, fileName: null },
    premium: { questions: [], stats: null, fileName: null },
  });

  // ── UI state
  const [activeType, setActiveType]       = useState<QuizType>('free');
  const [filtered, setFiltered]           = useState<QuizQuestion[]>([]);
  const [importing, setImporting]         = useState<QuizType | null>(null);
  const [saving, setSaving]               = useState<QuizType | null>(null);
  const [search, setSearch]               = useState('');
  const [filterPillar, setFilterPillar]   = useState('');
  const [filterPersona, setFilterPersona] = useState('');
  const [tab, setTab]                     = useState<'import' | 'table' | 'stats'>('import');
  const [toast, setToast]                 = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);
  const [dragOver, setDragOver]           = useState<QuizType | 'generic' | null>(null);

  // ── Modal state — for when user drops/clicks without a known type
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [pendingFile, setPendingFile]     = useState<File | null>(null);

  // ── File input refs (for the typed upload zones)
  const freeFileRef    = useRef<HTMLInputElement>(null);
  const premiumFileRef = useRef<HTMLInputElement>(null);
  const genericFileRef = useRef<HTMLInputElement>(null);

  // ── Toast helper
  const showToast = useCallback((msg: string, type: 'ok' | 'err' = 'ok') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const activeQuestions = slots[activeType].questions;
  const activeStats     = slots[activeType].stats;

  // ── Filter logic
  useEffect(() => {
    let data = [...activeQuestions];
    if (filterPillar)  data = data.filter(q => q.pilier_id === parseInt(filterPillar));
    if (filterPersona) data = data.filter(q => q.persona === filterPersona);
    if (search) {
      const s = search.toLowerCase();
      data = data.filter(q =>
        q.question.toLowerCase().includes(s) ||
        q.pilier_nom.toLowerCase().includes(s) ||
        q.question_id.toLowerCase().includes(s) ||
        q.correspondance_label.toLowerCase().includes(s)
      );
    }
    setFiltered(data);
  }, [activeQuestions, filterPillar, filterPersona, search]);

  // ── Reset filters when switching type
  useEffect(() => {
    setSearch(''); setFilterPillar(''); setFilterPersona('');
  }, [activeType]);

  // ── Core file processor
  // If type is known (e.g. from a typed upload zone) → process immediately
  // If type is unknown (generic drop/click) → show modal first
  const processFile = useCallback((file: File, type?: QuizType) => {
    if (!file.name.endsWith('.csv')) {
      showToast('Please upload a .csv file', 'err');
      return;
    }
    if (!type) {
      // Unknown type — store file and open modal
      setPendingFile(file);
      setShowTypeModal(true);
      return;
    }
    // Known type — parse immediately
    setImporting(type);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parsed = parseCSV(text);
      if (parsed.length === 0) {
        showToast('No valid rows found in CSV', 'err');
        setImporting(null);
        return;
      }
      setSlots(prev => ({ ...prev, [type]: { ...prev[type], questions: parsed, fileName: file.name } }));
      setImporting(null);
      setActiveType(type);
      setTab('table');
      showToast(`✓ Parsed ${parsed.length} ${type} questions — translations will be generated on save`);
    };
    reader.readAsText(file, 'UTF-8');
  }, [showToast]);

  // ── Called when user picks a type from the modal
  const confirmTypeAndProcess = (type: QuizType) => {
    setShowTypeModal(false);
    if (pendingFile) {
      processFile(pendingFile, type);
      setPendingFile(null);
    }
  };

  // ── Save to DB via API (includes translation)
  const handleSave = async (type: QuizType) => {
    const questions = slots[type].questions;
    if (questions.length === 0) return;
    setSaving(type);
    try {
      const res = await fetch('/api/admin/quiz/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions, quizType: type }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Import failed');
      setSlots(prev => ({ ...prev, [type]: { ...prev[type], stats: data } }));
      setTab('stats');
      showToast(`✓ ${data.inserted} ${type} questions saved to DB`);
    } catch (err: any) {
      showToast(err.message || 'Save failed', 'err');
    } finally {
      setSaving(null);
    }
  };

  // ── CSV export
  const downloadCSV = () => {
    const headers = ['Langue','Persona','Pilier_ID','Pilier_Nom','Pilier_Emoji','Poids_Pilier','Pilier_Description','Question_ID','Correspondance_Label','Correspondance_Description','Question','Poids_Question','Reponse_A_1pt','Reponse_B_2pts','Reponse_C_3pts','Reponse_D_4pts'];
    const rows = filtered.map(q => [
      q.langue, q.persona, q.pilier_id, q.pilier_nom, q.pilier_emoji, q.poids_pilier,
      q.pilier_description, q.question_id, q.correspondance_label, q.correspondance_description,
      q.question, q.poids_question, q.reponse_a, q.reponse_b, q.reponse_c, q.reponse_d,
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));
    const csv  = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `quiz_${activeType}_export.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  // ── Derived stats
  const pillarStats: PillarStats[] = Array.from(
    activeQuestions.reduce((acc, q) => {
      const key = q.pilier_id;
      if (!acc.has(key)) acc.set(key, { id: key, nom: q.pilier_nom, emoji: q.pilier_emoji, count: 0 });
      acc.get(key)!.count++;
      return acc;
    }, new Map<number, PillarStats>())
  ).map(([, v]) => v).sort((a, b) => a.id - b.id);

  const uniquePillars  = pillarStats;
  const uniquePersonas = ['All', 'Young', 'Mature'];

  // ─────────────────────────────────────────────────────────────────────────
  // Sub-component: typed upload zone (free or premium)
  // ─────────────────────────────────────────────────────────────────────────
  const UploadZone = ({ type }: { type: QuizType }) => {
    const ref       = type === 'free' ? freeFileRef : premiumFileRef;
    const isFree    = type === 'free';
    const slot      = slots[type];
    const isLoading = importing === type;
    const isSaving  = saving === type;
    const loaded    = slot.questions.length > 0;

    return (
      <div className={`flex-1 rounded-2xl border-2 p-6 flex flex-col gap-4 transition-all
        ${isFree ? 'border-violet-800/50 bg-violet-950/10' : 'border-amber-800/50 bg-amber-950/10'}`}>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`text-lg ${isFree ? 'text-violet-400' : 'text-amber-400'}`}>
              {isFree ? '🆓' : '⭐'}
            </span>
            <span className={`text-sm font-black uppercase tracking-wider ${isFree ? 'text-violet-300' : 'text-amber-300'}`}>
              {type} Quiz
            </span>
            <span className="text-[10px] text-slate-600">
              {isFree ? '· 45 questions' : '· 198 questions'}
            </span>
          </div>
          {loaded && (
            <span className="text-[10px] text-slate-500 font-mono">{slot.questions.length} loaded</span>
          )}
        </div>

        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(type); }}
          onDragLeave={() => setDragOver(null)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(null);
            const f = e.dataTransfer.files[0];
            if (f) processFile(f, type); // type already known here
          }}
          onClick={() => ref.current?.click()}
          className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
            ${dragOver === type
              ? (isFree ? 'border-violet-400 bg-violet-950/30' : 'border-amber-400 bg-amber-950/30')
              : 'border-slate-700 bg-slate-900/40 hover:border-slate-500 hover:bg-slate-800/40'
            }`}
        >
          <input
            ref={ref}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={e => {
              const f = e.target.files?.[0];
              if (f) processFile(f, type); // type already known here
              e.target.value = ''; // reset so same file can be picked again
            }}
          />
          {isLoading ? (
            <div className="flex flex-col items-center gap-2">
              <div className={`w-8 h-8 border-2 rounded-full animate-spin
                ${isFree ? 'border-violet-500/30 border-t-violet-400' : 'border-amber-500/30 border-t-amber-400'}`} />
              <span className="text-xs text-slate-400">Parsing…</span>
            </div>
          ) : loaded ? (
            <div className="flex flex-col items-center gap-1">
              <div className="text-2xl">✅</div>
              <p className="text-xs font-bold text-slate-300 truncate max-w-[180px]">{slot.fileName}</p>
              <p className="text-[10px] text-slate-500">Click or drop to replace</p>
            </div>
          ) : (
            <>
              <div className="text-3xl mb-2">📂</div>
              <p className="text-slate-300 font-bold text-sm mb-0.5">Drop {type} CSV here</p>
              <p className="text-slate-500 text-[10px]">or click to browse · no type prompt needed</p>
            </>
          )}
        </div>

        {/* Actions */}
        {loaded && (
          <div className="flex gap-2">
            <button
              onClick={() => { setActiveType(type); setTab('table'); }}
              className="flex-1 text-xs px-3 py-2 rounded-lg border border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200 transition"
            >
              👁 Preview
            </button>
            <button
              onClick={() => handleSave(type)}
              disabled={isSaving || saving !== null}
              className={`flex-1 text-xs px-3 py-2 rounded-lg font-bold text-white transition disabled:opacity-50 disabled:cursor-not-allowed
                ${isFree ? 'bg-violet-600 hover:bg-violet-500' : 'bg-amber-600 hover:bg-amber-500'}`}
            >
              {isSaving ? (
                <span className="flex items-center justify-center gap-1.5">
                  <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving & translating…
                </span>
              ) : '💾 Save to DB'}
            </button>
          </div>
        )}

        {/* Last save result */}
        {slot.stats && (
          <div className="bg-emerald-950/30 border border-emerald-800/40 rounded-xl px-3 py-2 flex items-center justify-between">
            <span className="text-[10px] text-emerald-400 font-bold">✓ Last save</span>
            <span className="text-[10px] text-slate-400 font-mono">
              {slot.stats.inserted} inserted · {slot.stats.skipped} skipped
            </span>
          </div>
        )}
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#080c14] text-slate-200 font-mono">

      {/* ══ TOAST ══════════════════════════════════════════════════════════════ */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[999] px-5 py-3 rounded-xl text-sm font-bold shadow-2xl transition-all
          ${toast.type === 'ok' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
          {toast.msg}
        </div>
      )}

      {/* ══ TYPE SELECTION MODAL ═══════════════════════════════════════════════
          Shown when user drops/clicks a file without using a typed upload zone.
          Lets them pick free or premium BEFORE the file is parsed.
      ════════════════════════════════════════════════════════════════════════ */}
      {showTypeModal && (
        <div className="fixed inset-0 z-[998] flex items-center justify-center p-5 bg-black/75 backdrop-blur-sm">
          <div className="bg-[#0d1220] border border-slate-700 rounded-2xl p-8 w-full max-w-sm shadow-2xl">

            <h3 className="text-lg font-black text-slate-100 mb-1">What type of quiz is this?</h3>
            <p className="text-slate-500 text-xs mb-6">
              Select the type for{' '}
              <span className="text-slate-300 font-mono bg-slate-800 px-1.5 py-0.5 rounded">
                {pendingFile?.name}
              </span>
            </p>

            <div className="flex flex-col gap-3 mb-5">
              <button
                onClick={() => confirmTypeAndProcess('free')}
                className="flex items-center gap-4 p-4 rounded-xl border-2 border-violet-700 bg-violet-950/30 hover:border-violet-400 hover:bg-violet-950/50 text-left transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                <span className="text-3xl">🆓</span>
                <div>
                  <div className="font-black text-sm uppercase tracking-wider text-violet-300">Free Quiz</div>
                  <div className="text-xs text-slate-500 mt-0.5">45 questions · 4-choice answers · ego vs love</div>
                </div>
              </button>

              <button
                onClick={() => confirmTypeAndProcess('premium')}
                className="flex items-center gap-4 p-4 rounded-xl border-2 border-amber-700 bg-amber-950/30 hover:border-amber-400 hover:bg-amber-950/50 text-left transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                <span className="text-3xl">⭐</span>
                <div>
                  <div className="font-black text-sm uppercase tracking-wider text-amber-300">Premium Quiz</div>
                  <div className="text-xs text-slate-500 mt-0.5">198 questions · Likert scale · 9 pillars deep</div>
                </div>
              </button>
            </div>

            <button
              onClick={() => { setShowTypeModal(false); setPendingFile(null); }}
              className="w-full text-xs text-slate-600 hover:text-slate-400 transition py-2 rounded-lg hover:bg-slate-800/40"
            >
              Cancel — discard file
            </button>
          </div>
        </div>
      )}

      {/* ══ HEADER ═════════════════════════════════════════════════════════════ */}
      <header className="border-b border-slate-800 bg-[#0a0f1a]/90 backdrop-blur sticky top-0 z-40">
        <div className="max-w-[1600px] mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-xs font-black text-white">
              A
            </div>
            <span className="text-sm font-bold text-slate-100 tracking-tight">Quiz Admin</span>
            <span className="text-slate-600 text-xs">/ datasheet</span>
          </div>

          <div className="flex items-center gap-2">
            {(slots.free.questions.length > 0 || slots.premium.questions.length > 0) && (
              <>
                {/* Type switcher */}
                <div className="flex rounded-lg border border-slate-700 overflow-hidden text-[10px] font-bold">
                  {(['free', 'premium'] as QuizType[]).map(t => (
                    <button
                      key={t}
                      onClick={() => setActiveType(t)}
                      disabled={slots[t].questions.length === 0}
                      className={`px-3 py-1.5 transition capitalize disabled:opacity-30
                        ${activeType === t
                          ? (t === 'free' ? 'bg-violet-600 text-white' : 'bg-amber-600 text-white')
                          : 'text-slate-500 hover:text-slate-300'
                        }`}
                    >
                      {t === 'free' ? '🆓' : '⭐'} {t}
                      {slots[t].questions.length > 0 && (
                        <span className="ml-1 opacity-60">({slots[t].questions.length})</span>
                      )}
                    </button>
                  ))}
                </div>

                {activeQuestions.length > 0 && (
                  <button
                    onClick={downloadCSV}
                    className="text-xs px-3 py-1.5 rounded-lg border border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200 transition"
                  >
                    ⬇ CSV
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </header>

      {/* ══ TABS ═══════════════════════════════════════════════════════════════ */}
      <div className="border-b border-slate-800 bg-[#0a0f1a]/60">
        <div className="max-w-[1600px] mx-auto px-6 flex gap-1 pt-2">
          {(['import', 'table', 'stats'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-xs font-bold rounded-t-lg capitalize transition border-b-2
                ${tab === t
                  ? 'text-violet-300 border-violet-500 bg-violet-950/30'
                  : 'text-slate-500 border-transparent hover:text-slate-300'
                }`}
            >
              {t === 'import'
                ? '📂 Import'
                : t === 'table'
                  ? `📋 Questions${activeQuestions.length ? ` (${filtered.length})` : ''}`
                  : '📊 Stats'}
            </button>
          ))}
        </div>
      </div>

      {/* ══ MAIN ═══════════════════════════════════════════════════════════════ */}
      <main className="max-w-[1600px] mx-auto px-6 py-6">

        {/* ────────────────────────────────────────────────────────────────────
            IMPORT TAB
            Has three upload zones:
            1. Generic drop zone (top) — triggers modal to pick type
            2. Free typed zone (bottom-left) — no modal, direct parse
            3. Premium typed zone (bottom-right) — no modal, direct parse
        ──────────────────────────────────────────────────────────────────── */}
        {tab === 'import' && (
          <div className="max-w-3xl mx-auto mt-8">
            <h2 className="text-2xl font-black text-slate-100 mb-1">Import Quiz CSV</h2>
            <p className="text-slate-500 text-sm mb-8">
              Drop any CSV above to be asked the type, or use the specific zones below to skip the prompt.
            </p>

            {/* ── Generic drop zone (shows type modal) ── */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver('generic'); }}
              onDragLeave={() => setDragOver(null)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(null);
                const f = e.dataTransfer.files[0];
                if (f) processFile(f); // no type → triggers modal
              }}
              onClick={() => genericFileRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all mb-6
                ${dragOver === 'generic'
                  ? 'border-slate-400 bg-slate-800/40 scale-[1.01]'
                  : 'border-slate-700 bg-slate-900/30 hover:border-slate-500 hover:bg-slate-800/30'
                }`}
            >
              <input
                ref={genericFileRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={e => {
                  const f = e.target.files?.[0];
                  if (f) processFile(f); // no type → triggers modal
                  e.target.value = '';
                }}
              />
              <div className="text-4xl mb-3">📂</div>
              <p className="text-slate-200 font-black text-base mb-1">Drop any quiz CSV here</p>
              <p className="text-slate-500 text-xs">
                You'll be asked to select <span className="text-violet-400 font-bold">Free</span> or{' '}
                <span className="text-amber-400 font-bold">Premium</span> before importing
              </p>
            </div>

            {/* ── Divider ── */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 h-px bg-slate-800" />
              <span className="text-[10px] text-slate-600 uppercase tracking-wider">or upload directly by type</span>
              <div className="flex-1 h-px bg-slate-800" />
            </div>

            {/* ── Typed upload zones (no modal) ── */}
            <div className="flex gap-4">
              <UploadZone type="free" />
              <UploadZone type="premium" />
            </div>

            {/* ── Translation notice ── */}
            <div className="mt-5 bg-indigo-950/40 border border-indigo-900/50 rounded-xl p-4 flex gap-3">
              <span className="text-indigo-400 text-lg shrink-0">🌐</span>
              <div>
                <p className="text-xs font-bold text-indigo-300 mb-0.5">Auto-translation on save</p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  French questions are automatically translated to <strong className="text-slate-300">English</strong> and{' '}
                  <strong className="text-slate-300">Spanish</strong> when you click "Save to DB". 
                  Translations are cached — the quiz loads instantly for users.
                  Large files (~198 questions) take ~3 min to save.
                </p>
              </div>
            </div>

            {/* ── Expected columns ── */}
            <div className="mt-4 bg-slate-900/60 border border-slate-800 rounded-xl p-4">
              <p className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Expected CSV columns</p>
              <div className="flex flex-wrap gap-1.5">
                {['Langue','Persona','Pilier_ID','Pilier_Nom','Pilier_Emoji','Poids_Pilier','Pilier_Description',
                  'Question_ID','Correspondance_Label','Correspondance_Description','Question','Poids_Question',
                  'Reponse_A','Reponse_B','Reponse_C','Reponse_D'].map(col => (
                  <span key={col} className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">{col}</span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ────────────────────────────────────────────────────────────────────
            TABLE TAB
        ──────────────────────────────────────────────────────────────────── */}
        {tab === 'table' && (
          <>
            {/* Type switcher */}
            <div className="flex gap-2 mb-4">
              {(['free', 'premium'] as QuizType[]).map(t => (
                <button
                  key={t}
                  onClick={() => setActiveType(t)}
                  disabled={slots[t].questions.length === 0}
                  className={`text-xs px-4 py-2 rounded-lg font-bold capitalize transition border disabled:opacity-30 disabled:cursor-not-allowed
                    ${activeType === t
                      ? (t === 'free' ? 'bg-violet-600 border-violet-500 text-white' : 'bg-amber-600 border-amber-500 text-white')
                      : 'border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                >
                  {t === 'free' ? '🆓' : '⭐'} {t}
                  {slots[t].questions.length > 0 && (
                    <span className="ml-1.5 opacity-70">({slots[t].questions.length})</span>
                  )}
                </button>
              ))}
            </div>

            {activeQuestions.length === 0 ? (
              <div className="text-center py-24 text-slate-600">
                <div className="text-5xl mb-4">📋</div>
                <p className="font-bold">No {activeType} questions loaded yet</p>
                <button
                  onClick={() => setTab('import')}
                  className="mt-4 text-xs px-4 py-2 rounded-lg bg-violet-600 text-white hover:bg-violet-500 transition"
                >
                  → Import CSV
                </button>
              </div>
            ) : (
              <>
                {/* Filters */}
                <div className="flex flex-wrap gap-3 mb-5 items-center">
                  <input
                    type="text"
                    placeholder="🔍 Search questions, pillars, IDs…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="flex-1 min-w-[220px] bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-violet-500 transition"
                  />
                  <select
                    value={filterPillar}
                    onChange={e => setFilterPillar(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-violet-500"
                  >
                    <option value="">All pillars</option>
                    {uniquePillars.map(p => (
                      <option key={p.id} value={p.id}>{p.emoji} {p.nom}</option>
                    ))}
                  </select>
                  <select
                    value={filterPersona}
                    onChange={e => setFilterPersona(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-violet-500"
                  >
                    <option value="">All personas</option>
                    {uniquePersonas.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  {(search || filterPillar || filterPersona) && (
                    <button
                      onClick={() => { setSearch(''); setFilterPillar(''); setFilterPersona(''); }}
                      className="text-xs px-3 py-2 rounded-lg border border-slate-700 text-slate-500 hover:text-slate-300 transition"
                    >
                      ✕ Clear
                    </button>
                  )}
                  <span className="text-xs text-slate-600 ml-auto">{filtered.length} rows</span>
                </div>

                {/* Table */}
                <div className="overflow-auto rounded-xl border border-slate-800 max-h-[70vh]">
                  <table className="w-full min-w-[1400px] text-xs border-collapse">
                    <thead className="sticky top-0 z-10">
                      <tr className="bg-[#0d1220] border-b border-slate-800">
                        {['ID', 'Type', 'Pillar', 'Persona', 'Weight', 'Label', 'Question', 'A (1pt)', 'B (2pt)', 'C (3pt)', 'D (4pt)'].map(h => (
                          <th key={h} className="text-left px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((q, i) => {
                        const pc = PILLAR_COLORS[q.pilier_id] || PILLAR_COLORS[1];
                        return (
                          <tr
                            key={q.id}
                            className={`border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors
                              ${i % 2 === 0 ? 'bg-transparent' : 'bg-slate-900/20'}`}
                          >
                            <td className="px-3 py-2.5 font-mono font-bold text-slate-400 whitespace-nowrap">
                              {q.question_id}
                            </td>
                            <td className="px-3 py-2.5 whitespace-nowrap">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border
                                ${activeType === 'free'
                                  ? 'bg-violet-950/40 text-violet-300 border-violet-800/50'
                                  : 'bg-amber-950/40 text-amber-300 border-amber-800/50'
                                }`}>
                                {activeType === 'free' ? '🆓 free' : '⭐ premium'}
                              </span>
                            </td>
                            <td className="px-3 py-2.5 whitespace-nowrap">
                              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${pc.bg} ${pc.text} ${pc.border}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${pc.dot}`} />
                                {q.pilier_emoji} {q.pilier_nom}
                              </span>
                            </td>
                            <td className="px-3 py-2.5 whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${PERSONA_COLORS[q.persona] || PERSONA_COLORS.All}`}>
                                {q.persona}
                              </span>
                            </td>
                            <td className="px-3 py-2.5 whitespace-nowrap">
                              <span className={`font-mono font-bold ${q.poids_question >= 2 ? 'text-amber-400' : 'text-slate-400'}`}>
                                ×{q.poids_question}
                              </span>
                            </td>
                            <td className="px-3 py-2.5 text-slate-400 max-w-[140px]">
                              <div className="truncate" title={q.correspondance_label}>{q.correspondance_label}</div>
                            </td>
                            <td className="px-3 py-2.5 text-slate-200 max-w-[300px]">
                              <div className="truncate" title={q.question}>{q.question}</div>
                            </td>
                            {[q.reponse_a, q.reponse_b, q.reponse_c, q.reponse_d].map((r, ri) => (
                              <td key={ri} className={`px-3 py-2.5 max-w-[180px] ${ri === 3 ? 'text-emerald-400/80' : 'text-slate-500'}`}>
                                <div className="truncate text-[10px]" title={r}>{r}</div>
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </>
        )}

        {/* ────────────────────────────────────────────────────────────────────
            STATS TAB
        ──────────────────────────────────────────────────────────────────── */}
        {tab === 'stats' && (
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-slate-100">Dataset Overview</h2>
              <div className="flex gap-2">
                {(['free', 'premium'] as QuizType[]).map(t => (
                  <button
                    key={t}
                    onClick={() => setActiveType(t)}
                    disabled={slots[t].questions.length === 0}
                    className={`text-xs px-3 py-1.5 rounded-lg font-bold capitalize transition border disabled:opacity-30
                      ${activeType === t
                        ? (t === 'free' ? 'bg-violet-600 border-violet-500 text-white' : 'bg-amber-600 border-amber-500 text-white')
                        : 'border-slate-700 text-slate-400 hover:text-slate-200'
                      }`}
                  >
                    {t === 'free' ? '🆓' : '⭐'} {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Last import result */}
            {activeStats && (
              <div className="bg-emerald-950/40 border border-emerald-800/50 rounded-2xl p-5 mb-6">
                <p className="text-sm font-bold text-emerald-300 mb-3">✓ Last Import — {activeType}</p>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'Inserted', val: activeStats.inserted, color: 'text-emerald-400' },
                    { label: 'Skipped',  val: activeStats.skipped,  color: 'text-amber-400'  },
                    { label: 'Total',    val: activeStats.total,    color: 'text-slate-300'  },
                  ].map(s => (
                    <div key={s.label} className="text-center">
                      <div className={`text-3xl font-black ${s.color}`}>{s.val}</div>
                      <div className="text-[10px] text-slate-500 uppercase mt-1">{s.label}</div>
                    </div>
                  ))}
                </div>
                {activeStats.errors.length > 0 && (
                  <div className="mt-4 bg-red-950/40 rounded-xl p-3">
                    <p className="text-xs font-bold text-red-400 mb-2">Errors ({activeStats.errors.length})</p>
                    {activeStats.errors.slice(0, 5).map((e, i) => (
                      <p key={i} className="text-xs text-red-300/70">{e}</p>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeQuestions.length > 0 && (
              <>
                {/* Summary cards */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {[
                    { label: 'Total Questions', val: activeQuestions.length, color: 'text-violet-400' },
                    { label: 'Pillars',          val: uniquePillars.length,   color: 'text-blue-400'   },
                    { label: 'Personas',          val: uniquePersonas.length,  color: 'text-amber-400' },
                  ].map(s => (
                    <div key={s.label} className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 text-center">
                      <div className={`text-3xl font-black ${s.color}`}>{s.val}</div>
                      <div className="text-[10px] text-slate-500 uppercase mt-1 tracking-wider">{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Per pillar bars */}
                <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 mb-4">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Questions per Pillar</p>
                  <div className="space-y-3">
                    {pillarStats.map(p => {
                      const pc  = PILLAR_COLORS[p.id] || PILLAR_COLORS[1];
                      const pct = Math.round((p.count / activeQuestions.length) * 100);
                      return (
                        <div key={p.id}>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className={`text-xs font-bold ${pc.text}`}>{p.emoji} {p.nom}</span>
                            <span className="text-xs text-slate-500 font-mono">{p.count} · {pct}%</span>
                          </div>
                          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-700 ${pc.dot}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Per persona */}
                <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Questions per Persona</p>
                  <div className="grid grid-cols-3 gap-3">
                    {uniquePersonas.map(persona => {
                      const count = activeQuestions.filter(q => q.persona === persona).length;
                      return (
                        <div key={persona} className={`rounded-xl p-3 text-center border ${PERSONA_COLORS[persona]}`}>
                          <div className="text-2xl font-black">{count}</div>
                          <div className="text-[10px] uppercase mt-1 opacity-70">{persona}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {activeQuestions.length === 0 && !activeStats && (
              <div className="text-center py-16 text-slate-600">
                <div className="text-4xl mb-3">📊</div>
                <p>No {activeType} data yet — import a CSV first</p>
                <button
                  onClick={() => setTab('import')}
                  className="mt-4 text-xs px-4 py-2 rounded-lg bg-violet-600 text-white hover:bg-violet-500 transition"
                >
                  → Import CSV
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}