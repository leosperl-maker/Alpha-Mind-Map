import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMapStore } from '../../store/mapStore';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { useAuth } from '../../auth/AuthContext';
import type { MindMap } from '../../types';
import type { Workspace } from '../../store/workspaceStore';
import { ALPHA_COLORS } from '../../utils/colors';
import { AppLogo } from '../common/AppLogo';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { getAISettings, generateFullMap } from '../../utils/aiService';

type SidebarView = 'home' | 'starred' | 'recents' | 'trash' | string; // string = workspaceId

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { isMobile, isTablet } = useBreakpoint();

  const maps = useMapStore(s => s.maps);
  const createMap = useMapStore(s => s.createMap);
  const deleteMap = useMapStore(s => s.deleteMap);
  const duplicateMap = useMapStore(s => s.duplicateMap);
  const toggleStarMap = useMapStore(s => s.toggleStarMap);
  const renameMap = useMapStore(s => s.renameMap);
  const trashMap = useMapStore(s => s.trashMap);
  const restoreMap = useMapStore(s => s.restoreMap);
  const moveMapToWorkspace = useMapStore(s => s.moveMapToWorkspace);
  const updateMapFromAI = useMapStore(s => s.updateMapFromAI);

  const workspaces = useWorkspaceStore(s => s.workspaces);
  const activeWorkspaceId = useWorkspaceStore(s => s.activeWorkspaceId);
  const createWorkspace = useWorkspaceStore(s => s.createWorkspace);
  const updateWorkspace = useWorkspaceStore(s => s.updateWorkspace);
  const deleteWorkspace = useWorkspaceStore(s => s.deleteWorkspace);
  const setActiveWorkspace = useWorkspaceStore(s => s.setActiveWorkspace);

  const [sidebarView, setSidebarView] = useState<SidebarView>('home');
  const [search, setSearch] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState('');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [showNewWorkspaceModal, setShowNewWorkspaceModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [editingWorkspaceId, setEditingWorkspaceId] = useState<string | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiTopic, setAITopic] = useState('');
  const [aiLoading, setAILoading] = useState(false);
  const [aiError, setAIError] = useState('');

  // Map filtering
  const nonTrashed = maps.filter(m => !m.isTrashed);
  const trashed = maps.filter(m => m.isTrashed);

  const getFilteredMaps = (): MindMap[] => {
    const q = search.toLowerCase();
    let pool: MindMap[];
    if (sidebarView === 'trash') {
      pool = trashed;
    } else if (sidebarView === 'starred') {
      pool = nonTrashed.filter(m => m.isStarred);
    } else if (sidebarView === 'recents') {
      pool = [...nonTrashed].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 20);
    } else if (sidebarView === 'home') {
      pool = nonTrashed;
    } else {
      // workspace id
      pool = nonTrashed.filter(m => (m.workspaceId ?? 'personal') === sidebarView);
    }
    if (!q) return pool;
    return pool.filter(m => m.title.toLowerCase().includes(q));
  };

  const filtered = getFilteredMaps();

  const getSectionTitle = () => {
    if (sidebarView === 'home') return 'Toutes les maps';
    if (sidebarView === 'starred') return 'Favoris';
    if (sidebarView === 'recents') return 'Récentes';
    if (sidebarView === 'trash') return 'Corbeille';
    return workspaces.find(w => w.id === sidebarView)?.name ?? 'Espace';
  };

  const handleOpenMap = (map: MindMap) => {
    navigate(`/map/${map.id}`);
  };

  const handleNewMap = () => {
    const wsId = (sidebarView !== 'home' && sidebarView !== 'starred' && sidebarView !== 'recents' && sidebarView !== 'trash')
      ? sidebarView
      : (activeWorkspaceId || 'personal');
    const id = createMap('Untitled Map', wsId);
    navigate(`/map/${id}`);
  };

  const handleAICreateMap = async () => {
    if (!aiTopic.trim()) return;
    const settings = getAISettings();
    if (!settings.enabled) {
      setAIError("IA non activée. Configurez l'IA dans Paramètres > IA.");
      return;
    }
    setAILoading(true);
    setAIError('');
    try {
      const data = await generateFullMap(aiTopic.trim(), settings.geminiApiKey, settings.model, settings.language);
      const wsId = (sidebarView !== 'home' && sidebarView !== 'starred' && sidebarView !== 'recents' && sidebarView !== 'trash')
        ? sidebarView
        : (activeWorkspaceId || 'personal');
      const mapId = createMap(data.root || aiTopic.trim(), wsId);
      updateMapFromAI(mapId, data);
      setShowAIModal(false);
      setAITopic('');
      navigate(`/map/${mapId}`);
    } catch (e: unknown) {
      setAIError((e as Error).message || 'Erreur lors de la génération.');
    } finally {
      setAILoading(false);
    }
  };

  const handleSidebarSelect = (view: SidebarView) => {
    setSidebarView(view);
    setMobileSidebarOpen(false);
    if (typeof view === 'string' && view !== 'home' && view !== 'starred' && view !== 'recents' && view !== 'trash') {
      setActiveWorkspace(view);
    }
  };

  const handleSignOut = async () => {
    setShowUserMenu(false);
    await signOut();
    navigate('/login', { replace: true });
  };

  const initials = user?.fullName
    ? user.fullName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : (user?.email?.[0] ?? '?').toUpperCase();

  // Determine grid columns based on breakpoint
  const gridCols = isMobile
    ? '1fr'
    : isTablet
    ? 'repeat(2, 1fr)'
    : 'repeat(auto-fill, minmax(220px, 1fr))';

  const sidebarContent = (
    <>
      {/* Logo */}
      <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid #F0F0F0' }}>
        <AppLogo size="sm" />
      </div>

      {/* New map button */}
      <div style={{ padding: '12px 16px 8px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <button onClick={handleNewMap} style={newMapBtnStyle}>
          <span style={{ fontSize: 18, lineHeight: 1 }}>+</span>
          Nouvelle Map
        </button>
        <button
          onClick={() => setShowAIModal(true)}
          style={{ ...newMapBtnStyle, background: 'linear-gradient(135deg, #6C5CE7, #a29bfe)', color: '#fff', border: 'none' }}
        >
          <span style={{ fontSize: 16, lineHeight: 1 }}>✨</span>
          Créer avec l'IA
        </button>
      </div>

      {/* Primary nav */}
      <nav style={{ padding: '0 8px' }}>
        {[
          { key: 'home' as SidebarView, label: 'Dashboard', icon: '⊞' },
          { key: 'starred' as SidebarView, label: 'Favoris', icon: '★' },
          { key: 'recents' as SidebarView, label: 'Récentes', icon: '⏱' },
          { key: 'trash' as SidebarView, label: 'Corbeille', icon: '🗑' },
        ].map(item => (
          <NavItem
            key={item.key}
            label={item.label}
            icon={item.icon}
            active={sidebarView === item.key}
            onClick={() => handleSidebarSelect(item.key)}
          />
        ))}
      </nav>

      {/* Workspace divider */}
      <div style={{ padding: '12px 16px 4px', marginTop: 4 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#b2bec3', textTransform: 'uppercase', letterSpacing: 1 }}>
          Espaces
        </div>
      </div>

      {/* Workspace list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px' }}>
        {workspaces.map(ws => (
          <div key={ws.id} style={{ position: 'relative' }}>
            {editingWorkspaceId === ws.id ? (
              <WorkspaceRenameInput
                ws={ws}
                onSave={(name) => { updateWorkspace(ws.id, { name }); setEditingWorkspaceId(null); }}
                onCancel={() => setEditingWorkspaceId(null)}
              />
            ) : (
              <WorkspaceNavItem
                ws={ws}
                active={sidebarView === ws.id}
                onClick={() => handleSidebarSelect(ws.id)}
                mapCount={nonTrashed.filter(m => (m.workspaceId ?? 'personal') === ws.id).length}
                onRename={() => setEditingWorkspaceId(ws.id)}
                onDelete={() => {
                  if (workspaces.length <= 1) return;
                  if (confirm(`Supprimer "${ws.name}" ? Les maps seront déplacées vers Mon Espace.`)) {
                    nonTrashed.filter(m => m.workspaceId === ws.id).forEach(m => moveMapToWorkspace(m.id, 'personal'));
                    deleteWorkspace(ws.id);
                    if (sidebarView === ws.id) setSidebarView('home');
                  }
                }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Add workspace */}
      <div style={{ padding: '8px 16px' }}>
        <button
          onClick={() => setShowNewWorkspaceModal(true)}
          style={{ width: '100%', background: 'none', border: '1px dashed #DFE6E9', borderRadius: 8, padding: '7px 12px', fontSize: 12, color: '#636E72', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, minHeight: 44 }}
        >
          <span>＋</span> Nouvel espace
        </button>
      </div>

      {/* Footer: user + settings */}
      <div style={{ borderTop: '1px solid #DFE6E9', padding: '10px 12px', position: 'relative' }}>
        <button
          onClick={(e) => { e.stopPropagation(); setShowUserMenu(v => !v); }}
          style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, padding: '4px 4px', borderRadius: 8, transition: 'background 120ms', minHeight: 44 }}
          onMouseEnter={e => e.currentTarget.style.background = '#F8F9FA'}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}
        >
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: ALPHA_COLORS.primary + '25', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: ALPHA_COLORS.primary, flexShrink: 0 }}>
            {initials}
          </div>
          <div style={{ flex: 1, textAlign: 'left', overflow: 'hidden' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#2D3436', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.fullName || 'Utilisateur'}
            </div>
            <div style={{ fontSize: 11, color: '#636E72', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.email}
            </div>
          </div>
          <span style={{ fontSize: 12, color: '#b2bec3' }}>⋯</span>
        </button>

        {showUserMenu && (
          <div
            className="panel-enter"
            onClick={e => e.stopPropagation()}
            style={{ position: 'absolute', bottom: '110%', left: 12, right: 12, background: '#fff', border: '1px solid #DFE6E9', borderRadius: 10, boxShadow: '0 4px 20px rgba(0,0,0,0.12)', overflow: 'hidden', zIndex: 50 }}
          >
            <button onClick={() => { setShowUserMenu(false); navigate('/settings'); }} style={userMenuItemStyle}>⚙ Paramètres</button>
            <div style={{ borderTop: '1px solid #F0F0F0' }} />
            <button onClick={handleSignOut} style={{ ...userMenuItemStyle, color: '#E17055' }}>🚪 Déconnexion</button>
          </div>
        )}
      </div>
    </>
  );

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#F8F9FA' }} onClick={() => { setMenuOpenId(null); setShowUserMenu(false); }}>

      {/* ── SIDEBAR — desktop/tablet only ────────────────────────────────── */}
      {!isMobile && (
        <aside style={{
          width: 240, background: '#fff', borderRight: '1px solid #DFE6E9',
          display: 'flex', flexDirection: 'column', flexShrink: 0,
          overflow: 'hidden',
        }}>
          {sidebarContent}
        </aside>
      )}

      {/* ── MOBILE SIDEBAR OVERLAY ──────────────────────────────────────── */}
      {isMobile && mobileSidebarOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex' }}>
          {/* Backdrop */}
          <div
            onClick={() => setMobileSidebarOpen(false)}
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }}
          />
          {/* Drawer from bottom */}
          <div
            style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              background: '#fff', borderRadius: '16px 16px 0 0',
              maxHeight: '85vh', display: 'flex', flexDirection: 'column',
              boxShadow: '0 -4px 32px rgba(0,0,0,0.18)',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Handle */}
            <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
              <div style={{ width: 40, height: 4, borderRadius: 2, background: '#DFE6E9' }} />
            </div>
            {sidebarContent}
          </div>
        </div>
      )}

      {/* ── MAIN ────────────────────────────────────────────────────────── */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{
          padding: isMobile ? '12px 16px' : '20px 28px 16px',
          borderBottom: '1px solid #DFE6E9', background: '#fff',
          display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 16, flexShrink: 0,
        }}>
          {/* Hamburger on mobile */}
          {isMobile && (
            <button
              onClick={(e) => { e.stopPropagation(); setMobileSidebarOpen(true); }}
              style={{
                background: 'none', border: '1px solid #DFE6E9', borderRadius: 6,
                width: 44, height: 44, cursor: 'pointer', fontSize: 18, color: '#636E72',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}
              aria-label="Open menu"
            >☰</button>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ margin: 0, fontSize: isMobile ? 16 : 20, fontWeight: 700, color: '#2D3436', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{getSectionTitle()}</h1>
            {!isMobile && sidebarView !== 'home' && sidebarView !== 'starred' && sidebarView !== 'recents' && sidebarView !== 'trash' && (
              <p style={{ margin: '2px 0 0', fontSize: 13, color: '#636E72' }}>
                {workspaces.find(w => w.id === sidebarView)?.description}
              </p>
            )}
          </div>
          {!isMobile && (
            <input
              type="text"
              placeholder="Rechercher…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ padding: '8px 14px', border: '1px solid #DFE6E9', borderRadius: 8, fontSize: 13, outline: 'none', width: 220, color: '#2D3436' }}
            />
          )}
          {sidebarView !== 'trash' && (
            <button onClick={handleNewMap} style={{
              background: ALPHA_COLORS.primary, color: '#fff', border: 'none', borderRadius: 8,
              padding: isMobile ? '8px 12px' : '8px 18px',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
              minHeight: 44, whiteSpace: 'nowrap',
            }}>
              + {isMobile ? 'Nouveau' : 'Nouvelle Map'}
            </button>
          )}
        </div>

        {/* Search on mobile */}
        {isMobile && (
          <div style={{ padding: '8px 16px', background: '#fff', borderBottom: '1px solid #DFE6E9' }}>
            <input
              type="text"
              placeholder="Rechercher…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', padding: '8px 14px', border: '1px solid #DFE6E9', borderRadius: 8, fontSize: 13, outline: 'none', color: '#2D3436', boxSizing: 'border-box' }}
            />
          </div>
        )}

        {/* Map grid */}
        <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '16px' : '24px 28px' }} onClick={() => setMenuOpenId(null)}>
          {filtered.length === 0 ? (
            <EmptyState onNew={handleNewMap} search={search} view={sidebarView} />
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: gridCols,
              gap: isMobile ? 8 : 16,
            }}>
              {filtered.map(map => (
                <MapCard
                  key={map.id}
                  map={map}
                  workspaces={workspaces}
                  isMenuOpen={menuOpenId === map.id}
                  isRenaming={renamingId === map.id}
                  renameDraft={renameDraft}
                  isTrashed={sidebarView === 'trash'}
                  isMobile={isMobile}
                  onOpen={() => handleOpenMap(map)}
                  onMenuToggle={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === map.id ? null : map.id); }}
                  onMenuClose={() => setMenuOpenId(null)}
                  onRenameStart={() => { setMenuOpenId(null); setRenamingId(map.id); setRenameDraft(map.title); }}
                  onRenameChange={setRenameDraft}
                  onRenameCommit={() => { if (renameDraft.trim()) renameMap(map.id, renameDraft.trim()); setRenamingId(null); }}
                  onDuplicate={() => { duplicateMap(map.id); setMenuOpenId(null); }}
                  onStar={() => { toggleStarMap(map.id); setMenuOpenId(null); }}
                  onTrash={() => { trashMap(map.id); setMenuOpenId(null); }}
                  onRestore={() => { restoreMap(map.id); setMenuOpenId(null); }}
                  onDelete={() => { if (confirm('Supprimer définitivement cette map ?')) { deleteMap(map.id); setMenuOpenId(null); } }}
                  onMove={(wsId) => { moveMapToWorkspace(map.id, wsId); setMenuOpenId(null); }}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      {showNewWorkspaceModal && (
        <NewWorkspaceModal
          onClose={() => setShowNewWorkspaceModal(false)}
          onCreate={(name, color, icon, desc) => {
            const id = createWorkspace(name, color, icon, desc, user?.id ?? 'local');
            setSidebarView(id);
            setShowNewWorkspaceModal(false);
          }}
        />
      )}

      {/* AI Map Creation Modal */}
      {showAIModal && (
        <>
          <div
            onClick={() => { setShowAIModal(false); setAIError(''); }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 300 }}
          />
          <div style={{
            position: 'fixed', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 301, background: '#fff', borderRadius: 16,
            boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
            padding: '28px 32px', width: 480, maxWidth: '95vw',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#2D3436' }}>✨ Créer une map avec l'IA</h2>
              <button
                onClick={() => { setShowAIModal(false); setAIError(''); }}
                style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#636E72', padding: 4 }}
              >×</button>
            </div>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: '#636E72', lineHeight: 1.5 }}>
              Décrivez le sujet de votre mind map et l'IA la générera automatiquement.
            </p>
            <textarea
              value={aiTopic}
              onChange={e => setAITopic(e.target.value)}
              placeholder="Ex: Les étapes du développement d'une application mobile..."
              rows={3}
              style={{
                width: '100%', border: '1px solid #DFE6E9', borderRadius: 8,
                padding: '10px 14px', fontSize: 14, resize: 'vertical',
                fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
                marginBottom: 12,
              }}
              onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleAICreateMap(); }}
              autoFocus
            />
            {aiError && (
              <div style={{ background: '#FFF5F5', border: '1px solid #FFD7D7', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#E17055', marginBottom: 12 }}>
                {aiError}
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => { setShowAIModal(false); setAIError(''); }}
                style={{ padding: '9px 18px', background: '#F8F9FA', border: '1px solid #DFE6E9', borderRadius: 8, fontSize: 13, cursor: 'pointer', color: '#636E72' }}
              >Annuler</button>
              <button
                onClick={handleAICreateMap}
                disabled={aiLoading || !aiTopic.trim()}
                style={{
                  padding: '9px 20px',
                  background: aiLoading || !aiTopic.trim() ? '#F8F9FA' : 'linear-gradient(135deg, #6C5CE7, #a29bfe)',
                  color: aiLoading || !aiTopic.trim() ? '#b2bec3' : '#fff',
                  border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600,
                  cursor: aiLoading || !aiTopic.trim() ? 'not-allowed' : 'pointer',
                }}
              >
                {aiLoading ? '⟳ Génération…' : '✨ Générer la map'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// ── Nav item ─────────────────────────────────────────────────────────────────

const NavItem: React.FC<{ label: string; icon: string; active: boolean; onClick: () => void }> = ({ label, icon, active, onClick }) => (
  <button
    onClick={onClick}
    style={{
      width: '100%', background: active ? ALPHA_COLORS.primary + '15' : 'transparent',
      border: 'none', borderRadius: 6, padding: '7px 12px',
      fontSize: 13, color: active ? ALPHA_COLORS.primary : '#636E72',
      fontWeight: active ? 600 : 400, cursor: 'pointer',
      display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left', transition: 'all 120ms',
      minHeight: 44,
    }}
  >
    <span style={{ fontSize: 14 }}>{icon}</span>
    {label}
  </button>
);

// ── Workspace nav item ────────────────────────────────────────────────────────

const WorkspaceNavItem: React.FC<{
  ws: Workspace;
  active: boolean;
  mapCount: number;
  onClick: () => void;
  onRename: () => void;
  onDelete: () => void;
}> = ({ ws, active, mapCount, onClick, onRename, onDelete }) => {
  const [showMenu, setShowMenu] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={onClick}
        style={{
          width: '100%', background: active ? ALPHA_COLORS.primary + '12' : 'transparent',
          border: 'none', borderRadius: 6, padding: '6px 12px',
          fontSize: 13, color: active ? ALPHA_COLORS.primary : '#2D3436',
          fontWeight: active ? 600 : 400, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left', transition: 'all 120ms',
          minHeight: 44,
        }}
        onMouseEnter={e => { if (!active) e.currentTarget.style.background = '#F8F9FA'; }}
        onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
      >
        <span style={{ fontSize: 14 }}>{ws.icon}</span>
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ws.name}</span>
        <span style={{ fontSize: 11, color: '#b2bec3' }}>{mapCount}</span>
        <span
          onClick={e => { e.stopPropagation(); setShowMenu(v => !v); }}
          style={{ fontSize: 14, color: '#b2bec3', padding: '0 2px', lineHeight: 1 }}
        >⋯</span>
      </button>
      {showMenu && (
        <div
          className="panel-enter"
          onClick={e => e.stopPropagation()}
          style={{ position: 'absolute', right: 0, top: '100%', background: '#fff', border: '1px solid #DFE6E9', borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.1)', zIndex: 50, minWidth: 140, overflow: 'hidden' }}
        >
          <button onClick={() => { onRename(); setShowMenu(false); }} style={wsMenuItemStyle}>✏ Renommer</button>
          <button onClick={() => { onDelete(); setShowMenu(false); }} style={{ ...wsMenuItemStyle, color: '#E17055' }}>🗑 Supprimer</button>
        </div>
      )}
    </div>
  );
};

const WorkspaceRenameInput: React.FC<{ ws: Workspace; onSave: (name: string) => void; onCancel: () => void }> = ({ ws, onSave, onCancel }) => {
  const [draft, setDraft] = useState(ws.name);
  return (
    <input
      autoFocus
      value={draft}
      onChange={e => setDraft(e.target.value)}
      onBlur={() => onSave(draft.trim() || ws.name)}
      onKeyDown={e => { if (e.key === 'Enter') onSave(draft.trim() || ws.name); if (e.key === 'Escape') onCancel(); }}
      style={{ width: '100%', padding: '6px 12px', border: '1px solid ' + ALPHA_COLORS.primary, borderRadius: 6, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
    />
  );
};

// ── Map card ─────────────────────────────────────────────────────────────────

const MapCard: React.FC<{
  map: MindMap;
  workspaces: Workspace[];
  isMenuOpen: boolean;
  isRenaming: boolean;
  renameDraft: string;
  isTrashed: boolean;
  isMobile: boolean;
  onOpen: () => void;
  onMenuToggle: (e: React.MouseEvent) => void;
  onMenuClose: () => void;
  onRenameStart: () => void;
  onRenameChange: (v: string) => void;
  onRenameCommit: () => void;
  onDuplicate: () => void;
  onStar: () => void;
  onTrash: () => void;
  onRestore: () => void;
  onDelete: () => void;
  onMove: (wsId: string) => void;
}> = ({ map, workspaces, isMenuOpen, isRenaming, renameDraft, isTrashed, isMobile, onOpen, onMenuToggle, onMenuClose, onRenameStart, onRenameChange, onRenameCommit, onDuplicate, onStar, onTrash, onRestore, onDelete, onMove }) => {
  const nodeCount = Object.keys(map.nodes).length;
  const ws = workspaces.find(w => w.id === (map.workspaceId ?? 'personal'));

  const contextMenuContent = (
    <>
      {isTrashed ? (
        <>
          <button onClick={() => { onRestore(); onMenuClose(); }} style={cardMenuItemStyle}>↩ Restaurer</button>
          <div style={{ borderTop: '1px solid #DFE6E9' }} />
          <button onClick={onDelete} style={{ ...cardMenuItemStyle, color: '#E17055' }}>🗑 Supprimer définitivement</button>
        </>
      ) : (
        <>
          <button onClick={() => { onOpen(); onMenuClose(); }} style={cardMenuItemStyle}>↗ Ouvrir</button>
          <button onClick={() => { onRenameStart(); onMenuClose(); }} style={cardMenuItemStyle}>✏ Renommer</button>
          <button onClick={onDuplicate} style={cardMenuItemStyle}>⧉ Dupliquer</button>
          <button onClick={onStar} style={cardMenuItemStyle}>{map.isStarred ? '☆ Retirer des favoris' : '★ Ajouter aux favoris'}</button>
          {workspaces.length > 1 && (
            <>
              <div style={{ borderTop: '1px solid #DFE6E9', padding: '4px 12px', fontSize: 10, fontWeight: 700, color: '#b2bec3', textTransform: 'uppercase', letterSpacing: 0.8 }}>Déplacer vers</div>
              {workspaces.filter(w => w.id !== (map.workspaceId ?? 'personal')).map(w => (
                <button key={w.id} onClick={() => onMove(w.id)} style={cardMenuItemStyle}>{w.icon} {w.name}</button>
              ))}
            </>
          )}
          <div style={{ borderTop: '1px solid #DFE6E9' }} />
          <button onClick={onTrash} style={{ ...cardMenuItemStyle, color: '#E17055' }}>🗑 Mettre à la corbeille</button>
        </>
      )}
    </>
  );

  if (isMobile) {
    // Horizontal card layout for mobile
    return (
      <div
        onClick={isTrashed ? undefined : onOpen}
        style={{
          background: '#fff', border: '1px solid #DFE6E9', borderRadius: 10,
          overflow: 'hidden', cursor: isTrashed ? 'default' : 'pointer',
          display: 'flex', alignItems: 'center', height: 80,
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        }}
      >
        {/* Thumbnail */}
        <div style={{
          width: 80, height: 80, flexShrink: 0,
          background: 'linear-gradient(135deg, ' + (map.settings.themeColor || '#7C5CE7') + '15, ' + (map.settings.themeColor || '#7C5CE7') + '30)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <MapThumbnail map={map} small />
        </div>

        {/* Info */}
        <div style={{ flex: 1, padding: '0 12px', overflow: 'hidden' }}>
          {isRenaming ? (
            <input
              autoFocus
              value={renameDraft}
              onChange={e => onRenameChange(e.target.value)}
              onBlur={onRenameCommit}
              onKeyDown={e => { if (e.key === 'Enter') onRenameCommit(); if (e.key === 'Escape') onRenameCommit(); e.stopPropagation(); }}
              onClick={e => e.stopPropagation()}
              style={{ width: '100%', border: '1px solid ' + ALPHA_COLORS.primary, borderRadius: 4, padding: '2px 6px', fontSize: 13, fontWeight: 600, outline: 'none', boxSizing: 'border-box' }}
            />
          ) : (
            <div style={{ fontSize: 13, fontWeight: 600, color: '#2D3436', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {map.isStarred && <span style={{ color: '#FDCB6E', marginRight: 4 }}>★</span>}
              {map.title}
            </div>
          )}
          <div style={{ fontSize: 11, color: '#b2bec3', marginTop: 2 }}>
            {nodeCount} nœud{nodeCount !== 1 ? 's' : ''} · {formatDate(map.updatedAt)}
            {ws && <span> · {ws.icon}</span>}
          </div>
        </div>

        {/* Menu button */}
        <div style={{ padding: '0 8px', position: 'relative' }} onClick={e => e.stopPropagation()}>
          <button
            onClick={onMenuToggle}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '3px 8px', borderRadius: 4, fontSize: 18, color: '#636E72', minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            aria-label="Options"
          >⋯</button>

          {isMenuOpen && (
            <div
              className="panel-enter"
              onClick={e => e.stopPropagation()}
              style={{ position: 'absolute', right: 0, bottom: '100%', background: '#fff', border: '1px solid #DFE6E9', borderRadius: 10, boxShadow: '0 4px 20px rgba(0,0,0,0.12)', zIndex: 60, minWidth: 180, overflow: 'hidden' }}
            >
              {contextMenuContent}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Desktop/tablet card
  return (
    <div
      onClick={isTrashed ? undefined : onOpen}
      style={{
        background: '#fff', border: '1px solid #DFE6E9', borderRadius: 12,
        overflow: 'hidden', cursor: isTrashed ? 'default' : 'pointer',
        transition: 'box-shadow 150ms, transform 150ms',
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      }}
      onMouseEnter={e => { if (!isTrashed) { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)'; e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      {/* Preview area */}
      <div style={{ height: 120, background: 'linear-gradient(135deg, ' + (map.settings.themeColor || '#7C5CE7') + '15, ' + (map.settings.themeColor || '#7C5CE7') + '30)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <MapThumbnail map={map} />
        {map.isStarred && <span style={{ position: 'absolute', top: 8, right: 8, fontSize: 14, color: '#FDCB6E' }}>★</span>}
      </div>

      {/* Info */}
      <div style={{ padding: '12px 14px' }}>
        {isRenaming ? (
          <input
            autoFocus
            value={renameDraft}
            onChange={e => onRenameChange(e.target.value)}
            onBlur={onRenameCommit}
            onKeyDown={e => { if (e.key === 'Enter') onRenameCommit(); if (e.key === 'Escape') onRenameCommit(); e.stopPropagation(); }}
            onClick={e => e.stopPropagation()}
            style={{ width: '100%', border: '1px solid ' + ALPHA_COLORS.primary, borderRadius: 4, padding: '2px 6px', fontSize: 14, fontWeight: 600, outline: 'none', boxSizing: 'border-box' }}
          />
        ) : (
          <div style={{ fontSize: 14, fontWeight: 600, color: '#2D3436', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {map.title}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 11, color: '#b2bec3' }}>
            {nodeCount} nœud{nodeCount !== 1 ? 's' : ''} · {formatDate(map.updatedAt)}
          </div>
          {ws && <span style={{ fontSize: 10, color: '#b2bec3' }}>{ws.icon}</span>}
        </div>
      </div>

      {/* Actions footer */}
      <div style={{ borderTop: '1px solid #F0F0F0', padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', position: 'relative' }} onClick={e => e.stopPropagation()}>
        <button onClick={onMenuToggle} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '3px 8px', borderRadius: 4, fontSize: 18, color: '#636E72', minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }} aria-label="Options">⋯</button>

        {isMenuOpen && (
          <div
            className="panel-enter"
            onClick={e => e.stopPropagation()}
            style={{ position: 'absolute', right: 0, bottom: '100%', background: '#fff', border: '1px solid #DFE6E9', borderRadius: 10, boxShadow: '0 4px 20px rgba(0,0,0,0.12)', zIndex: 60, minWidth: 180, overflow: 'hidden' }}
          >
            {contextMenuContent}
          </div>
        )}
      </div>
    </div>
  );
};

// ── SVG mini thumbnail ────────────────────────────────────────────────────────

const MapThumbnail: React.FC<{ map: MindMap; small?: boolean }> = ({ map, small }) => {
  const color = map.settings.themeColor || '#7C5CE7';
  const nodeCount = Object.keys(map.nodes).length;
  const arms = Math.min(8, Math.max(2, nodeCount - 1));
  const w = small ? 60 : 120;
  const h = small ? 60 : 90;
  const r = small ? 18 : 28;
  const cx = w / 2;
  const cy = h / 2;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none" style={{ opacity: 0.7 }}>
      {Array.from({ length: arms }).map((_, i) => {
        const angle = (i / arms) * Math.PI * 2 - Math.PI / 2;
        const ex = cx + Math.cos(angle) * r;
        const ey = cy + Math.sin(angle) * r;
        return (
          <g key={i}>
            <line x1={cx} y1={cy} x2={ex} y2={ey} stroke={color} strokeWidth={1.5} strokeOpacity={0.5} />
            <circle cx={ex} cy={ey} r={small ? 3 : 5} fill={color} opacity={0.4} />
          </g>
        );
      })}
      <circle cx={cx} cy={cy} r={small ? 6 : 10} fill={color} opacity={0.8} />
    </svg>
  );
};

// ── New workspace modal ───────────────────────────────────────────────────────

const PRESET_COLORS = ['#7C5CE7', '#00B894', '#0984E3', '#E17055', '#FDCB6E', '#6C5CE7', '#00CEC9', '#FD79A8'];
const PRESET_ICONS = ['📁', '🚀', '💼', '🎯', '📚', '🏠', '🌟', '💡', '🎨', '🔬', '📊', '🌍'];

const NewWorkspaceModal: React.FC<{
  onClose: () => void;
  onCreate: (name: string, color: string, icon: string, desc: string) => void;
}> = ({ onClose, onCreate }) => {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [color, setColor] = useState('#7C5CE7');
  const [icon, setIcon] = useState('📁');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onCreate(name.trim(), color, icon, desc.trim());
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 }} onClick={onClose}>
      <div className="panel-enter" onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, padding: 28, width: '100%', maxWidth: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <h2 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 700, color: '#2D3436' }}>Nouvel espace de travail</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Icon picker */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#2D3436', display: 'block', marginBottom: 8 }}>Icône</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {PRESET_ICONS.map(ic => (
                <button key={ic} type="button" onClick={() => setIcon(ic)} style={{ width: 44, height: 44, background: icon === ic ? color + '20' : '#F8F9FA', border: `2px solid ${icon === ic ? color : 'transparent'}`, borderRadius: 8, cursor: 'pointer', fontSize: 18 }}>{ic}</button>
              ))}
            </div>
          </div>

          {/* Color picker */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#2D3436', display: 'block', marginBottom: 8 }}>Couleur</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {PRESET_COLORS.map(c => (
                <button key={c} type="button" onClick={() => setColor(c)} style={{ width: 36, height: 36, borderRadius: '50%', background: c, border: `3px solid ${color === c ? '#2D3436' : 'transparent'}`, cursor: 'pointer', padding: 0 }} />
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#2D3436' }}>Nom *</label>
            <input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="Mon Espace" required style={{ padding: '10px 14px', border: '1px solid #DFE6E9', borderRadius: 8, fontSize: 14, outline: 'none' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#2D3436' }}>Description <span style={{ color: '#b2bec3', fontWeight: 400 }}>(optionnel)</span></label>
            <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Pour mes projets clients…" style={{ padding: '10px 14px', border: '1px solid #DFE6E9', borderRadius: 8, fontSize: 14, outline: 'none' }} />
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button type="submit" style={{ flex: 1, padding: '10px', background: color, color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', minHeight: 44 }}>
              Créer l'espace
            </button>
            <button type="button" onClick={onClose} style={{ padding: '10px 20px', background: '#F8F9FA', border: '1px solid #DFE6E9', borderRadius: 8, fontSize: 14, cursor: 'pointer', color: '#636E72', minHeight: 44 }}>
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Empty state ───────────────────────────────────────────────────────────────

const EmptyState: React.FC<{ onNew: () => void; search: string; view: SidebarView }> = ({ onNew, search, view }) => (
  <div style={{ textAlign: 'center', padding: '80px 20px', color: '#b2bec3' }}>
    <div style={{ fontSize: 52, marginBottom: 16 }}>
      {view === 'trash' ? '🗑' : view === 'starred' ? '★' : '🗺'}
    </div>
    <div style={{ fontSize: 16, fontWeight: 600, color: '#636E72', marginBottom: 8 }}>
      {search ? 'Aucune map trouvée' : view === 'trash' ? 'Corbeille vide' : view === 'starred' ? 'Aucun favori' : 'Aucune map'}
    </div>
    <div style={{ fontSize: 13, marginBottom: 24 }}>
      {search ? 'Essayez un autre terme de recherche.' : view === 'trash' ? 'Les maps supprimées apparaissent ici.' : 'Créez votre première mind map.'}
    </div>
    {!search && view !== 'trash' && (
      <button onClick={onNew} style={{ background: ALPHA_COLORS.primary, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer', minHeight: 44 }}>
        + Créer une map
      </button>
    )}
  </div>
);

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'À l\'instant';
  if (mins < 60) return `Il y a ${mins}min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Il y a ${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `Il y a ${days}j`;
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

const newMapBtnStyle: React.CSSProperties = {
  width: '100%', background: ALPHA_COLORS.primary, color: '#fff', border: 'none',
  borderRadius: 8, padding: '9px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: 44,
};

const userMenuItemStyle: React.CSSProperties = {
  width: '100%', background: 'none', border: 'none', padding: '10px 16px',
  fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
  color: '#2D3436', textAlign: 'left', minHeight: 44,
};

const wsMenuItemStyle: React.CSSProperties = {
  width: '100%', background: 'none', border: 'none', padding: '8px 14px',
  fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
  color: '#2D3436', textAlign: 'left', minHeight: 44,
};

const cardMenuItemStyle: React.CSSProperties = {
  width: '100%', background: 'none', border: 'none', padding: '9px 14px',
  fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
  color: '#2D3436', textAlign: 'left', minHeight: 44,
};
