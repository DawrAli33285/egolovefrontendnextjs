'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import Logo from '../../components/logo';
import AvatarCard from '../../components/Avatarcard';
import PillarBars from '@/components/PillarBars';
import RadarChart from '@/components/RadarChart';
import { PILLARS } from '@/data/pillars';
import jsPDF from 'jspdf';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { BASE_URL } from '../../lib/base';
import Hero from '../../assets/hero.png'
const PILLAR_RECS_EN: Record<number, any> = {
  1: {
    high: { label: 'Aligned', color: 'border-emerald-400', badge: 'bg-emerald-100 text-emerald-700',
      quote: '"Integrity is the alignment of what you think, say and do."',
      rec: 'Continue to embody this consistency daily. Inspire those around you by living authentically.' },
    mid: { label: 'Growing', color: 'border-amber-400', badge: 'bg-amber-100 text-amber-700',
      quote: '"Your word is your most powerful contract."',
      rec: 'Practice pausing before commitments. Ask: "Does this align with my deep values?"' },
    low: { label: 'To develop', color: 'border-yellow-600', badge: 'bg-yellow-100 text-yellow-800',
      quote: '"The first act of courage is to be honest with yourself."',
      rec: 'Start a daily journal: write 3 moments where your actions matched your values.' },
  },
  2: {
    high: { label: 'Authentic', color: 'border-emerald-400', badge: 'bg-emerald-100 text-emerald-700',
      quote: '"Be yourself; everyone else is already taken." — Oscar Wilde',
      rec: 'You are a rare example of authentic courage. Help others find their own voice.' },
    mid: { label: 'Growing', color: 'border-amber-400', badge: 'bg-amber-100 text-amber-700',
      quote: '"Vulnerability is the birthplace of love and belonging." — Brene Brown',
      rec: 'Practice sharing one genuine truth each week with a trusted person.' },
    low: { label: 'To develop', color: 'border-yellow-600', badge: 'bg-yellow-100 text-yellow-800',
      quote: '"The mask you wear to protect yourself is the prison that holds you."',
      rec: 'Identify your 3 main social masks. Work with a coach or therapist to gently remove them.' },
  },
  3: {
    high: { label: 'Pure love', color: 'border-emerald-400', badge: 'bg-emerald-100 text-emerald-700',
      quote: '"Give without remembering; receive without forgetting."',
      rec: 'Your capacity for unconditional giving is a gift. Protect it from burnout.' },
    mid: { label: 'Growing', color: 'border-amber-400', badge: 'bg-amber-100 text-amber-700',
      quote: '"Service to others is the rent you pay for your room here on earth." — M. Ali',
      rec: 'Each week, do one act of kindness with zero expectation of return.' },
    low: { label: 'To develop', color: 'border-yellow-600', badge: 'bg-yellow-100 text-yellow-800',
      quote: '"What you give comes back to you multiplied."',
      rec: 'Reflect: when you give, what do you secretly expect? Journaling this is transformative.' },
  },
  4: {
    high: { label: 'United', color: 'border-emerald-400', badge: 'bg-emerald-100 text-emerald-700',
      quote: '"Forgiveness is giving up the hope that the past could be any different."',
      rec: 'Your capacity to forgive and unite is extraordinary. Share this wisdom.' },
    mid: { label: 'Growing', color: 'border-amber-400', badge: 'bg-amber-100 text-amber-700',
      quote: '"Hooponopono: I love you, I am sorry, please forgive me, thank you."',
      rec: 'Practice the Hooponopono technique daily for 5 minutes with a difficult relationship.' },
    low: { label: 'To develop', color: 'border-yellow-600', badge: 'bg-yellow-100 text-yellow-800',
      quote: '"Holding a grudge is like drinking poison and expecting the other to die."',
      rec: 'Write a letter of forgiveness (not to send) to someone who has hurt you. Feel the release.' },
  },
  5: {
    high: { label: 'Conscious', color: 'border-emerald-400', badge: 'bg-emerald-100 text-emerald-700',
      quote: '"Know thyself." — Socrates',
      rec: 'Your depth of consciousness is rare. Use it to elevate your relationships and work.' },
    mid: { label: 'Growing', color: 'border-amber-400', badge: 'bg-amber-100 text-amber-700',
      quote: '"Between stimulus and response there is a space. In that space is our power."',
      rec: 'Establish a 10-minute morning meditation routine. Observe your thoughts without judgment.' },
    low: { label: 'To develop', color: 'border-yellow-600', badge: 'bg-yellow-100 text-yellow-800',
      quote: '"Most people are so busy they forget to live."',
      rec: 'Start with 5 minutes daily of mindful breathing. Reconnect with the present moment.' },
  },
  6: {
    high: { label: 'Generous', color: 'border-emerald-400', badge: 'bg-emerald-100 text-emerald-700',
      quote: '"We make a living by what we get; we make a life by what we give." — Churchill',
      rec: 'Your generosity creates abundance. Make sure to also receive gracefully.' },
    mid: { label: 'Growing', color: 'border-amber-400', badge: 'bg-amber-100 text-amber-700',
      quote: '"Generosity is not giving me what I need more than you do." — Kahlil Gibran',
      rec: 'This week, give your full presence — undivided attention — to someone who needs it.' },
    low: { label: 'To develop', color: 'border-yellow-600', badge: 'bg-yellow-100 text-yellow-800',
      quote: '"Fear of lack is the ego\'s greatest lie."',
      rec: 'Practice the giving without counting challenge: do 3 small gestures of giving this week.' },
  },
  7: {
    high: { label: 'Grateful', color: 'border-emerald-400', badge: 'bg-emerald-100 text-emerald-700',
      quote: '"Gratitude turns what we have into enough." — Melody Beattie',
      rec: 'Your gratitude practice is a source of inner richness. Share it through your presence.' },
    mid: { label: 'Growing', color: 'border-amber-400', badge: 'bg-amber-100 text-amber-700',
      quote: '"Gratitude is the memory of the heart." — Jean-Baptiste Massillon',
      rec: 'Keep a gratitude journal: write 3 specific things each evening that touched you today.' },
    low: { label: 'To develop', color: 'border-yellow-600', badge: 'bg-yellow-100 text-yellow-800',
      quote: '"He who is not grateful for little will not be grateful for much."',
      rec: 'Start with one gratitude each morning, even the simplest: "I am grateful for this breath."' },
  },
  8: {
    high: { label: 'Wise', color: 'border-emerald-400', badge: 'bg-emerald-100 text-emerald-700',
      quote: '"The only true wisdom is in knowing you know nothing." — Socrates',
      rec: "Your intellectual humility is your greatest strength. Keep cultivating the beginner's mind." },
    mid: { label: 'Growing', color: 'border-amber-400', badge: 'bg-amber-100 text-amber-700',
      quote: '"The wisest mind has something yet to learn." — George Santayana',
      rec: 'Practice saying "I don\'t know" at least once a day. Notice the freedom it creates.' },
    low: { label: 'To develop', color: 'border-yellow-600', badge: 'bg-yellow-100 text-yellow-800',
      quote: '"An empty vessel makes the most noise."',
      rec: 'Read one book outside your comfort zone each month. Actively seek out people who challenge you.' },
  },
  9: {
    high: { label: 'Peaceful', color: 'border-emerald-400', badge: 'bg-emerald-100 text-emerald-700',
      quote: '"Peace is not the absence of conflict but the presence of inner harmony."',
      rec: 'Your peace is your gift to the world. Protect it by setting healthy boundaries.' },
    mid: { label: 'Growing', color: 'border-amber-400', badge: 'bg-amber-100 text-amber-700',
      quote: '"Peace begins with a smile." — Mother Teresa',
      rec: 'Each day, identify one moment of genuine inner peace and consciously extend it.' },
    low: { label: 'To develop', color: 'border-yellow-600', badge: 'bg-yellow-100 text-yellow-800',
      quote: '"You cannot find peace by avoiding life." — Virginia Woolf',
      rec: 'Explore somatic practices (yoga, breathing, walking in nature) to anchor peace in your body.' },
  },
};

