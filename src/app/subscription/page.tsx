'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useApp } from '@/context/AppContext';
import { CardNumberElement, CardExpiryElement, CardCvcElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { BASE_URL } from '../../lib/base';

const PLANS = [
  {
    id: 'Premium',
    badge: null,
    icon: '🌱',
    name: 'Starter',
    price: '€1.99',
    period: 'one-time',
    highlight: false,
    borderClass: 'border-violet-200 hover:border-violet-400',
    btnClass: 'bg-gradient-to-r from-violet-600 to-purple-700',
    features: [
      '✅ Full Premium Quiz (198 questions)',
      '✅ Detailed Report per Pillar',
      '✅ Personalized Quotes',
      '✅ Priority Action Plan',
      '✅ PDF Download',
    ],
  },
];

const COMPARE_ROWS = [
  { label: 'Premium Quiz (198 Qs)',     starter: true,  pro: true,  elite: true },
  { label: 'Detailed Pillar Report',    starter: true,  pro: true,  elite: true },
  { label: 'Personalized Quotes',       starter: true,  pro: true,  elite: true },
  { label: 'PDF Download',              starter: true,  pro: true,  elite: true },
  { label: 'Unlimited Re-assessments',  starter: false, pro: true,  elite: true },
];

const TRUST = [
  { icon: '🔒', label: 'Secure payment',  sub: 'Stripe encrypted' },
  { icon: '↩️', label: '7-day refund',    sub: 'No questions asked' },
  { icon: '🧬', label: 'Science-backed',  sub: 'Adaptive neuroscience' },
];

const FAQ = [
  { q: "What's the difference with the free test?",   a: "The free test has 45 questions with 4-choice answers. Premium has 198 questions on a Likert scale, broken into 4 sections per pillar (Origins, Reactions, Capacity to Change, Impacts)." },
  { q: "Can I cancel anytime?",                       a: "Yes. Monthly plans can be cancelled at any time from your profile. You keep access until the end of your billing period." },
  { q: "Is my data private?",                         a: "Absolutely. Your answers and results are kept private and never shared with third parties." },
  { q: "Can I retake the test?",                      a: "The free test can be retaken anytime. Pro and Elite plans include unlimited premium re-assessments with progress tracking." },
];

const CARD_STYLE = {
  style: {
    base: {
      fontSize: '14px',
      color: '#1e1b4b',
      fontFamily: 'inherit',
      '::placeholder': { color: '#9ca3af' },
    },
    invalid: { color: '#ef4444' },
  },
};

function PaymentModal({ plan, onClose, onSuccess }: { plan: any; onClose: () => void; onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');

  const handlePay = async () => {
    if (!stripe || !elements) return;
    setPaying(true);
    setError('');
    try {
      const cardElement = elements.getElement(CardNumberElement);
      if (!cardElement) throw new Error('Card element not found');

      const { paymentMethod, error: stripeError } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });
      if (stripeError) throw new Error(stripeError.message);

      const storedUser = localStorage.getItem('user');
      const token = storedUser ? JSON.parse(storedUser)?.token : null;
      const email = storedUser ? JSON.parse(storedUser)?.email : null;

      const res = await fetch(`${BASE_URL}/subscription/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email,
          amount:         1.99,
          currency:       'eur',
          interval:       'month',
          paymentMethod:  paymentMethod?.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Subscription failed');

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Payment failed. Please try again.');
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden">

        <div className="bg-gradient-to-r from-violet-600 to-purple-700 px-6 py-5 text-white">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold uppercase tracking-widest opacity-70">Secure Checkout</span>
            <button onClick={onClose} className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition text-sm">✕</button>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black">{plan.price}</span>
            <span className="text-sm opacity-70">{plan.period}</span>
          </div>
          <p className="text-xs opacity-60 mt-0.5">{plan.icon} {plan.name} Plan</p>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Card Number</label>
            <div className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-3 focus-within:ring-2 focus-within:ring-violet-300 focus-within:border-transparent transition">
              <CardNumberElement options={CARD_STYLE} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Expiry</label>
              <div className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-3 focus-within:ring-2 focus-within:ring-violet-300 focus-within:border-transparent transition">
                <CardExpiryElement options={CARD_STYLE} />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">CVC</label>
              <div className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-3 focus-within:ring-2 focus-within:ring-violet-300 focus-within:border-transparent transition">
                <CardCvcElement options={CARD_STYLE} />
              </div>
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-xl px-3 py-2">⚠️ {error}</p>
          )}

          <button
            onClick={handlePay}
            disabled={paying || !stripe}
            className="w-full py-3.5 rounded-xl text-white text-sm font-black bg-gradient-to-r from-violet-600 to-purple-700 hover:brightness-110 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-violet-200 mt-1"
          >
            {paying ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Processing…
              </span>
            ) : `Pay ${plan.price}`}
          </button>

          <div className="flex items-center justify-center gap-4 pt-1">
            <span className="text-[10px] text-gray-400 flex items-center gap-1">🔒 SSL Encrypted</span>
            <span className="text-[10px] text-gray-400 flex items-center gap-1">↩️ 7-day refund</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SubscriptionPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, subscribed, plan, subscribe } = useApp();
  const [loading, setLoading] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [modalPlan, setModalPlan] = useState<any>(null);

  const handleSubscribe = (planId: string) => {
    if (!user) { router.push('/login'); return; }
    const selected = PLANS.find(p => p.id === planId);
    setModalPlan(selected);
  };

  const handlePaymentSuccess = () => {
    subscribe(modalPlan.id);
    setModalPlan(null);
    setSuccess(true);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-violet-50 to-gray-50 flex items-center justify-center p-5">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-4xl mx-auto mb-6 shadow-2xl shadow-yellow-200">⭐</div>
          <h2 className="text-2xl font-black text-indigo-950 mb-2">Welcome to Premium!</h2>
          <p className="text-gray-500 text-sm mb-8 leading-relaxed">Your plan is now active. Dive into the full 198-question quiz and unlock your detailed report.</p>
          <div className="flex flex-col gap-3">
            <button onClick={() => router.push('/premium-quiz')} className="w-full bg-gradient-to-r from-yellow-500 to-yellow-700 text-white py-4 rounded-2xl font-black text-sm hover:brightness-110 transition shadow-lg">
              ⭐ Start Premium Quiz →
            </button>
            <Link href="/profile" className="text-sm text-violet-600 font-semibold hover:underline">Back to Profile</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50/60 to-gray-50 pb-16">
      <div className="max-w-2xl mx-auto px-5 pt-8">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-1.5 bg-violet-100 border border-violet-200 text-violet-700 px-4 py-1.5 rounded-full text-xs font-bold mb-4">
            💜 Unlock Your Full Potential
          </div>
          <h1 className="text-3xl font-black text-indigo-950 tracking-tight mb-3">
            Choose Your{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-purple-800">Journey</span>
          </h1>
          <p className="text-gray-500 text-sm max-w-sm mx-auto leading-relaxed">
            The free test gives you a glimpse. Premium reveals the full picture — 198 deep questions, personalized quotes, and a 30-day action plan.
          </p>
          {subscribed && (
            <div className="mt-4 inline-flex items-center gap-2 bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-300 px-4 py-2 rounded-full">
              <span className="text-yellow-600 font-black text-xs">⭐ ACTIVE:</span>
              <span className="text-yellow-800 font-bold text-xs capitalize">{plan} Plan</span>
            </div>
          )}
        </div>

        {/* Plans */}
        <div className="flex justify-center mb-10">
          {PLANS.map(p => {
            const isActive  = subscribed && plan === p.id;
            const isLoading = loading === p.id;
            return (
              <div
                key={p.id}
                className={`relative bg-white rounded-3xl p-6 border-2 transition-all duration-200 shadow-sm w-full max-w-sm
                  ${p.highlight ? 'border-yellow-400 shadow-yellow-100 shadow-lg scale-[1.02]' : p.borderClass}
                  ${isActive ? 'ring-2 ring-violet-400' : ''}`}
              >
                {p.badge && (
                  <div className={`absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap px-3 py-1 rounded-full text-[9px] font-black text-white
                    ${p.highlight ? 'bg-gradient-to-r from-yellow-500 to-yellow-700' : 'bg-gradient-to-r from-indigo-600 to-violet-700'}`}>
                    {p.badge}
                  </div>
                )}
                <div className="text-3xl mb-2">{p.icon}</div>
                <h3 className="text-lg font-black text-indigo-950 mb-0.5">{p.name}</h3>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-3xl font-black text-indigo-950">{p.price}</span>
                  <span className="text-xs text-gray-400 font-medium">{p.period}</span>
                </div>
                <ul className="space-y-2 mb-6">
                  {p.features.map((f, i) => (
                    <li key={i} className={`text-xs leading-snug ${f.startsWith('❌') ? 'text-gray-300' : 'text-gray-700'}`}>{f}</li>
                  ))}
                </ul>
                {isActive ? (
                  <div className="w-full py-3 rounded-xl text-center text-xs font-black text-violet-600 border-2 border-violet-200 bg-violet-50">✓ Current Plan</div>
                ) : (
                  <button
                    onClick={() => handleSubscribe(p.id)}
                    disabled={!!loading}
                    className={`w-full py-3 rounded-xl text-white text-xs font-black transition hover:brightness-110 hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm ${p.btnClass}`}
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                        </svg>
                        Processing…
                      </span>
                    ) : `Get ${p.name} →`}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Plan comparison table */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-8">
          <div className="px-6 pt-5 pb-3">
            <h2 className="text-base font-black text-indigo-950">Plan Comparison</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-6 py-3 text-xs font-bold text-gray-400 w-1/2">Feature</th>
                  {PLANS.map(p => (
                    <th key={p.id} className="px-3 py-3 text-center">
                      <span className="text-xs font-black text-indigo-950">{p.icon}</span>
                      <div className="text-[9px] font-bold text-gray-500">{p.name}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {COMPARE_ROWS.map((row, i) => (
                  <tr key={i} className="hover:bg-violet-50/40 transition">
                    <td className="px-6 py-2.5 text-xs text-gray-700">{row.label}</td>
                    <td className="px-3 py-2.5 text-center">{row.starter ? '✅' : '—'}</td>
                    <td className="px-3 py-2.5 text-center">{row.pro     ? '✅' : '—'}</td>
                    <td className="px-3 py-2.5 text-center">{row.elite   ? '✅' : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Trust badges */}
        <div className="grid grid-cols-3 gap-3 mb-8 text-center">
          {TRUST.map(item => (
            <div key={item.label} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="text-2xl mb-1">{item.icon}</div>
              <div className="text-xs font-bold text-indigo-950">{item.label}</div>
              <div className="text-[10px] text-gray-400 mt-0.5">{item.sub}</div>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-base font-black text-indigo-950 mb-4">Frequently Asked Questions</h2>
          {FAQ.map((f, i) => (
            <div key={i} className="py-3 border-b border-gray-100 last:border-0">
              <p className="text-sm font-bold text-indigo-950 mb-1">{f.q}</p>
              <p className="text-xs text-gray-500 leading-relaxed">{f.a}</p>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Link href="/profile" className="text-sm text-violet-600 font-semibold hover:underline">← Back to Profile</Link>
        </div>

        <p className="text-center text-[10px] text-gray-400 mt-8">{t('footer')}</p>
      </div>

      {modalPlan && (
        <PaymentModal
          plan={modalPlan}
          onClose={() => setModalPlan(null)}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}
