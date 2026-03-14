import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMapStore } from '../../store/mapStore';
import { useUIStore } from '../../store/uiStore';
import type { ActivePanel } from '../../store/uiStore';
import { ALPHA_COLORS } from '../../utils/colors';
import { useBreakpoint } from '../../hooks/useBreakpoint';

export const TopToolbar: React.FC = () => {
  const navigate = useNavigate();
  const maps = useMapStore(s => s.maps);
  const activeMapId = useMapStore(s => s.activeMapId);
  const renameMap = useMapStore(s => s.renameMap);
  const undo = useMapStore(s => s.undo);
  const redo = useMapStore(s => s.redo);
  const addRootNode = useMapStore(s => s.addRootNode);

  const { activePanel, setActivePanel, showMinimap, toggleMinimap, saveStatus, searchOpen, setSearchOpen, showKeyboardShortcuts, setShowKeyboardShortcuts, showMapStats, setShowMapStats } = useUIStore();
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const { isMobile, isTablet } = useBreakpoint();

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
    { key: 'personalize', label: 'Personnaliser' },
    { key: 'notes', label: 'Notes' },
    { key: 'ai', label: '✨ IA' },
  ];

  // Mobile bottom sheet menu
  const MobileMenu = () => (
    menuOpen ? (
      <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
        {/* Backdrop */}
        <div
          onClick={() => setMenuOpen(false)}
          style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }}
        />
        {/* Sheet */}
        <div
          style={{
            position: 'relative', background: '#fff',
            borderRadius: '16px 16px 0 0',
            boxShadow: '0 -4px 32px rgba(0,0,0,0.18)',
            paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))',
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Handle */}
          <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 8px' }}>
            <div style={{ width: 40, height: 4, borderRadius: 2, background: '#DFE6E9' }} />
          </div>
          {/* Tabs as menu items */}
          {tabs.map(tab => (
            <button
              key={String(tab.key)}
              onClick={() => { setActivePanel(tab.key); setMenuOpen(false); }}
              style={{
                width: '100%', background: activePanel === tab.key ? ALPHA_COLORS.primary + '15' : 'transparent',
                border: 'none', padding: '14px 24px', fontSize: 15,
                fontWeight: activePanel === tab.key ? 700 : 400,
                color: activePanel === tab.key ? ALPHA_COLORS.primary : '#2D3436',
                cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12,
                minHeight: 52,
              }}
            >
              {tab.label}
            </button>
          ))}
          <div style={{ height: 1, background: '#DFE6E9', margin: '4px 0' }} />
          {/* Share */}
          <button
            onClick={() => { setActivePanel('share'); setMenuOpen(false); }}
            style={{ width: '100%', background: 'transparent', border: 'none', padding: '14px 24px', fontSize: 15, fontWeight: activePanel === 'share' ? 700 : 400, color: activePanel === 'share' ? ALPHA_COLORS.primary : '#2D3436', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12, minHeight: 52 }}
          >
            Partager
          </button>
          {/* Export */}
          <button
            onClick={() => { setActivePanel('export'); setMenuOpen(false); }}
            style={{ width: '100%', background: 'transparent', border: 'none', padding: '14px 24px', fontSize: 15, fontWeight: activePanel === 'export' ? 700 : 400, color: activePanel === 'export' ? ALPHA_COLORS.primary : '#2D3436', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12, minHeight: 52 }}
          >
            Export / Import
          </button>
          <div style={{ height: 1, background: '#DFE6E9', margin: '4px 0' }} />
          {/* Undo / Redo */}
          <div style={{ display: 'flex', padding: '8px 16px', gap: 8 }}>
            <button onClick={() => { undo(); setMenuOpen(false); }} style={{ ...touchBtnStyle, flex: 1, fontSize: 20 }} aria-label="Annuler">↩ Annuler</button>
            <button onClick={() => { redo(); setMenuOpen(false); }} style={{ ...touchBtnStyle, flex: 1, fontSize: 20 }} aria-label="Rétablir">↪ Rétablir</button>
          </div>
        </div>
      </div>
    ) : null
  );

  if (isMobile) {
    return (
      <>
        <div style={{
          height: 56, background: '#fff', borderBottom: '1px solid #DFE6E9',
          display: 'flex', alignItems: 'center', padding: '0 12px', gap: 8,
          zIndex: 50, position: 'fixed', top: 0, left: 0, right: 0,
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        }}>
          {/* Back button */}
          <button
            onClick={() => navigate('/dashboard')}
            style={iconBtnStyle}
            title="Retour au dashboard"
            aria-label="Retour au dashboard"
          >←</button>

          {/* Logo (compact) */}
          <svg width="28" height="28" viewBox="0 0 100 100" fill="none" style={{ flexShrink: 0 }}>
            <circle cx="50" cy="50" r="50" fill="#7C5CE7" />
            <polygon points="50,3 90.7,73.5 9.3,73.5" fill="white" opacity="0.18" clipPath="url(#logo-clip-m)" />
            <defs><clipPath id="logo-clip-m"><circle cx="50" cy="50" r="50" /></clipPath></defs>
            <line x1="50" y1="3" x2="90.7" y2="73.5" stroke="white" strokeWidth="4" strokeLinecap="round" clipPath="url(#logo-clip-m)" />
            <line x1="90.7" y1="26.5" x2="50" y2="97" stroke="white" strokeWidth="4" strokeLinecap="round" clipPath="url(#logo-clip-m)" />
            <line x1="90.7" y1="73.5" x2="9.3" y2="73.5" stroke="white" strokeWidth="4" strokeLinecap="round" clipPath="url(#logo-clip-m)" />
            <line x1="50" y1="97" x2="9.3" y2="26.5" stroke="white" strokeWidth="4" strokeLinecap="round" clipPath="url(#logo-clip-m)" />
            <line x1="9.3" y1="73.5" x2="50" y2="3" stroke="white" strokeWidth="4" strokeLinecap="round" clipPath="url(#logo-clip-m)" />
            <line x1="9.3" y1="26.5" x2="90.7" y2="26.5" stroke="white" strokeWidth="4" strokeLinecap="round" clipPath="url(#logo-clip-m)" />
          </svg>

          {/* Title (truncated) */}
          {editingTitle ? (
            <input
              autoFocus
              value={titleDraft}
              onChange={e => setTitleDraft(e.target.value)}
              onBlur={handleTitleBlur}
              onKeyDown={handleTitleKeyDown}
              style={{
                flex: 1, border: 'none', outline: '1px solid ' + ALPHA_COLORS.primary,
                borderRadius: 4, padding: '3px 8px', fontSize: 14, fontWeight: 600,
                color: '#2D3436', minWidth: 0,
              }}
            />
          ) : (
            <button
              onClick={handleTitleClick}
              style={{
                flex: 1, background: 'none', border: 'none', cursor: 'text',
                fontSize: 14, fontWeight: 600, color: '#2D3436', padding: '3px 8px',
                borderRadius: 4, textAlign: 'left', overflow: 'hidden',
                textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}
              title="Cliquer pour renommer"
            >
              {map?.title || 'Untitled'}
            </button>
          )}

          {/* Hamburger */}
          <button
            onClick={() => setMenuOpen(true)}
            style={{ ...iconBtnStyle, width: 44, height: 44, fontSize: 20 }}
            aria-label="Menu"
          >☰</button>
        </div>
        <MobileMenu />
      </>
    );
  }

  if (isTablet) {
    return (
      <div style={{
        height: 56, background: '#fff', borderBottom: '1px solid #DFE6E9',
        display: 'flex', alignItems: 'center', padding: '0 12px', gap: 6,
        zIndex: 50, position: 'fixed', top: 0, left: 0, right: 0,
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}>
        <button onClick={() => navigate('/dashboard')} style={iconBtnStyle} title="Retour au dashboard" aria-label="Retour au dashboard">←</button>
        <Logo />

        <div style={{ width: 1, height: 28, background: '#DFE6E9', margin: '0 2px' }} />

        {editingTitle ? (
          <input
            autoFocus
            value={titleDraft}
            onChange={e => setTitleDraft(e.target.value)}
            onBlur={handleTitleBlur}
            onKeyDown={handleTitleKeyDown}
            style={{
              border: 'none', outline: '1px solid ' + ALPHA_COLORS.primary,
              borderRadius: 4, padding: '3px 8px', fontSize: 13, fontWeight: 600,
              color: '#2D3436', width: 120,
            }}
          />
        ) : (
          <button
            onClick={handleTitleClick}
            style={{
              background: 'none', border: 'none', cursor: 'text', fontSize: 13,
              fontWeight: 600, color: '#2D3436', padding: '3px 8px', borderRadius: 4,
              maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}
            title="Cliquer pour renommer"
          >
            {map?.title || 'Untitled'}
          </button>
        )}

        {/* Center tabs — icon-only (no text on tablet since no labels shown) */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: 4 }}>
          {tabs.map(tab => (
            <button
              key={String(tab.key)}
              onClick={() => setActivePanel(tab.key)}
              style={{
                background: activePanel === tab.key ? ALPHA_COLORS.primary : 'transparent',
                color: activePanel === tab.key ? '#fff' : '#636E72',
                border: 'none', borderRadius: 20, padding: '5px 12px',
                fontSize: 12, fontWeight: 500, cursor: 'pointer', transition: 'all 150ms',
                minHeight: 44, display: 'flex', alignItems: 'center',
              }}
            >{tab.label}</button>
          ))}
        </div>

        {/* Right actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button onClick={undo} style={iconBtnStyle} title="Annuler" aria-label="Annuler">↩</button>
          <button onClick={redo} style={iconBtnStyle} title="Rétablir" aria-label="Rétablir">↪</button>
          <button onClick={() => setActivePanel('export')} style={iconBtnStyle} title="Export">↑↓</button>
          <button
            onClick={() => setActivePanel('share')}
            style={{ background: ALPHA_COLORS.primary, color: '#fff', border: 'none', borderRadius: 20, padding: '6px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', minHeight: 44, display: 'flex', alignItems: 'center' }}
          >Partager</button>
        </div>
      </div>
    );
  }

  // Desktop
  return (
    <div style={{
      height: 56, background: '#fff', borderBottom: '1px solid #DFE6E9',
      display: 'flex', alignItems: 'center', padding: '0 16px', gap: 8,
      zIndex: 50, position: 'fixed', top: 0, left: 0, right: 0,
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    }}>
      {/* Left */}
      <button
        onClick={() => navigate('/dashboard')}
        style={iconBtnStyle}
        title="Retour au dashboard"
        aria-label="Retour au dashboard"
      >←</button>
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
          title="Cliquer pour renommer"
        >
          {map?.title || 'Untitled'}
        </button>
      )}

      {/* Save status */}
      <span style={{
        fontSize: 11,
        color: saveStatus === 'saved' ? '#00B894' : saveStatus === 'saving' ? '#FDCB6E' : '#636E72',
        marginLeft: 2,
        minWidth: 52,
      }}>
        {saveStatus === 'saved' ? '✓ Sauvegardé' : saveStatus === 'saving' ? '⟳ Sauvegarde…' : '● Non sauvegardé'}
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
        <button onClick={undo} style={iconBtnStyle} title="Annuler (Ctrl+Z)" aria-label="Annuler">↩</button>
        <button onClick={redo} style={iconBtnStyle} title="Rétablir (Ctrl+Y)" aria-label="Rétablir">↪</button>
        <button
          onClick={toggleMinimap}
          style={{ ...iconBtnStyle, color: showMinimap ? ALPHA_COLORS.primary : '#636E72' }}
          title="Minimap"
        >⊟</button>
        <button
          onClick={() => setSearchOpen(!searchOpen)}
          style={{ ...iconBtnStyle, color: searchOpen ? ALPHA_COLORS.primary : '#636E72' }}
          title="Rechercher (Ctrl+F)"
        >🔍</button>
        <button
          onClick={() => setShowMapStats(!showMapStats)}
          style={{ ...iconBtnStyle, color: showMapStats ? ALPHA_COLORS.primary : '#636E72' }}
          title="Statistiques de la map"
        >📊</button>
        <button
          onClick={() => setShowKeyboardShortcuts(!showKeyboardShortcuts)}
          style={{ ...iconBtnStyle, color: showKeyboardShortcuts ? ALPHA_COLORS.primary : '#636E72', fontSize: 14 }}
          title="Raccourcis clavier (?)"
        >?</button>

        <div style={{ width: 1, height: 28, background: '#DFE6E9', margin: '0 2px' }} />

        <button onClick={() => addRootNode()} style={iconBtnStyle} title="Ajouter nœud racine">⊕</button>
        <button onClick={() => setActivePanel('export')} style={iconBtnStyle} title="Exporter / Importer">↑↓</button>

        <div style={{ width: 1, height: 28, background: '#DFE6E9', margin: '0 2px' }} />

        <button
          onClick={() => setActivePanel('share')}
          style={{ background: ALPHA_COLORS.primary, color: '#fff', border: 'none', borderRadius: 20, padding: '6px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
        >Partager</button>
      </div>
    </div>
  );
};

const Logo: React.FC = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
    <svg width="34" height="34" viewBox="0 0 100 100" fill="none">
      <defs>
        <clipPath id="logo-clip">
          <circle cx="50" cy="50" r="50" />
        </clipPath>
      </defs>
      <circle cx="50" cy="50" r="50" fill="#7C5CE7" />
      <polygon points="50,3 90.7,73.5 9.3,73.5" fill="white" opacity="0.18" clipPath="url(#logo-clip)" />
      <line x1="50" y1="3" x2="90.7" y2="73.5" stroke="white" strokeWidth="4" strokeLinecap="round" clipPath="url(#logo-clip)" />
      <line x1="90.7" y1="26.5" x2="50" y2="97" stroke="white" strokeWidth="4" strokeLinecap="round" clipPath="url(#logo-clip)" />
      <line x1="90.7" y1="73.5" x2="9.3" y2="73.5" stroke="white" strokeWidth="4" strokeLinecap="round" clipPath="url(#logo-clip)" />
      <line x1="50" y1="97" x2="9.3" y2="26.5" stroke="white" strokeWidth="4" strokeLinecap="round" clipPath="url(#logo-clip)" />
      <line x1="9.3" y1="73.5" x2="50" y2="3" stroke="white" strokeWidth="4" strokeLinecap="round" clipPath="url(#logo-clip)" />
      <line x1="9.3" y1="26.5" x2="90.7" y2="26.5" stroke="white" strokeWidth="4" strokeLinecap="round" clipPath="url(#logo-clip)" />
    </svg>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 0, lineHeight: 1 }}>
      <span style={{ fontSize: 16, fontWeight: 900, color: '#111', fontFamily: '"Arial Black", "Helvetica Neue", Arial, sans-serif', letterSpacing: '0.5px' }}>ALPHA&nbsp;</span>
      <span style={{ fontSize: 16, fontWeight: 900, color: '#7C5CE7', fontFamily: '"Arial Black", "Helvetica Neue", Arial, sans-serif', letterSpacing: '0.5px' }}>MIND&nbsp;</span>
      <span style={{ fontSize: 16, fontWeight: 900, color: '#111', fontFamily: '"Arial Black", "Helvetica Neue", Arial, sans-serif', letterSpacing: '0.5px' }}>MAP</span>
    </div>
  </div>
);

const iconBtnStyle: React.CSSProperties = {
  width: 44, height: 44, background: 'none', border: '1px solid #DFE6E9',
  borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center',
  justifyContent: 'center', fontSize: 16, color: '#636E72', transition: 'background 120ms',
};

const touchBtnStyle: React.CSSProperties = {
  minHeight: 44, background: '#F8F9FA', border: '1px solid #DFE6E9',
  borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center',
  justifyContent: 'center', gap: 6, fontSize: 14, color: '#2D3436', padding: '8px 16px',
};
