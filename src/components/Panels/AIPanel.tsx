import React, { useState } from 'react';
import { useUIStore } from '../../store/uiStore';
import { useMapStore } from '../../store/mapStore';
import { getAISettings, summarizeMap } from '../../utils/aiService';

export const AIPanel: React.FC = () => {
  const activePanel = useUIStore(s => s.activePanel);
  const setActivePanel = useUIStore(s => s.setActivePanel);
  const maps = useMapStore(s => s.maps);
  const activeMapId = useMapStore(s => s.activeMapId);

  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (activePanel !== 'ai') return null;

  const map = maps.find(m => m.id === activeMapId);

  const handleSummarize = async () => {
    if (!map) return;
    const settings = getAISettings();
    if (!settings.enabled) {
      setError("IA non activée. Configurez l'IA dans Paramètres > IA.");
      return;
    }
    setLoading(true);
    setError(null);
    setSummary(null);
    try {
      const result = await summarizeMap(map.nodes, map.rootNodeIds, settings.geminiApiKey, settings.model, settings.language);
      setSummary(result);
    } catch (e: unknown) {
      setError((e as Error).message || 'Erreur lors de la génération du résumé.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 56,
      right: 0,
      width: 320,
      height: 'calc(100vh - 56px)',
      background: '#fff',
      borderLeft: '1px solid #DFE6E9',
      zIndex: 90,
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '-4px 0 16px rgba(0,0,0,0.06)',
    }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #F0F0F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#2D3436' }}>
          ✨ Intelligence Artificielle
        </h3>
        <button
          onClick={() => setActivePanel(null)}
          style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#636E72', padding: 4 }}
          aria-label="Fermer"
        >×</button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Summary section */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#2D3436', marginBottom: 8 }}>
            Résumé de la map
          </div>
          <p style={{ fontSize: 12, color: '#636E72', margin: '0 0 12px', lineHeight: 1.5 }}>
            Génère un résumé intelligent de toute la carte mentale en analysant la structure et le contenu des nœuds.
          </p>
          <button
            onClick={handleSummarize}
            disabled={loading}
            style={{
              width: '100%',
              padding: '10px 16px',
              background: loading ? '#F8F9FA' : '#6C5CE7',
              color: loading ? '#636E72' : '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 150ms',
            }}
          >
            {loading ? '⟳ Génération en cours…' : '✨ Générer le résumé'}
          </button>
        </div>

        {error && (
          <div style={{ background: '#FFF5F5', border: '1px solid #FFD7D7', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#E17055' }}>
            {error}
          </div>
        )}

        {summary && (
          <div style={{ background: '#F8F6FF', border: '1px solid #E0D9FF', borderRadius: 8, padding: '14px 16px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#6C5CE7', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
              Résumé
            </div>
            <p style={{ margin: 0, fontSize: 13, color: '#2D3436', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{summary}</p>
            <button
              onClick={() => { navigator.clipboard.writeText(summary); }}
              style={{ marginTop: 12, background: 'none', border: '1px solid #DFE6E9', borderRadius: 6, padding: '5px 12px', fontSize: 12, cursor: 'pointer', color: '#636E72' }}
            >
              Copier
            </button>
          </div>
        )}

        {/* Tip */}
        <div style={{ background: '#F8F9FA', borderRadius: 8, padding: '12px 14px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#b2bec3', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Astuce</div>
          <p style={{ margin: 0, fontSize: 12, color: '#636E72', lineHeight: 1.5 }}>
            Utilisez le clic droit sur un nœud pour générer des branches IA ou améliorer son texte.
          </p>
        </div>
      </div>
    </div>
  );
};
