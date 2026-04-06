// src/lib/translate.ts

const GOOGLE_TRANSLATE_URL = 'https://translate.googleapis.com/translate_a/single';

export async function translateText(text: string, targetLang: 'en' | 'es', sourceLang = 'fr'): Promise<string> {
  if (!text?.trim()) return text;
  try {
    const url = `${GOOGLE_TRANSLATE_URL}?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Translate HTTP ${res.status}`);
    const data = await res.json();
    // Google returns [[["translated","original",...],...],...]
    const translated = data[0]?.map((chunk: any[]) => chunk[0]).join('') || text;
    return translated;
  } catch (err) {
    console.warn(`Translation failed for "${text.slice(0, 40)}…":`, err);
    return text; // fallback to original
  }
}

// Translate a batch with small delay to avoid rate limiting
export async function translateBatch(
  texts: string[],
  targetLang: 'en' | 'es',
  sourceLang = 'fr'
): Promise<string[]> {
  const results: string[] = [];
  for (const text of texts) {
    const translated = await translateText(text, targetLang, sourceLang);
    results.push(translated);
    await new Promise(r => setTimeout(r, 80)); // 80ms between calls
  }
  return results;
}