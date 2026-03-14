// Gemini API client — used for all IA features in Alpha Mind Map
// Default key is hardcoded in config.ts (required for GitHub Pages where .env is not deployed).
// Users can supply their own key in Settings > IA to override it.

import { GEMINI_API_KEY } from './config';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
export const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';

export async function callGemini(
  prompt: string,
  userApiKey?: string,
  model = DEFAULT_GEMINI_MODEL,
  maxTokens = 1000,
  expectJson = true,
): Promise<string> {
  const key = userApiKey || GEMINI_API_KEY;
  if (!key) {
    throw new Error('Clé API Gemini manquante. Configurez votre clé dans Paramètres > IA.');
  }

  const generationConfig: Record<string, unknown> = {
    temperature: 0.7,
    maxOutputTokens: maxTokens,
  };
  if (expectJson) {
    generationConfig.responseMimeType = 'application/json';
  }

  const response = await fetch(
    `${GEMINI_API_URL}/${model}:generateContent?key=${key}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig,
      }),
    },
  );

  if (!response.ok) {
    const errText = await response.text().catch(() => response.statusText);
    let msg = `Erreur API Gemini ${response.status}`;
    try {
      const errJson = JSON.parse(errText);
      msg += ': ' + (errJson.error?.message || errText);
    } catch {
      msg += ': ' + errText;
    }
    throw new Error(msg);
  }

  const data = await response.json();
  const text: string | undefined = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Réponse Gemini vide ou invalide');
  return text;
}
