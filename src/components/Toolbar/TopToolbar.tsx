import React, { useState } from 'react';
import { useMapStore } from '../../store/mapStore';
import { useUIStore } from '../../store/uiStore';
import type { ActivePanel } from '../../store/uiStore';
import { ALPHA_COLORS } from '../../utils/colors';

export const TopToolbar: React.FC = () => {
  const maps = useMapStore(s => s.maps);
  const activeMapId = useMapStore(s => s.activeMapId);
  const renameMap = useMapStore(s => s.renameMap);
  const undo = useMapStore(s => s.undo);
  const redo = useMapStore(s => s.redo);

  const { view, setView, activePanel, setActivePanel, showMinimap, toggleMinimap } = useUIStore();
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');

  const map = maps.find(m => m.id === activeMapId);

  const handleTitleClick = () => {
    if (!map) return;
    setTitleDraft(map.title);
    setEditingTitle(true);
  };

  const handleTitleBlur = () => {
    if (map && titleDraft.trim()) {
      renameMap(map.id, titleDraft.trim());
    }
    setEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleTitleBlur();
    if (e.key === 'Escape') setEditingTitle(false);
  };

  const tabs: { key: ActivePanel; label: string }[] = [
    { key: null, label: 'Build' },
    { key: 'personalize', label: 'Personalize' },
    { key: 'notes', label: 'Notes' },
  ];

  if (view === 'dashboard') {
    return (
      <div style={{
        height: 56,
        background: '#fff',
        borderBottom: '1px solid #DFE6E9',
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        gap: 16,
        zIndex: 50,
        position: 'relative',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}>
        <Logo />
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 13, color: '#636E72' }}>Alpha Mind Map</span>
      </div>
    );
  }

  return (
    <div style={{
      height: 56,
      background: '#fff',
      borderBottom: '1px solid #DFE6E9',
      display: 'flex',
      alignItems: 'center',
      padding: '0 16px',
      gap: 8,
      zIndex: 50,
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    }}>
      {/* Left: Logo + back + title */}
      <button
        onClick={() => setView('dashboard')}
        style={iconBtnStyle}
        title="Back to dashboard"
        aria-label="Back to dashboard"
      >
        ←
      </button>
      <Logo />

      <div style={{ width: 1, height: 28, background: '#DFE6E9', margin: '0 4px' }} />

      {editingTitle ? (
        <input
          autoFocus
          value={titleDraft}
          onChange={e => setTitleDraft(e.target.value)}
          onBlur={handleTitleBlur}
          onKeyDown={handleTitleKeyDown}
          style={{
            border: 'none',
            outline: '1px solid ' + ALPHA_COLORS.primary,
            borderRadius: 4,
            padding: '3px 8px',
            fontSize: 14,
            fontWeight: 600,
            color: '#2D3436',
            minWidth: 160,
          }}
        />
      ) : (
        <button
          onClick={handleTitleClick}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'text',
            fontSize: 14,
            fontWeight: 600,
            color: '#2D3436',
            padding: '3px 8px',
            borderRadius: 4,
          }}
          title="Click to rename"
        >
          {map?.title || 'Untitled'}
        </button>
      )}

      {/* Center tabs */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: 4 }}>
        {tabs.map(tab => (
          <button
            key={String(tab.key)}
            onClick={() => setActivePanel(tab.key)}
            style={{
              background: activePanel === tab.key ? ALPHA_COLORS.primary : 'transparent',
              color: activePanel === tab.key ? '#fff' : '#636E72',
              border: 'none',
              borderRadius: 20,
              padding: '5px 16px',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 150ms',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Right: actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <button onClick={undo} style={iconBtnStyle} title="Undo (Ctrl+Z)" aria-label="Undo">
          ↩
        </button>
        <button onClick={redo} style={iconBtnStyle} title="Redo (Ctrl+Shift+Z)" aria-label="Redo">
          ↪
        </button>
        <button
          onClick={toggleMinimap}
          style={{ ...iconBtnStyle, color: showMinimap ? ALPHA_COLORS.primary : '#636E72' }}
          title="Toggle minimap"
          aria-label="Toggle minimap"
        >
          ⊟
        </button>

        <div style={{ width: 1, height: 28, background: '#DFE6E9', margin: '0 4px' }} />

        <button
          onClick={() => setActivePanel('share')}
          style={{
            background: ALPHA_COLORS.primary,
            color: '#fff',
            border: 'none',
            borderRadius: 20,
            padding: '6px 18px',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Share
        </button>
      </div>
    </div>
  );
};

const Logo: React.FC = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <circle cx="14" cy="14" r="14" fill="#6C5CE7" />
      <circle cx="14" cy="14" r="4" fill="white" />
      <line x1="14" y1="10" x2="7" y2="5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="14" y1="10" x2="21" y2="5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="14" y1="18" x2="7" y2="23" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="14" y1="18" x2="21" y2="23" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="10" y1="14" x2="4" y2="14" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="18" y1="14" x2="24" y2="14" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
    <span style={{ fontSize: 15, fontWeight: 700, color: '#2D3436', letterSpacing: '-0.3px' }}>
      Alpha Mind Map
    </span>
  </div>
);

const iconBtnStyle: React.CSSProperties = {
  width: 32,
  height: 32,
  background: 'none',
  border: '1px solid #DFE6E9',
  borderRadius: 6,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 16,
  color: '#636E72',
  transition: 'background 120ms',
};
