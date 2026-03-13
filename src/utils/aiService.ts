import type { MindMapNode } from '../types';
import { callGemini, DEFAULT_GEMINI_MODEL } from '../lib/gemini';

const AI_SETTINGS_KEY = 'alpha-mind-map-ai-settings-v2';

export interface AISettings {
  geminiApiKey: string;   // optional — empty = use shared VITE_GEMINI_API_KEY
  enabled: boolean;
  language: 'fr' | 'en' | 'es';
  model: string;
}

export function getAISettings(): AISettings {
  try {
    const raw = localStorage.getItem(AI_SETTINGS_KEY);
    if (!raw) return { geminiApiKey: '', enabled: true, language: 'fr', model: DEFAULT_GEMINI_MODEL };
    const parsed = JSON.parse(raw) as Partial<AISettings>;
    return {
      geminiApiKey: parsed.geminiApiKey ?? '',
      enabled: parsed.enabled ?? true,
      language: parsed.language ?? 'fr',
      model: parsed.model ?? DEFAULT_GEMINI_MODEL,
    };
  } catch {
    return { geminiApiKey: '', enabled: true, language: 'fr', model: DEFAULT_GEMINI_MODEL };
  }
}

export function saveAISettings(settings: AISettings) {
  localStorage.setItem(AI_SETTINGS_KEY, JSON.stringify(settings));
}

// ── IA 1 — Generate branches ──────────────────────────────────────────────────

export async function generateBranches(
  nodeText: string,
  contextNodes: string[],
  geminiApiKey: string,
  model: string,
  language: 'fr' | 'en' | 'es' = 'fr',
): Promise<string[]> {
  const langMap = { fr: 'en français', en: 'in English', es: 'en español' };
  const langInstr = langMap[language];
  const contextStr = contextNodes.slice(0, 10).join(', ');

  const prompt = `Tu es un assistant de mind mapping expert.
Le nœud actuel est : "${nodeText}"
Le contexte de la mind map (nœuds parents et frères) : ${contextStr || 'aucun'}.
Génère exactement 5 sous-idées pertinentes et créatives pour développer ce nœud.
Chaque idée doit être courte (2-5 mots maximum), ${langInstr}.
Réponds UNIQUEMENT en JSON valide : {"ideas": ["idée 1", "idée 2", "idée 3", "idée 4", "idée 5"]}`;

  const text = await callGemini(prompt, geminiApiKey || undefined, model, 300, true);
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('Format de réponse invalide');
  const parsed = JSON.parse(match[0]);
  const ideas = parsed.ideas ?? parsed;
  if (!Array.isArray(ideas)) throw new Error('Réponse non tableau');
  return ideas.map(String).slice(0, 5);
}

// ── IA 2 — Summarize map ──────────────────────────────────────────────────────

export async function summarizeMap(
  nodes: Record<string, MindMapNode>,
  rootIds: string[],
  geminiApiKey: string,
  model: string,
  language: 'fr' | 'en' | 'es' = 'fr',
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
Réponds directement avec le texte du résumé (texte brut, pas de JSON, pas de markdown).`;

  return callGemini(prompt, geminiApiKey || undefined, model, 800, false);
}

// ── IA 3 — Improve node text ──────────────────────────────────────────────────

export async function improveNodeText(
  text: string,
  geminiApiKey: string,
  model: string,
  language: 'fr' | 'en' | 'es' = 'fr',
): Promise<string[]> {
  const langMap = { fr: 'en français', en: 'in English', es: 'en español' };
  const langInstr = langMap[language];

  const prompt = `Reformule ce texte de nœud de mind map de 3 façons différentes : "${text}".
Chaque reformulation doit être courte (2-6 mots), claire et percutante, ${langInstr}.
Réponds UNIQUEMENT en JSON valide : {"options": ["option 1", "option 2", "option 3"]}`;

  const out = await callGemini(prompt, geminiApiKey || undefined, model, 200, true);
  const match = out.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('Format invalide');
  const parsed = JSON.parse(match[0]);
  const options = parsed.options ?? parsed;
  if (!Array.isArray(options)) throw new Error('Format invalide');
  return options.map(String).slice(0, 3);
}

// ── IA 4 — Generate full map from prompt ─────────────────────────────────────

export interface AIMapData {
  root: string;
  branches: { text: string; children: string[] }[];
}

export async function generateFullMap(
  topic: string,
  geminiApiKey: string,
  model: string,
  language: 'fr' | 'en' | 'es' = 'fr',
): Promise<AIMapData> {
  const langMap = { fr: 'en français', en: 'in English', es: 'en español' };
  const langInstr = langMap[language];

  const prompt = `Génère une mind map complète sur le sujet : "${topic}", ${langInstr}.
La map doit avoir un nœud central et 4-6 branches principales, chacune avec 2-4 sous-idées.
Les textes doivent être courts (2-5 mots max par nœud).
Réponds UNIQUEMENT en JSON valide :
{
  "root": "titre central",
  "branches": [
    {
      "text": "branche 1",
      "children": ["sous-idée 1", "sous-idée 2", "sous-idée 3"]
    }
  ]
}`;

  const out = await callGemini(prompt, geminiApiKey || undefined, model, 1200, true);
  const match = out.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('Format invalide');
  const parsed: AIMapData = JSON.parse(match[0]);
  if (!parsed.root || !Array.isArray(parsed.branches)) throw new Error('Structure invalide');
  return parsed;
}
