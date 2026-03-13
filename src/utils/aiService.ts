import type { MindMapNode } from '../types';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const AI_SETTINGS_KEY = 'alpha-mind-map-ai-settings';

export interface AISettings {
  apiKey: string;
  enabled: boolean;
  language: 'fr' | 'en' | 'es';
  model: string;
}

export function getAISettings(): AISettings {
  try {
    const raw = localStorage.getItem(AI_SETTINGS_KEY);
    if (!raw) return { apiKey: '', enabled: false, language: 'fr', model: 'claude-opus-4-5' };
    return JSON.parse(raw);
  } catch {
    return { apiKey: '', enabled: false, language: 'fr', model: 'claude-opus-4-5' };
  }
}

export function saveAISettings(settings: AISettings) {
  localStorage.setItem(AI_SETTINGS_KEY, JSON.stringify(settings));
}

async function callClaude(prompt: string, apiKey: string, model: string, maxTokens = 600): Promise<string> {
  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  return data.content?.[0]?.text ?? '';
}

// ── IA 1 — Generate branches ──────────────────────────────────────────────────

export async function generateBranches(
  nodeText: string,
  contextNodes: string[],
  apiKey: string,
  model: string,
  language: 'fr' | 'en' | 'es' = 'fr'
): Promise<string[]> {
  const langMap = { fr: 'en français', en: 'in English', es: 'en español' };
  const langInstr = langMap[language];
  const contextStr = contextNodes.slice(0, 10).join(', ');

  const prompt = `Tu es un assistant de mind mapping. Le nœud est "${nodeText}".
Contexte de la map : ${contextStr || 'aucun'}.
Génère exactement 5 sous-idées courtes et pertinentes pour développer ce nœud, ${langInstr}.
Réponds UNIQUEMENT en JSON valide, sans markdown : ["idée 1", "idée 2", "idée 3", "idée 4", "idée 5"]`;

  const text = await callClaude(prompt, apiKey, model, 300);
  const match = text.match(/\[[\s\S]*?\]/);
  if (!match) throw new Error('Format de réponse invalide');
  const parsed = JSON.parse(match[0]);
  if (!Array.isArray(parsed)) throw new Error('Réponse non tableau');
  return parsed.map(String).slice(0, 5);
}

// ── IA 2 — Summarize map ──────────────────────────────────────────────────────

export async function summarizeMap(
  nodes: Record<string, MindMapNode>,
  rootIds: string[],
  apiKey: string,
  model: string,
  language: 'fr' | 'en' | 'es' = 'fr'
): Promise<string> {
  const langMap = { fr: 'en français', en: 'in English', es: 'en español' };
  const langInstr = langMap[language];

  function buildOutline(nodeId: string, depth = 0): string {
    const node = nodes[nodeId];
    if (!node) return '';
    const indent = '  '.repeat(depth);
    const text = node.content.text || 'Sans titre';
    let out = `${indent}- ${text}\n`;
    if (!node.position.collapsed) {
      for (const cid of node.childrenIds) {
        out += buildOutline(cid, depth + 1);
      }
    }
    return out;
  }

  const outline = rootIds.map(id => buildOutline(id)).join('\n');

  const prompt = `Voici la structure d'une mind map :
${outline}

Génère un résumé structuré de cette mind map en 2-3 paragraphes, ${langInstr}.
Le résumé doit mettre en valeur les thèmes principaux et les liens entre les idées.
Réponds directement avec le texte du résumé, sans titres ni markdown.`;

  return callClaude(prompt, apiKey, model, 800);
}

// ── IA 3 — Improve node text ──────────────────────────────────────────────────

export async function improveNodeText(
  text: string,
  apiKey: string,
  model: string,
  language: 'fr' | 'en' | 'es' = 'fr'
): Promise<string[]> {
  const langMap = { fr: 'en français', en: 'in English', es: 'en español' };
  const langInstr = langMap[language];

  const prompt = `Reformule ce texte de nœud de mind map de 3 façons différentes : "${text}".
Chaque reformulation doit être courte (2-6 mots), claire et percutante, ${langInstr}.
Réponds UNIQUEMENT en JSON valide, sans markdown : ["option 1", "option 2", "option 3"]`;

  const out = await callClaude(prompt, apiKey, model, 200);
  const match = out.match(/\[[\s\S]*?\]/);
  if (!match) throw new Error('Format invalide');
  const parsed = JSON.parse(match[0]);
  return parsed.map(String).slice(0, 3);
}

// ── IA 4 — Generate full map from prompt ─────────────────────────────────────

export interface AIMapData {
  root: string;
  branches: { text: string; children: string[] }[];
}

export async function generateFullMap(
  topic: string,
  apiKey: string,
  model: string,
  language: 'fr' | 'en' | 'es' = 'fr'
): Promise<AIMapData> {
  const langMap = { fr: 'en français', en: 'in English', es: 'en español' };
  const langInstr = langMap[language];

  const prompt = `Génère une mind map complète sur le sujet : "${topic}", ${langInstr}.
Réponds UNIQUEMENT en JSON valide, sans markdown :
{
  "root": "titre central court",
  "branches": [
    {
      "text": "branche 1",
      "children": ["sous-idée 1", "sous-idée 2", "sous-idée 3"]
    }
  ]
}
Génère 4 à 6 branches principales avec 2 à 4 sous-idées chacune. Toutes les idées en ${langInstr}.`;

  const out = await callClaude(prompt, apiKey, model, 1000);
  const match = out.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('Format invalide');
  const parsed: AIMapData = JSON.parse(match[0]);
  if (!parsed.root || !Array.isArray(parsed.branches)) throw new Error('Structure invalide');
  return parsed;
}
