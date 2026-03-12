import React, { useEffect, useRef, useState } from 'react';
import { useMapStore } from '../../store/mapStore';
import { useUIStore } from '../../store/uiStore';
import { ALPHA_COLORS } from '../../utils/colors';

export const SearchBar: React.FC = () => {
  const searchOpen = useUIStore(s => s.searchOpen);
  const searchQuery = useUIStore(s => s.searchQuery);
  const searchResults = useUIStore(s => s.searchResults);
  const setSearch = useUIStore(s => s.setSearch);
  const setSearchResults = useUIStore(s => s.setSearchResults);
  const setSearchOpen = useUIStore(s => s.setSearchOpen);
  const setSelectedNode = useUIStore(s => s.setSelectedNode);

  const maps = useMapStore(s => s.maps);
  const activeMapId = useMapStore(s => s.activeMapId);

  const inputRef = useRef<HTMLInputElement>(null);
  const [resultIdx, setResultIdx] = useState(0);

  useEffect(() => {
    if (searchOpen && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [searchOpen]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && searchOpen) {
        setSearchOpen(false);
        setSearch('');
        setSearchResults([]);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [searchOpen, setSearchOpen, setSearch, setSearchResults]);

  const handleSearch = (q: string) => {
    setSearch(q);
    setResultIdx(0);
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
    const map = maps.find(m => m.id === activeMapId);
    if (!map) return;
    const lower = q.toLowerCase();
    const matches = Object.values(map.nodes)
      .filter(n => n.content.text.toLowerCase().includes(lower) || n.content.note.toLowerCase().includes(lower))
      .map(n => n.id);
    setSearchResults(matches);
    if (matches.length > 0) setSelectedNode(matches[0]);
  };

  const navigate = (dir: 1 | -1) => {
    if (searchResults.length === 0) return;
    const newIdx = (resultIdx + dir + searchResults.length) % searchResults.length;
    setResultIdx(newIdx);
    setSelectedNode(searchResults[newIdx]);
  };

  if (!searchOpen) return null;

  return (
    <div
      className="panel-enter"
      style={{
        position: 'fixed',
        top: 68,
        right: 16,
        background: '#fff',
        border: '1px solid #DFE6E9',
        borderRadius: 10,
        boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
        padding: '8px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        zIndex: 45,
        minWidth: 280,
      }}
    >
      <span style={{ fontSize: 14, color: '#636E72' }}>🔍</span>
      <input
        ref={inputRef}
        value={searchQuery}
        onChange={e => handleSearch(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') navigate(e.shiftKey ? -1 : 1);
          e.stopPropagation();
        }}
        placeholder="Search nodes…"
        style={{
          border: 'none', outline: 'none', fontSize: 13,
          color: '#2D3436', flex: 1, background: 'none',
        }}
      />
      {searchResults.length > 0 && (
        <span style={{ fontSize: 11, color: '#636E72', whiteSpace: 'nowrap' }}>
          {resultIdx + 1}/{searchResults.length}
        </span>
      )}
      {searchQuery && searchResults.length === 0 && (
        <span style={{ fontSize: 11, color: '#E17055', whiteSpace: 'nowrap' }}>No match</span>
      )}
      <button
        onClick={() => navigate(-1)}
        style={{ ...navBtn, opacity: searchResults.length > 0 ? 1 : 0.3 }}
        title="Previous (Shift+Enter)"
        disabled={searchResults.length === 0}
      >↑</button>
      <button
        onClick={() => navigate(1)}
        style={{ ...navBtn, opacity: searchResults.length > 0 ? 1 : 0.3 }}
        title="Next (Enter)"
        disabled={searchResults.length === 0}
      >↓</button>
      <button
        onClick={() => { setSearchOpen(false); setSearch(''); setSearchResults([]); }}
        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#636E72', lineHeight: 1 }}
        title="Close (Esc)"
      >×</button>

      {/* Highlight bar */}
      {searchResults.length > 0 && (
        <div style={{
          position: 'absolute', bottom: -3, left: 12, right: 12, height: 2,
          background: ALPHA_COLORS.primary, borderRadius: 1,
          width: `${Math.round((resultIdx + 1) / searchResults.length * 100)}%`,
          transition: 'width 200ms',
        }} />
      )}
    </div>
  );
};

const navBtn: React.CSSProperties = {
  width: 22, height: 22, background: 'none', border: '1px solid #DFE6E9',
  borderRadius: 4, cursor: 'pointer', fontSize: 12, color: '#636E72',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};
