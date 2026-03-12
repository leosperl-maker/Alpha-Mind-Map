import React, { useState } from 'react';
import { useMapStore } from '../../store/mapStore';
import { useUIStore } from '../../store/uiStore';
import type { MindMap } from '../../types';
import { ALPHA_COLORS } from '../../utils/colors';

export const DashboardPage: React.FC = () => {
  const maps = useMapStore(s => s.maps);
  const createMap = useMapStore(s => s.createMap);
  const deleteMap = useMapStore(s => s.deleteMap);
  const duplicateMap = useMapStore(s => s.duplicateMap);
  const toggleStarMap = useMapStore(s => s.toggleStarMap);
  const renameMap = useMapStore(s => s.renameMap);
  const setActiveMap = useMapStore(s => s.setActiveMap);

  const { setView } = useUIStore();

  const [search, setSearch] = useState('');
  const [sidebarSection, setSidebarSection] = useState<'home' | 'recents' | 'starred' | 'trash'>('home');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState('');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  const filtered = maps.filter(m => {
    if (sidebarSection === 'starred') return m.isStarred;
    const q = search.toLowerCase();
    return !q || m.title.toLowerCase().includes(q);
  });

  const handleOpenMap = (map: MindMap) => {
    setActiveMap(map.id);
    setView('editor');
  };

  const handleNewMap = () => {
    const id = createMap('Untitled Map');
    setActiveMap(id);
    setView('editor');
  };

  const handleRenameStart = (map: MindMap, e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpenId(null);
    setRenamingId(map.id);
    setRenameDraft(map.title);
  };

  const handleRenameCommit = () => {
    if (renamingId && renameDraft.trim()) {
      renameMap(renamingId, renameDraft.trim());
    }
    setRenamingId(null);
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#F8F9FA' }} onClick={() => setMenuOpenId(null)}>
      {/* Sidebar */}
      <div style={{
        width: 220,
        background: '#fff',
        borderRight: '1px solid #DFE6E9',
        display: 'flex',
        flexDirection: 'column',
        padding: '0 0 16px',
        flexShrink: 0,
      }}>
        {/* Logo */}
        <div style={{ padding: '18px 20px 12px', borderBottom: '1px solid #DFE6E9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
              <circle cx="14" cy="14" r="14" fill="#6C5CE7" />
              <circle cx="14" cy="14" r="4" fill="white" />
              <line x1="14" y1="10" x2="7" y2="5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="14" y1="10" x2="21" y2="5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="14" y1="18" x2="7" y2="23" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="14" y1="18" x2="21" y2="23" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="10" y1="14" x2="4" y2="14" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="18" y1="14" x2="24" y2="14" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#2D3436' }}>Alpha Mind Map</span>
          </div>
        </div>

        {/* New map button */}
        <div style={{ padding: '12px 16px' }}>
          <button
            onClick={handleNewMap}
            style={{
              width: '100%',
              background: ALPHA_COLORS.primary,
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '9px 16px',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <span style={{ fontSize: 18, lineHeight: 1 }}>+</span>
            New Map
          </button>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '0 8px' }}>
          {[
            { key: 'home', label: 'All Maps', icon: '⊞' },
            { key: 'starred', label: 'Starred', icon: '★' },
            { key: 'recents', label: 'Recent', icon: '⏱' },
          ].map(item => (
            <button
              key={item.key}
              onClick={() => setSidebarSection(item.key as typeof sidebarSection)}
              style={{
                width: '100%',
                background: sidebarSection === item.key ? ALPHA_COLORS.primary + '15' : 'transparent',
                border: 'none',
                borderRadius: 6,
                padding: '8px 12px',
                fontSize: 13,
                color: sidebarSection === item.key ? ALPHA_COLORS.primary : '#636E72',
                fontWeight: sidebarSection === item.key ? 600 : 400,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                textAlign: 'left',
                transition: 'all 120ms',
              }}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div style={{ padding: '8px 16px', fontSize: 11, color: '#b2bec3', borderTop: '1px solid #DFE6E9' }}>
          {maps.length} map{maps.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{
          padding: '20px 28px 16px',
          borderBottom: '1px solid #DFE6E9',
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
        }}>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#2D3436' }}>
            {sidebarSection === 'starred' ? 'Starred' : sidebarSection === 'recents' ? 'Recent' : 'All Maps'}
          </h1>
          <div style={{ flex: 1 }} />
          <input
            type="text"
            placeholder="Search maps..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              padding: '7px 14px',
              border: '1px solid #DFE6E9',
              borderRadius: 8,
              fontSize: 13,
              outline: 'none',
              width: 220,
              color: '#2D3436',
            }}
          />
          <button
            onClick={handleNewMap}
            style={{
              background: ALPHA_COLORS.primary,
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '8px 18px',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            + New Map
          </button>
        </div>

        {/* Map list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 28px' }}>
          {filtered.length === 0 ? (
            <EmptyState onNew={handleNewMap} search={search} section={sidebarSection} />
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #DFE6E9' }}>
                  {['Name', 'Last Modified', 'Created', ''].map(h => (
                    <th key={h} style={{
                      padding: '8px 12px',
                      textAlign: 'left',
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#636E72',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(map => (
                  <tr
                    key={map.id}
                    onClick={() => handleOpenMap(map)}
                    style={{
                      borderBottom: '1px solid #F8F9FA',
                      cursor: 'pointer',
                      transition: 'background 100ms',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#F8F9FA')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '12px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 32,
                        height: 32,
                        borderRadius: 6,
                        background: ALPHA_COLORS.primary + '20',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 16,
                        flexShrink: 0,
                      }}>
                        🗺
                      </div>
                      {renamingId === map.id ? (
                        <input
                          autoFocus
                          value={renameDraft}
                          onChange={e => setRenameDraft(e.target.value)}
                          onBlur={handleRenameCommit}
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleRenameCommit();
                            if (e.key === 'Escape') setRenamingId(null);
                            e.stopPropagation();
                          }}
                          onClick={e => e.stopPropagation()}
                          style={{
                            border: '1px solid ' + ALPHA_COLORS.primary,
                            borderRadius: 4,
                            padding: '2px 6px',
                            fontSize: 14,
                            outline: 'none',
                          }}
                        />
                      ) : (
                        <span style={{ fontSize: 14, fontWeight: 500, color: '#2D3436' }}>
                          {map.title}
                        </span>
                      )}
                      {map.isStarred && <span style={{ fontSize: 14, color: '#FDCB6E' }}>★</span>}
                    </td>
                    <td style={{ padding: '12px', fontSize: 13, color: '#636E72' }}>
                      {formatDate(map.updatedAt)}
                    </td>
                    <td style={{ padding: '12px', fontSize: 13, color: '#636E72' }}>
                      {formatDate(map.createdAt)}
                    </td>
                    <td style={{ padding: '12px', width: 40 }}>
                      <div style={{ position: 'relative' }}>
                        <button
                          onClick={e => { e.stopPropagation(); setMenuOpenId(menuOpenId === map.id ? null : map.id); }}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '4px 8px',
                            borderRadius: 4,
                            fontSize: 18,
                            color: '#636E72',
                          }}
                          aria-label="Map options"
                        >
                          ⋯
                        </button>
                        {menuOpenId === map.id && (
                          <MapMenu
                            map={map}
                            onRename={e => handleRenameStart(map, e)}
                            onDuplicate={() => { duplicateMap(map.id); setMenuOpenId(null); }}
                            onStar={() => { toggleStarMap(map.id); setMenuOpenId(null); }}
                            onDelete={() => { deleteMap(map.id); setMenuOpenId(null); }}
                            onClose={() => setMenuOpenId(null)}
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

const MapMenu: React.FC<{
  map: MindMap;
  onRename: (e: React.MouseEvent) => void;
  onDuplicate: () => void;
  onStar: () => void;
  onDelete: () => void;
  onClose: () => void;
}> = ({ map, onRename, onDuplicate, onStar, onDelete }) => (
  <div
    className="panel-enter"
    style={{
      position: 'absolute',
      right: 0,
      top: '100%',
      background: '#fff',
      border: '1px solid #DFE6E9',
      borderRadius: 8,
      boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
      zIndex: 50,
      minWidth: 160,
      overflow: 'hidden',
    }}
    onClick={e => e.stopPropagation()}
  >
    {[
      { label: 'Rename', action: onRename, icon: '✏' },
      { label: 'Duplicate', action: onDuplicate, icon: '⧉' },
      { label: map.isStarred ? 'Unstar' : 'Star', action: onStar, icon: '★' },
    ].map(item => (
      <button
        key={item.label}
        onClick={item.action as () => void}
        style={menuItemStyle}
      >
        <span>{item.icon}</span> {item.label}
      </button>
    ))}
    <div style={{ borderTop: '1px solid #DFE6E9' }} />
    <button onClick={onDelete} style={{ ...menuItemStyle, color: '#E17055' }}>
      <span>🗑</span> Delete
    </button>
  </div>
);

const menuItemStyle: React.CSSProperties = {
  width: '100%',
  background: 'none',
  border: 'none',
  padding: '9px 14px',
  fontSize: 13,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  color: '#2D3436',
  textAlign: 'left',
};

const EmptyState: React.FC<{
  onNew: () => void;
  search: string;
  section: string;
}> = ({ onNew, search, section }) => (
  <div style={{ textAlign: 'center', padding: '60px 20px', color: '#b2bec3' }}>
    <div style={{ fontSize: 48, marginBottom: 16 }}>🗺</div>
    <div style={{ fontSize: 16, fontWeight: 600, color: '#636E72', marginBottom: 8 }}>
      {search ? 'No maps found' : section === 'starred' ? 'No starred maps' : 'No maps yet'}
    </div>
    <div style={{ fontSize: 13, marginBottom: 20 }}>
      {search ? 'Try a different search term.' : 'Create your first mind map to get started.'}
    </div>
    {!search && (
      <button
        onClick={onNew}
        style={{
          background: ALPHA_COLORS.primary,
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          padding: '10px 24px',
          fontSize: 14,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        + Create your first map
      </button>
    )}
  </div>
);

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString();
}