function getPillarRec(loveScore: number, recs: any) {
  if (loveScore >= 65) return recs.high;
  if (loveScore >= 40) return recs.mid;
  return recs.low;
}

const ACTION_PLAN_EN = [
  { freq: 'Daily',   action: 'Morning gratitude (3 things) + 5 min mindful breathing' },
  { freq: 'Daily',   action: 'Evening check: "Were my actions aligned with my values today?"' },
  { freq: 'Weekly',  action: 'One random act of kindness with zero expectation of return' },
  { freq: 'Weekly',  action: 'Hooponopono practice for one difficult relationship (5 min)' },
  { freq: 'Monthly', action: 'Deep review of your priority pillar with journaling' },
  { freq: 'Monthly', action: 'Share one genuine truth with a trusted person' },
];

const ACTION_PLAN_ES = [
  { freq: 'Diario',  action: 'Gratitud matutina (3 cosas) + 5 min de respiracion consciente' },
  { freq: 'Diario',  action: 'Revision nocturna: "Mis acciones estuvieron alineadas con mis valores hoy?"' },
  { freq: 'Semanal', action: 'Un acto de bondad aleatorio sin expectativa de retorno' },
  { freq: 'Semanal', action: 'Practica de Hooponopono para una relacion dificil (5 min)' },
  { freq: 'Mensual', action: 'Revision profunda de tu pilar prioritario con journaling' },
  { freq: 'Mensual', action: 'Compartir una verdad genuina con una persona de confianza' },
];

