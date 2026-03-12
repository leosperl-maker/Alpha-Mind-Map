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
  const addRootNode = useMapStore(s => s.addRootNode);

  const { view, setView, activePanel, setActivePanel, showMinimap, toggleMinimap, saveStatus, searchOpen, setSearchOpen } = useUIStore();
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');

  const map = maps.find(m => m.id === activeMapId);

  const handleTitleClick = () => {
    if (!map) return;
    setTitleDraft(map.title);
    setEditingTitle(true);
  };

  const handleTitleBlur = () => {
    if (map && titleDraft.trim()) renameMap(map.id, titleDraft.trim());
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
        height: 56, background: '#fff', borderBottom: '1px solid #DFE6E9',
        display: 'flex', alignItems: 'center', padding: '0 20px', gap: 16,
        zIndex: 50, position: 'relative', boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}>
        <Logo />
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 13, color: '#636E72' }}>Alpha Mind Map</span>
      </div>
    );
  }

  return (
    <div style={{
      height: 56, background: '#fff', borderBottom: '1px solid #DFE6E9',
      display: 'flex', alignItems: 'center', padding: '0 16px', gap: 8,
      zIndex: 50, position: 'fixed', top: 0, left: 0, right: 0,
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    }}>
      {/* Left */}
      <button onClick={() => setView('dashboard')} style={iconBtnStyle} title="Back to dashboard" aria-label="Back to dashboard">←</button>
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
            border: 'none', outline: '1px solid ' + ALPHA_COLORS.primary,
            borderRadius: 4, padding: '3px 8px', fontSize: 14, fontWeight: 600,
            color: '#2D3436', minWidth: 160,
          }}
        />
      ) : (
        <button
          onClick={handleTitleClick}
          style={{ background: 'none', border: 'none', cursor: 'text', fontSize: 14, fontWeight: 600, color: '#2D3436', padding: '3px 8px', borderRadius: 4 }}
          title="Click to rename"
        >
          {map?.title || 'Untitled'}
        </button>
      )}

      {/* Save status */}
      <span style={{
        fontSize: 11,
        color: saveStatus === 'saved' ? '#00B894' : saveStatus === 'saving' ? '#FDCB6E' : '#636E72',
        marginLeft: 2,
        minWidth: 44,
      }}>
        {saveStatus === 'saved' ? '✓ Saved' : saveStatus === 'saving' ? '⟳ Saving' : '● Unsaved'}
      </span>

      {/* Center tabs */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: 4 }}>
        {tabs.map(tab => (
          <button
            key={String(tab.key)}
            onClick={() => setActivePanel(tab.key)}
            style={{
              background: activePanel === tab.key ? ALPHA_COLORS.primary : 'transparent',
              color: activePanel === tab.key ? '#fff' : '#636E72',
              border: 'none', borderRadius: 20, padding: '5px 16px',
              fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'all 150ms',
            }}
          >{tab.label}</button>
        ))}
      </div>

      {/* Right actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <button onClick={undo} style={iconBtnStyle} title="Undo (Ctrl+Z)" aria-label="Undo">↩</button>
        <button onClick={redo} style={iconBtnStyle} title="Redo (Ctrl+Y)" aria-label="Redo">↪</button>
        <button
          onClick={toggleMinimap}
          style={{ ...iconBtnStyle, color: showMinimap ? ALPHA_COLORS.primary : '#636E72' }}
          title="Toggle minimap"
          aria-label="Toggle minimap"
        >⊟</button>
        <button
          onClick={() => setSearchOpen(!searchOpen)}
          style={{ ...iconBtnStyle, color: searchOpen ? ALPHA_COLORS.primary : '#636E72' }}
          title="Search nodes (Ctrl+F)"
          aria-label="Search"
        >🔍</button>

        <div style={{ width: 1, height: 28, background: '#DFE6E9', margin: '0 2px' }} />

        <button
          onClick={() => addRootNode()}
          style={iconBtnStyle}
          title="Add new root topic"
          aria-label="Add root node"
        >⊕</button>
        <button
          onClick={() => setActivePanel('export')}
          style={iconBtnStyle}
          title="Export / Import"
          aria-label="Export / Import"
        >↑↓</button>

        <div style={{ width: 1, height: 28, background: '#DFE6E9', margin: '0 2px' }} />

        <button
          onClick={() => setActivePanel('share')}
          style={{
            background: ALPHA_COLORS.primary, color: '#fff', border: 'none',
            borderRadius: 20, padding: '6px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}
        >Share</button>
      </div>
    </div>
  );
};

const Logo: React.FC = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
    {/* Aperture icon — 6-blade camera iris with Alpha/A triangle highlight */}
    <svg width="34" height="34" viewBox="0 0 100 100" fill="none">
      <defs>
        <clipPath id="logo-clip">
          <circle cx="50" cy="50" r="50" />
        </clipPath>
      </defs>
      <circle cx="50" cy="50" r="50" fill="#7C5CE7" />
      {/* Upward inscribed triangle: subtle highlight for Alpha symbol */}
      <polygon points="50,3 90.7,73.5 9.3,73.5" fill="white" opacity="0.18" clipPath="url(#logo-clip)" />
      {/* 6 aperture blade chord lines */}
      <line x1="50" y1="3" x2="90.7" y2="73.5" stroke="white" strokeWidth="4" strokeLinecap="round" clipPath="url(#logo-clip)" />
      <line x1="90.7" y1="26.5" x2="50" y2="97" stroke="white" strokeWidth="4" strokeLinecap="round" clipPath="url(#logo-clip)" />
      <line x1="90.7" y1="73.5" x2="9.3" y2="73.5" stroke="white" strokeWidth="4" strokeLinecap="round" clipPath="url(#logo-clip)" />
      <line x1="50" y1="97" x2="9.3" y2="26.5" stroke="white" strokeWidth="4" strokeLinecap="round" clipPath="url(#logo-clip)" />
      <line x1="9.3" y1="73.5" x2="50" y2="3" stroke="white" strokeWidth="4" strokeLinecap="round" clipPath="url(#logo-clip)" />
      <line x1="9.3" y1="26.5" x2="90.7" y2="26.5" stroke="white" strokeWidth="4" strokeLinecap="round" clipPath="url(#logo-clip)" />
    </svg>
    {/* Brand text: ALPHA (black) MIND (purple) MAP (black) */}
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 0, lineHeight: 1 }}>
      <span style={{ fontSize: 16, fontWeight: 900, color: '#111', fontFamily: '"Arial Black", "Helvetica Neue", Arial, sans-serif', letterSpacing: '0.5px' }}>
        ALPHA&nbsp;
      </span>
      <span style={{ fontSize: 16, fontWeight: 900, color: '#7C5CE7', fontFamily: '"Arial Black", "Helvetica Neue", Arial, sans-serif', letterSpacing: '0.5px' }}>
        MIND&nbsp;
      </span>
      <span style={{ fontSize: 16, fontWeight: 900, color: '#111', fontFamily: '"Arial Black", "Helvetica Neue", Arial, sans-serif', letterSpacing: '0.5px' }}>
        MAP
      </span>
    </div>
  </div>
);

const iconBtnStyle: React.CSSProperties = {
  width: 32, height: 32, background: 'none', border: '1px solid #DFE6E9',
  borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center',
  justifyContent: 'center', fontSize: 16, color: '#636E72', transition: 'background 120ms',
};
