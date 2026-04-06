import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { translateBatch } from '@/lib/translate';

interface QuizQuestionInput {
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

// Translate all text fields for one question into a target language
async function translateQuestion(q: QuizQuestionInput, targetLang: 'en' | 'es') {
  const texts = [q.question, q.reponse_a, q.reponse_b, q.reponse_c, q.reponse_d];
  const translated = await translateBatch(texts, targetLang, 'fr');
  return {
    question:  translated[0],
    reponse_a: translated[1],
    reponse_b: translated[2],
    reponse_c: translated[3],
    reponse_d: translated[4],
  };
}

export async function POST(req: NextRequest) {
  try {
    const { questions, quizType }: { questions: QuizQuestionInput[]; quizType: 'free' | 'premium' } = await req.json();

    if (!questions?.length) return NextResponse.json({ message: 'No questions provided' }, { status: 400 });
    if (!['free', 'premium'].includes(quizType)) return NextResponse.json({ message: 'Invalid quizType' }, { status: 400 });

    let inserted = 0;
    let skipped  = 0;
    const errors: string[] = [];

    console.log(`Translating ${questions.length} questions to EN and ES…`);

    for (const q of questions) {
      try {
        // Translate to both languages at import time
        const [enTranslation, esTranslation] = await Promise.all([
          translateQuestion(q, 'en'),
          translateQuestion(q, 'es'),
        ]);

        await prisma.quizQuestion.upsert({
          where: {
            quizType_question_id_langue: {
              quizType: quizType as any,
              question_id: q.question_id,
              langue: q.langue,
            },
          },
          update: {
            persona:                   q.persona,
            pilier_id:                 q.pilier_id,
            pilier_emoji:              q.pilier_emoji,
            pilier_nom:                q.pilier_nom,
            poids_pilier:              q.poids_pilier,
            pilier_description:        q.pilier_description,
            correspondance_label:      q.correspondance_label,
            correspondance_description: q.correspondance_description,
            question:                  q.question,
            poids_question:            q.poids_question,
            reponse_a:                 q.reponse_a,
            reponse_b:                 q.reponse_b,
            reponse_c:                 q.reponse_c,
            reponse_d:                 q.reponse_d,
            // EN
            question_en:  enTranslation.question,
            reponse_a_en: enTranslation.reponse_a,
            reponse_b_en: enTranslation.reponse_b,
            reponse_c_en: enTranslation.reponse_c,
            reponse_d_en: enTranslation.reponse_d,
            // ES
            question_es:  esTranslation.question,
            reponse_a_es: esTranslation.reponse_a,
            reponse_b_es: esTranslation.reponse_b,
            reponse_c_es: esTranslation.reponse_c,
            reponse_d_es: esTranslation.reponse_d,
          },
          create: {
            quizType:                  quizType as any,
            langue:                    q.langue,
            persona:                   q.persona,
            pilier_id:                 q.pilier_id,
            pilier_emoji:              q.pilier_emoji,
            pilier_nom:                q.pilier_nom,
            poids_pilier:              q.poids_pilier,
            pilier_description:        q.pilier_description,
            question_id:               q.question_id,
            correspondance_label:      q.correspondance_label,
            correspondance_description: q.correspondance_description,
            question:                  q.question,
            poids_question:            q.poids_question,
            reponse_a:                 q.reponse_a,
            reponse_b:                 q.reponse_b,
            reponse_c:                 q.reponse_c,
            reponse_d:                 q.reponse_d,
            question_en:  enTranslation.question,
            reponse_a_en: enTranslation.reponse_a,
            reponse_b_en: enTranslation.reponse_b,
            reponse_c_en: enTranslation.reponse_c,
            reponse_d_en: enTranslation.reponse_d,
            question_es:  esTranslation.question,
            reponse_a_es: esTranslation.reponse_a,
            reponse_b_es: esTranslation.reponse_b,
            reponse_c_es: esTranslation.reponse_c,
            reponse_d_es: esTranslation.reponse_d,
          },
        });
        inserted++;
      } catch (err: any) {
        skipped++;
        errors.push(`${q.question_id}: ${err.message}`);
      }
    }

    return NextResponse.json({ total: questions.length, inserted, skipped, errors: errors.slice(0, 20) });

  } catch (err: any) {
    return NextResponse.json({ message: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const pilier_id = searchParams.get('pilier_id');
    const persona   = searchParams.get('persona');
    const langue    = searchParams.get('langue') || 'FR';
    const quizType  = (searchParams.get('quizType') || 'free') as 'free' | 'premium';
    const lang      = (searchParams.get('lang') || 'fr') as 'fr' | 'en' | 'es'; // UI language

    const where: any = { langue, quizType };
    if (pilier_id) where.pilier_id = parseInt(pilier_id);
    if (persona)   where.persona = persona;

    const rows = await prisma.quizQuestion.findMany({
      where,
      orderBy: [{ pilier_id: 'asc' }, { question_id: 'asc' }],
    });

    // Return questions in the requested UI language
    const questions = rows.map(q => ({
      ...q,
      question:  lang === 'en' ? (q.question_en  || q.question)  : lang === 'es' ? (q.question_es  || q.question)  : q.question,
      reponse_a: lang === 'en' ? (q.reponse_a_en || q.reponse_a) : lang === 'es' ? (q.reponse_a_es || q.reponse_a) : q.reponse_a,
      reponse_b: lang === 'en' ? (q.reponse_b_en || q.reponse_b) : lang === 'es' ? (q.reponse_b_es || q.reponse_b) : q.reponse_b,
      reponse_c: lang === 'en' ? (q.reponse_c_en || q.reponse_c) : lang === 'es' ? (q.reponse_c_es || q.reponse_c) : q.reponse_c,
      reponse_d: lang === 'en' ? (q.reponse_d_en || q.reponse_d) : lang === 'es' ? (q.reponse_d_es || q.reponse_d) : q.reponse_d,
    }));

    return NextResponse.json({ questions, total: questions.length });
  } catch (err: any) {
    return NextResponse.json({ message: err.message || 'Internal server error' }, { status: 500 });
  }
}