function buildDataPdf(global: any, pillarPercents: any, pillars: any[], actionPlan: any[], lang: string) {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const W = pdf.internal.pageSize.getWidth();
  const H = pdf.internal.pageSize.getHeight();
  const MARGIN = 15;
  const COL = W - MARGIN * 2;
  let y = MARGIN;

  const newPageIfNeeded = (needed = 12) => {
    if (y + needed > H - MARGIN) { pdf.addPage(); y = MARGIN; }
  };

  const hexToRgb = (hex: string): [number, number, number] => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return [r, g, b];
  };

  const setColor = (hex: string) => { const [r,g,b] = hexToRgb(hex); pdf.setTextColor(r,g,b); };
  const setFill  = (hex: string) => { const [r,g,b] = hexToRgb(hex); pdf.setFillColor(r,g,b); };
  const setDraw  = (hex: string) => { const [r,g,b] = hexToRgb(hex); pdf.setDrawColor(r,g,b); };


  setFill('#f5f3ff');
  pdf.rect(0, 0, W, 28, 'F');
  pdf.setFontSize(18); pdf.setFont('helvetica', 'bold'); setColor('#3b0764');
  pdf.text('EgoXLove', MARGIN, 12);
  pdf.setFontSize(7); pdf.setFont('helvetica', 'normal'); setColor('#92400e');
  pdf.text('PREMIUM REPORT', MARGIN + 38, 10);
  pdf.setFontSize(11); pdf.setFont('helvetica', 'bold'); setColor('#1e1b4b');
  pdf.text('Detailed Premium Report', MARGIN, 21);
  pdf.setFontSize(8); pdf.setFont('helvetica', 'normal'); setColor('#6b7280');
  pdf.text(new Date().toLocaleDateString(), W - MARGIN, 21, { align: 'right' });
  y = 36;

 
  setFill('#ffffff'); setDraw('#e5e7eb');
  pdf.roundedRect(MARGIN, y, COL, 28, 3, 3, 'FD');
  pdf.setFontSize(8); pdf.setFont('helvetica', 'bold'); setColor('#6b7280');
  pdf.text('GLOBAL RESULTS', W / 2, y + 6, { align: 'center' });
  pdf.setFontSize(26); pdf.setFont('helvetica', 'bold'); setColor('#d97706');
  pdf.text(`${global.ego}%`, W / 2 - 28, y + 22, { align: 'center' });
  pdf.setFontSize(7); pdf.setFont('helvetica', 'bold');
  pdf.text('EGO', W / 2 - 28, y + 27, { align: 'center' });
  setDraw('#d1d5db'); pdf.line(W / 2, y + 10, W / 2, y + 26);
  pdf.setFontSize(26); pdf.setFont('helvetica', 'bold'); setColor('#7c3aed');
  pdf.text(`${global.love}%`, W / 2 + 28, y + 22, { align: 'center' });
  pdf.setFontSize(7); pdf.setFont('helvetica', 'bold'); setColor('#7c3aed');
  pdf.text('LOVE', W / 2 + 28, y + 27, { align: 'center' });
  y += 36;

 
  newPageIfNeeded(14);
  pdf.setFontSize(10); pdf.setFont('helvetica', 'bold'); setColor('#1e1b4b');
  pdf.text('Pillar Scores', MARGIN, y); y += 6;

  pillars.forEach((p: any) => {
    newPageIfNeeded(10);
    const pp = pillarPercents[p.id] ?? { ego: 50, love: 50 };
    const barW = COL - 40;
    pdf.setFontSize(7); pdf.setFont('helvetica', 'normal'); setColor('#374151');
    pdf.text(`${p.icon || ''} ${p.name}`.trim(), MARGIN, y + 3);
    setFill('#fef3c7'); pdf.roundedRect(MARGIN + 40, y - 1, barW, 3.5, 1, 1, 'F');
    setFill('#d97706'); pdf.roundedRect(MARGIN + 40, y - 1, barW * (pp.ego / 100), 3.5, 1, 1, 'F');
    pdf.setFontSize(6); setColor('#92400e');
    pdf.text(`EGO ${pp.ego}%`, MARGIN + 40 + barW + 1, y + 2);
    y += 5; newPageIfNeeded(6);
    setFill('#ede9fe'); pdf.roundedRect(MARGIN + 40, y - 1, barW, 3.5, 1, 1, 'F');
    setFill('#7c3aed'); pdf.roundedRect(MARGIN + 40, y - 1, barW * (pp.love / 100), 3.5, 1, 1, 'F');
    pdf.setFontSize(6); setColor('#5b21b6');
    pdf.text(`LOVE ${pp.love}%`, MARGIN + 40 + barW + 1, y + 2);
    y += 7;
  });
  y += 3;

  
  newPageIfNeeded(14);
  pdf.setFontSize(10); pdf.setFont('helvetica', 'bold'); setColor('#1e1b4b');
  pdf.text('Analysis by Pillar', MARGIN, y); y += 6;

  const borderColors: Record<string, string> = {
    'border-emerald-400': '#34d399',
    'border-amber-400':   '#fbbf24',
    'border-yellow-600':  '#ca8a04',
  };

  pillars.forEach((p: any) => {
    const pp   = pillarPercents[p.id] ?? { ego: 50, love: 50 };
    const recs = PILLAR_RECS_EN[p.id];
    const rec  = getPillarRec(pp.love, recs);
    const bColor = borderColors[rec.color] || '#7c3aed';
    const quoteLines = pdf.splitTextToSize(rec.quote, COL - 8).length;
    const recLines   = pdf.splitTextToSize(rec.rec,   COL - 8).length;
    const blockH     = 8 + quoteLines * 4.5 + recLines * 4.5 + 10;
    newPageIfNeeded(blockH);
    setFill('#fafafa'); setDraw('#e5e7eb');
    pdf.roundedRect(MARGIN, y, COL, blockH, 2, 2, 'FD');
    const [br, bg, bb] = hexToRgb(bColor);
    pdf.setFillColor(br, bg, bb);
    pdf.roundedRect(MARGIN, y, 3, blockH, 1, 1, 'F');
    pdf.setFontSize(8); pdf.setFont('helvetica', 'bold'); setColor('#1e1b4b');
    pdf.text(`${p.icon || ''} ${p.name}`.trim(), MARGIN + 6, y + 6);
    pdf.setFontSize(6); pdf.setFont('helvetica', 'bold'); setColor(bColor);
    pdf.text(rec.label, MARGIN + 6 + pdf.getTextWidth(`${p.icon || ''} ${p.name}`.trim()) + 3, y + 6);
    pdf.setFontSize(6); pdf.setFont('helvetica', 'normal'); setColor('#9ca3af');
    pdf.text(`EGO ${pp.ego}%  ·  LOVE ${pp.love}%`, MARGIN + 6, y + 11);
    let innerY = y + 16;
    const qLines = pdf.splitTextToSize(rec.quote, COL - 10);
    setFill('#f5f3ff');
    pdf.roundedRect(MARGIN + 4, innerY - 3, COL - 8, qLines.length * 4.5 + 3, 1, 1, 'F');
    pdf.setFontSize(6.5); pdf.setFont('helvetica', 'italic'); setColor('#6d28d9');
    qLines.forEach((l: string) => { pdf.text(l, MARGIN + 6, innerY); innerY += 4.5; });
    innerY += 2;
    const rLines = pdf.splitTextToSize(rec.rec, COL - 10);
    pdf.setFontSize(6.5); pdf.setFont('helvetica', 'normal'); setColor('#374151');
    rLines.forEach((l: string) => { pdf.text(l, MARGIN + 6, innerY); innerY += 4.5; });
    y += blockH + 3;
  });

  
  newPageIfNeeded(40);
  pdf.setFontSize(10); pdf.setFont('helvetica', 'bold'); setColor('#1e1b4b');
  pdf.text('Priority Pillars to Develop', MARGIN, y); y += 5;
  const sorted = [...pillars].sort((a: any, b: any) => (pillarPercents[a.id]?.love ?? 50) - (pillarPercents[b.id]?.love ?? 50));
  sorted.slice(0, 3).forEach((p: any, idx: number) => {
    newPageIfNeeded(10);
    const pp = pillarPercents[p.id] ?? { love: 50 };
    setFill('#7c3aed'); pdf.circle(MARGIN + 3.5, y + 2, 3.5, 'F');
    pdf.setFontSize(7); pdf.setFont('helvetica', 'bold'); setColor('#ffffff');
    pdf.text(String(idx + 1), MARGIN + 3.5, y + 3.5, { align: 'center' });
    pdf.setFontSize(8); pdf.setFont('helvetica', 'normal'); setColor('#374151');
    pdf.text(`${p.icon || ''} ${p.name}`.trim(), MARGIN + 10, y + 4);
    pdf.setFontSize(7); setColor('#9ca3af');
    pdf.text(`LOVE ${pp.love}%`, MARGIN + 10 + pdf.getTextWidth(`${p.icon || ''} ${p.name}`.trim()) + 3, y + 4);
    setDraw('#f3f4f6'); pdf.line(MARGIN, y + 7, MARGIN + COL, y + 7);
    y += 10;
  });
  y += 3;

 
  newPageIfNeeded(50);
  setFill('#f5f3ff'); setDraw('#ddd6fe');
  const planStartY = y;
  const planH = actionPlan.length * 9 + 14;
  pdf.roundedRect(MARGIN, planStartY, COL, planH, 3, 3, 'FD');
  pdf.setFontSize(10); pdf.setFont('helvetica', 'bold'); setColor('#1e1b4b');
  pdf.text('30-Day Action Plan', MARGIN + 4, y + 8); y += 14;
  const freqColors: Record<string, string> = { Daily: '#6d28d9', Diario: '#6d28d9', Weekly: '#7c3aed', Semanal: '#7c3aed', Monthly: '#a78bfa', Mensual: '#a78bfa' };
  actionPlan.forEach((item: any) => {
    newPageIfNeeded(9);
    pdf.setFontSize(7); pdf.setFont('helvetica', 'bold');
    const fc = freqColors[item.freq] || '#6d28d9';
    setColor(fc);
    pdf.text(item.freq, MARGIN + 4, y);
    pdf.setFont('helvetica', 'normal'); setColor('#374151');
    const aLines = pdf.splitTextToSize(item.action, COL - 30);
    aLines.forEach((l: string, i: number) => { pdf.text(l, MARGIN + 22, y + i * 4); });
    y += Math.max(aLines.length * 4, 7) + 2;
  });

 
  const totalPages = pdf.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(7); pdf.setFont('helvetica', 'normal'); setColor('#9ca3af');
    pdf.text(`EgoXLove Premium Report  ·  Page ${i} of ${totalPages}`, W / 2, H - 8, { align: 'center' });
  }

  return pdf;
}

