'use client';

import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { ReactNode } from 'react';

const stripePromise = loadStripe('pk_test_51SRynCPBwgTANTk6OM3ADMEkOYuyTGcfBfz92xAXVsLmm8O6tH7dCVgcwhG4rmi5OH3URGSa6faVFD2WYbI7E8oA00drLGc9l6');

export default function StripeProvider({ children }: { children: ReactNode }) {
  return <Elements stripe={stripePromise}>{children}</Elements>;
}