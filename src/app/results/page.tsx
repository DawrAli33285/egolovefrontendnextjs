'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import AvatarCard from '../../components/Avatarcard';
import PillarBars from '../../components/PillarBars';
import RadarChart from '../../components/RadarChart';
import html2canvas from 'html2canvas-pro';
import jsPDF from 'jspdf';
import axios from 'axios';
import PremiumReport from '@/components/Premiumreport';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { BASE_URL } from '../../lib/base';
import { useApp } from '@/context/AppContext';
import Hero from '../../assets/hero.png'
export default function FreeResultsPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [results, setResults] = useState<any>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [popupEmail, setPopupEmail] = useState('');
  const [popupConsent, setPopupConsent] = useState(false);
  const [reportSending, setReportSending] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  const { user } = useApp();

  useEffect(() => {
    const r = sessionStorage.getItem('egoxlove_free_results');
    if (!r) { router.push('/'); return; }
    setResults(JSON.parse(r));
    setTimeout(() => setShowPopup(true), 600);
  }, [router]);

  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;
    setPdfLoading(true);
    setShowPopup(false);
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 1,
        useCORS: true,
        scrollY: -window.scrollY,
        windowWidth: reportRef.current.scrollWidth,
        windowHeight: reportRef.current.scrollHeight,
        ignoreElements: (el) => el.classList.contains('no-print'),
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.6);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeightA4 = pdf.internal.pageSize.getHeight();
      const imgHeightFull = (canvas.height * pageWidth) / canvas.width;

      let yPosition = 0;
      let remainingHeight = imgHeightFull;

      while (remainingHeight > 0) {
        pdf.addImage(imgData, 'PNG', 0, -yPosition, pageWidth, imgHeightFull);
        remainingHeight -= pageHeightA4;
        yPosition += pageHeightA4;
        if (remainingHeight > 0) pdf.addPage();
      }

      pdf.save('EgoXLove-Report.pdf');
    } catch (err: any) {
      console.log(err.message);
      toast.error('Failed to generate PDF.', { containerId: 'results-toast' });
    } finally {
      setPdfLoading(false);
    }
  };

  const handleSendReport = async () => {
    if (!reportRef.current || !results) return;
    setReportSending(true);
    try {
      let pdfBase64 = null;

      const canvas = await html2canvas(reportRef.current, {
        scale: 1,
        useCORS: true,
        scrollY: -window.scrollY,
        windowWidth: reportRef.current.scrollWidth,
        windowHeight: reportRef.current.scrollHeight,
        ignoreElements: (el) => el.classList.contains('no-print'),
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.6);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeightA4 = pdf.internal.pageSize.getHeight();
      const imgHeightFull = (canvas.height * pageWidth) / canvas.width;

      let yPosition = 0;
      let remainingHeight = imgHeightFull;

      while (remainingHeight > 0) {
        pdf.addImage(imgData, 'PNG', 0, -yPosition, pageWidth, imgHeightFull);
        remainingHeight -= pageHeightA4;
        yPosition += pageHeightA4;
        if (remainingHeight > 0) pdf.addPage();
      }

      pdfBase64 = pdf.output('datauristring').split(',')[1];

      await axios.post(`${BASE_URL}/quiz/send-report`, {
        email: popupEmail,
        results: { global, pillarPercents },
        pdfBase64,
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      setShowPopup(false);
      toast.success('Report sent! Check your inbox.', { containerId: 'results-toast' });
    } catch (err: any) {
      console.log(err.message);
      toast.error('Failed to send report.', { containerId: 'results-toast' });
    } finally {
      setReportSending(false);
    }
  };

  if (!results) return null;
  const { global, pillarPercents } = results;

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
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowPopup(false)}
          />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowPopup(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 text-sm transition"
            >
              ✕
            </button>
      
            <div className="w-16 h-16 rounded-full bg-violet-100 flex items-center justify-center text-3xl mx-auto mb-4">
              📧
            </div>
            <h3 className="text-xl font-black text-indigo-950 mb-2">{t('results.popup.title')}</h3>
            <p className="text-sm text-gray-500 leading-relaxed mb-5">
              {t('results.popup.desc')}
            </p>
      
            <input
              type="email"
              placeholder="you@example.com"
              value={popupEmail}
              onChange={e => setPopupEmail(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-100 transition mb-4"
            />
      
            <label className="flex items-start gap-3 text-left mb-6 cursor-pointer">
              <input
                type="checkbox"
                checked={popupConsent}
                onChange={e => setPopupConsent(e.target.checked)}
                className="mt-0.5 accent-violet-600 w-4 h-4 shrink-0"
              />
              <span className="text-xs text-gray-500 leading-relaxed">
                {t('results.popup.consent')}
              </span>
            </label>
      
            <button
              onClick={handleSendReport}
              disabled={!popupConsent || !popupEmail || reportSending}
              className="w-full bg-gradient-to-r from-violet-600 to-purple-700 text-white py-4 rounded-2xl font-black text-sm hover:brightness-110 hover:-translate-y-0.5 transition-all duration-200 shadow-lg shadow-purple-200 disabled:opacity-60 disabled:cursor-not-allowed mb-3"
            >
              {reportSending ? t('results.popup.sending') : t('results.popup.send')}
            </button>
      
            <button
              onClick={() => setShowPopup(false)}
              className="w-full py-3 text-sm text-gray-400 hover:text-gray-600 transition font-medium"
            >
              {t('results.popup.continue')}
            </button>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-gradient-to-b from-violet-50 to-gray-50">
        <div ref={reportRef} className="max-w-xl mx-auto px-5 pb-16">

         
          <div className="relative w-full rounded-3xl overflow-hidden mb-6 shadow-2xl mt-6" style={{ aspectRatio: '9/13' }}>
            <Image src={user?.avatar}  alt="EgoXLove result" fill className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/5 to-black/75" />
            <div className="absolute top-5 left-5">
              <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
                <span className="text-white text-lg font-black">✕</span>
              </div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
              <div className="opacity-15">
                <svg width="260" height="260" viewBox="0 0 260 260" fill="none">
                  <path d="M130 220 C130 220 20 155 20 85 C20 50 48 28 80 28 C100 28 118 40 130 55 C142 40 160 28 180 28 C212 28 240 50 240 85 C240 155 130 220 130 220Z" fill="white"/>
                  <line x1="75" y1="75" x2="185" y2="185" stroke="white" strokeWidth="18" strokeLinecap="round"/>
                  <line x1="185" y1="75" x2="75" y2="185" stroke="white" strokeWidth="18" strokeLinecap="round"/>
                </svg>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 flex">
              <div className="flex-1 px-8 pb-8 pt-6">
                <div className="text-[#C4B5FD] text-xl font-black tracking-widest mb-1">LOVE</div>
                <div className="text-white text-6xl font-black leading-none">{global.love}%</div>
              </div>
              <div className="w-px bg-white/25 my-6" />
              <div className="flex-1 px-8 pb-8 pt-6">
                <div className="text-[#D4A845] text-xl font-black tracking-widest mb-1">EGO</div>
                <div className="text-white text-6xl font-black leading-none">{global.ego}%</div>
              </div>
            </div>
          </div>

          {/* Download PDF button */}
          <button
            onClick={handleDownloadPDF}
            disabled={pdfLoading}
            className="no-print w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-900 to-violet-800 text-white py-4 rounded-2xl font-black text-sm hover:brightness-110 hover:-translate-y-0.5 transition-all duration-200 shadow-lg mb-6 disabled:opacity-60"
          >
            {pdfLoading
              ? <><svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg> Preparing…</>
              : <><span>📥</span> Download My Results as PDF</>
            }
          </button>

          {/* Title */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-black text-indigo-950">{t('results.title')}</h2>
            <p className="text-xs text-gray-400 mt-1">{new Date().toLocaleDateString()}</p>
          </div>

          {/* Global scores */}
          <div className="flex items-center justify-center gap-10 mb-6 bg-white rounded-2xl p-5 shadow-sm">
            <div className="text-center">
              <div className="text-5xl font-black text-yellow-600">{global.ego}%</div>
              <div className="text-xs font-bold text-yellow-600 mt-1">🟡 EGO</div>
            </div>
            <div className="text-3xl text-gray-300">⚡</div>
            <div className="text-center">
              <div className="text-5xl font-black text-violet-600">{global.love}%</div>
              <div className="text-xs font-bold text-violet-600 mt-1">💜 LOVE</div>
            </div>
          </div>

          <div className="mb-6"><AvatarCard egoPercent={global.ego} /></div>
          <div className="bg-white rounded-2xl p-5 shadow-sm mb-4"><RadarChart pillarPercentMap={pillarPercents} /></div>
          <div className="mb-6"><PillarBars pillarPercentMap={pillarPercents} /></div>

          {/* Premium report — only for premium users */}
          {user?.isPremium && (
            <PremiumReport pillarPercents={pillarPercents} global={global} />
          )}

          {/* Upsell — only for free users */}
          {!user?.isPremium && (
            <div className="no-print relative overflow-hidden bg-gradient-to-br from-indigo-950 via-purple-900 to-violet-900 rounded-3xl p-8 text-white text-center shadow-2xl mb-6">
              <div className="absolute top-0 right-0 w-3/4 h-full bg-[radial-gradient(ellipse,rgba(184,134,11,0.1),transparent_70%)] pointer-events-none" />
              <div className="text-4xl mb-3">⭐</div>
              <h3 className="text-xl font-black mb-2">{t('results.upsell.title')}</h3>
              <p className="text-sm opacity-85 mb-5 leading-relaxed">{t('results.upsell.desc')}</p>
              <div className="grid grid-cols-2 gap-2 mb-6 text-left">
                {['feature1','feature2','feature3','feature4'].map(k => (
                  <span key={k} className="flex items-center gap-1.5 text-xs bg-white/10 rounded-lg px-3 py-2">{t(`results.upsell.${k}`)}</span>
                ))}
              </div>
              <button
                onClick={() => router.push('/premium-quiz')}
                className="bg-gradient-to-r from-white to-purple-50 text-indigo-950 px-10 py-4 rounded-full text-base font-black hover:scale-105 transition-all duration-200 shadow-lg block w-full mb-3"
              >
                {t('results.upsell.cta')}
              </button>
              <Link href="/subscription" className="text-xs text-white/60 hover:text-white/90 transition underline underline-offset-2">
                ⭐ View all Premium plans →
              </Link>
            </div>
          )}

          <div className="no-print text-center mt-4">
            <Link href="/" className="text-xs text-gray-400 hover:text-gray-600 transition">← Back to home</Link>
          </div>
          <p className="no-print text-center text-[10px] text-gray-400 mt-8">{t('footer')}</p>
          <ToastContainer containerId="results-toast" autoClose={4000} theme="light" />
        </div>
      </div>
    </>
  );
}