export default function PremiumReportPage() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const lang = i18n.language === 'es' ? 'es' : 'en';
  const [results, setResults] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [popupEmail, setPopupEmail] = useState('');
  const [popupConsent, setPopupConsent] = useState(false);
  const [reportSending, setReportSending] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const r = sessionStorage.getItem('egoxlove_premium_results');
    const u = sessionStorage.getItem('egoxlove_user');
    if (!r) { router.push('/'); return; }
    setResults(JSON.parse(r));
    if (u) setUser(JSON.parse(u));
    setTimeout(() => setShowPopup(true), 600);
  }, [router]);

  const getPillarsForPdf = () => {
    return PILLARS.map(p => {
      const pillarT = t(`pillars.${p.id}`, { returnObjects: true }) as any;
      return { ...p, name: pillarT?.name || p.id };
    });
  };

  const handleDownloadPDF = async () => {
    if (!results) return;
    setPdfLoading(true);
    setShowPopup(false);
    try {
      const { global, pillarPercents } = results;
      const actionPlan = lang === 'es' ? ACTION_PLAN_ES : ACTION_PLAN_EN;
      const pdf = buildDataPdf(global, pillarPercents, getPillarsForPdf(), actionPlan, lang);
      pdf.save('EgoXLove-Premium-Report.pdf');
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate PDF.', { containerId: 'premium-toast' });
    } finally {
      setPdfLoading(false);
    }
  };

  const handleSendReport = async () => {
    if (!results) return;
    setReportSending(true);
    try {
      const { global, pillarPercents } = results;
      const actionPlan = lang === 'es' ? ACTION_PLAN_ES : ACTION_PLAN_EN;
      const pdf = buildDataPdf(global, pillarPercents, getPillarsForPdf(), actionPlan, lang);
      const pdfBase64 = pdf.output('datauristring').split(',')[1];
      await axios.post(`${BASE_URL}/quiz/send-report`, {
        email: popupEmail,
        results: { global, pillarPercents },
        pdfBase64,
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setShowPopup(false);
      toast.success('Report sent! Check your inbox.', { containerId: 'premium-toast' });
    } catch (err) {
      console.error(err);
      toast.error('Failed to send report.', { containerId: 'premium-toast' });
    } finally {
      setReportSending(false);
    }
  };

  if (!results) return null;
  const { global, pillarPercents } = results;
  const actionPlan = lang === 'es' ? ACTION_PLAN_ES : ACTION_PLAN_EN;
  const sortedPillars = [...PILLARS].sort(
    (a, b) => (pillarPercents[a.id]?.love ?? 50) - (pillarPercents[b.id]?.love ?? 50)
  );

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          @page { margin: 15mm; size: A4; }
        }
      `}</style>

      {showPopup && (
        <div className="no-print fixed inset-0 z-[999] flex items-center justify-center p-5">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowPopup(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowPopup(false)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 text-sm transition">✕</button>
            <div className="w-16 h-16 rounded-full bg-violet-100 flex items-center justify-center text-3xl mx-auto mb-4">📧</div>
            <h3 className="text-xl font-black text-indigo-950 mb-2">Receive Your Premium Report</h3>
            <p className="text-sm text-gray-500 leading-relaxed mb-5">Enter your email to receive your full premium results report.</p>
            <input type="email" placeholder="you@example.com" value={popupEmail} onChange={e => setPopupEmail(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-100 transition mb-4" />
            <label className="flex items-start gap-3 text-left mb-6 cursor-pointer">
              <input type="checkbox" checked={popupConsent} onChange={e => setPopupConsent(e.target.checked)} className="mt-0.5 accent-violet-600 w-4 h-4 shrink-0" />
              <span className="text-xs text-gray-500 leading-relaxed">I wish to receive the report by email and agree to be contacted exclusively by this service.</span>
            </label>
            <button onClick={handleSendReport} disabled={!popupConsent || !popupEmail || reportSending}
              className="w-full bg-gradient-to-r from-violet-600 to-purple-700 text-white py-4 rounded-2xl font-black text-sm hover:brightness-110 hover:-translate-y-0.5 transition-all duration-200 shadow-lg shadow-purple-200 disabled:opacity-60 disabled:cursor-not-allowed mb-3">
              {reportSending ? 'Sending…' : '📧 Send My Premium Report'}
            </button>
            <button onClick={() => setShowPopup(false)} className="w-full py-3 text-sm text-gray-400 hover:text-gray-600 transition font-medium">Continue viewing report →</button>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-gray-50">
        <div className="bg-gradient-to-r from-violet-50 to-purple-50 border-b border-violet-100">
          <div className="max-w-2xl mx-auto px-5 py-5">
            <div className="flex justify-between items-start flex-wrap gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Logo size={32} />
                  <span className="font-black text-base">
                    <span className="text-yellow-700">Ego</span>
                    <span className="text-violet-600">X</span>
                    <span className="text-violet-800">Love</span>
                  </span>
                  <span className="border border-yellow-600 text-yellow-700 text-[9px] font-black px-2 py-0.5 rounded-full">RAPPORT PREMIUM ⭐</span>
                </div>
                <h1 className="text-xl font-black text-indigo-950">📄 Detailed Premium Report</h1>
                {user && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    {user.name}{user.age ? `, ${user.age} ans` : ''} · {new Date().toLocaleDateString()}
                  </p>
                )}
              </div>
              <div className="no-print flex gap-2 flex-wrap">
                <button onClick={() => setShowPopup(true)} className="flex items-center gap-1.5 bg-violet-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-violet-700 transition">
                  📧 Send by Email
                </button>
                <button onClick={handleDownloadPDF} disabled={pdfLoading} className="flex items-center gap-1.5 bg-indigo-950 text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-indigo-800 transition disabled:opacity-60">
                  {pdfLoading ? 'Preparing…' : '📥 Download PDF'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div ref={reportRef} className="max-w-2xl mx-auto px-5 py-6 space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Global Results</h2>
            <div className="flex items-center justify-center gap-10 mb-6">
              <div>
                <div className="text-5xl font-black text-yellow-600">{global.ego}%</div>
                <div className="text-xs font-bold text-yellow-600 mt-1">🟡 EGO</div>
              </div>
              <div className="text-3xl text-gray-200">⚡</div>
              <div>
                <div className="text-5xl font-black text-violet-600">{global.love}%</div>
                <div className="text-xs font-bold text-violet-600 mt-1">💜 LOVE</div>
              </div>
            </div>
            <AvatarCard egoPercent={global.ego} />
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 text-center">📊 Radar by Pillar</h2>
            <RadarChart pillarPercentMap={pillarPercents} />
          </div>

          <PillarBars pillarPercentMap={pillarPercents} />

          <div>
            <h2 className="text-base font-black text-indigo-950 mb-3">🔍 Analysis by Pillar</h2>
            <div className="space-y-3">
              {PILLARS.map((p) => {
                const pp = pillarPercents[p.id] ?? { ego: 50, love: 50 };
                const recs = PILLAR_RECS_EN[p.id];
                const rec = getPillarRec(pp.love, recs);
                const pillarT = t(`pillars.${p.id}`, { returnObjects: true }) as any;
                return (
                  <div key={p.id} className={`bg-white rounded-2xl p-5 shadow-sm border-l-4 ${rec.color}`}>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{p.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-indigo-950">{pillarT.name}</span>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${rec.badge}`}>{rec.label}</span>
                        </div>
                        <span className="text-xs text-gray-400">EGO {pp.ego}% · LOVE {pp.love}%</span>
                      </div>
                    </div>
                    <p className="text-xs italic text-violet-700 bg-violet-50 rounded-lg px-3 py-2 mb-2 leading-relaxed">{rec.quote}</p>
                    <p className="text-xs text-gray-600 leading-relaxed">{rec.rec}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h2 className="text-sm font-black text-indigo-950 mb-4">🎯 Priority Pillars to Develop</h2>
            <div className="space-y-2">
              {sortedPillars.slice(0, 3).map((p, idx) => {
                const pp = pillarPercents[p.id] ?? { ego: 50, love: 50 };
                const pillarT = t(`pillars.${p.id}`, { returnObjects: true }) as any;
                return (
                  <div key={p.id} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
                    <div className="w-7 h-7 rounded-full bg-violet-600 text-white flex items-center justify-center text-xs font-black flex-shrink-0">{idx + 1}</div>
                    <div className="flex-1">
                      <span className="text-sm text-gray-700">{p.icon} {pillarT.name}</span>
                      <span className="ml-2 text-xs text-gray-400">LOVE {pp.love}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl p-5 border border-violet-100">
            <h2 className="text-sm font-black text-indigo-950 mb-4">📅 30-Day Action Plan</h2>
            <div className="space-y-2">
              {actionPlan.map((item: any, i: number) => (
                <div key={i} className="flex items-start gap-3 py-1.5 text-xs text-gray-700">
                  <span className="font-black text-violet-700 min-w-[56px] text-[11px]">{item.freq}</span>
                  <span className="leading-relaxed">{item.action}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center space-y-2">
            <button onClick={() => router.push('/quiz')} className="text-xs text-violet-600 font-semibold hover:underline block mx-auto">← Retake free quiz</button>
            <Link href="/" className="text-xs text-gray-400 hover:text-gray-600 transition block">Back to home</Link>
          </div>

          <p className="text-center text-[10px] text-gray-400">{t('footer')}</p>
        </div>
      </div>

      <ToastContainer containerId="premium-toast" autoClose={4000} theme="light" />
    </>
  );
}
