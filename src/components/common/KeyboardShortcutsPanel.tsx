import React from 'react';
import { useUIStore } from '../../store/uiStore';

const SHORTCUTS = [
  { category: 'Navigation', items: [
    { keys: ['Ctrl', 'Z'], label: 'Annuler' },
    { keys: ['Ctrl', 'Y'], label: 'Rétablir' },
    { keys: ['Ctrl', 'F'], label: 'Rechercher' },
    { keys: ['Ctrl', 'A'], label: 'Tout sélectionner' },
    { keys: ['Echap'], label: 'Désélectionner / Fermer' },
  ]},
  { category: 'Nœuds', items: [
    { keys: ['Tab'], label: 'Ajouter un nœud enfant' },
    { keys: ['Enter'], label: 'Modifier le nœud sélectionné' },
    { keys: ['Suppr'], label: 'Supprimer le nœud' },
    { keys: ['F'], label: 'Mode focus sur le nœud' },
    { keys: ['Ctrl', 'V'], label: 'Coller une image' },
  ]},
  { category: 'Canvas', items: [
    { keys: ['Molette'], label: 'Zoom avant / arrière' },
    { keys: ['Ctrl', '0'], label: 'Réinitialiser la vue' },
    { keys: ['Ctrl', 'Shift', 'F'], label: 'Ajuster à l\'écran' },
    { keys: ['Clic droit'], label: 'Menu contextuel' },
  ]},
  { category: 'Édition', items: [
    { keys: ['Double-clic'], label: 'Éditer le texte du nœud' },
    { keys: ['Enter (édition)'], label: 'Valider la saisie' },
    { keys: ['Shift', 'Enter'], label: 'Nouvelle ligne' },
    { keys: ['Echap (édition)'], label: 'Annuler la saisie' },
  ]},
];

export const KeyboardShortcutsPanel: React.FC = () => {
  const showKeyboardShortcuts = useUIStore(s => s.showKeyboardShortcuts);
  const setShowKeyboardShortcuts = useUIStore(s => s.setShowKeyboardShortcuts);

  if (!showKeyboardShortcuts) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={() => setShowKeyboardShortcuts(false)}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200 }}
      />
      {/* Panel */}
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 201,
        background: '#fff',
        borderRadius: 16,
        boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
        padding: '28px 32px',
        width: 560,
        maxWidth: '95vw',
        maxHeight: '80vh',
        overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#2D3436' }}>Raccourcis clavier</h2>
          <button
            onClick={() => setShowKeyboardShortcuts(false)}
            style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#636E72', padding: 4 }}
            aria-label="Fermer"
          >×</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {SHORTCUTS.map(section => (
            <div key={section.category}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#b2bec3', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
                {section.category}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {section.items.map(item => (
                  <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13, color: '#2D3436' }}>{item.label}</span>
                    <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                      {item.keys.map((k, i) => (
                        <kbd key={i} style={{
                          background: '#F8F9FA', border: '1px solid #DFE6E9',
                          borderRadius: 4, padding: '2px 7px', fontSize: 11,
                          fontFamily: 'monospace', color: '#2D3436', fontWeight: 600,
                          boxShadow: '0 1px 0 #DFE6E9',
                        }}>{k}</kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};
