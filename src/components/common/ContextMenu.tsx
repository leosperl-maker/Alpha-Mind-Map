import React, { useEffect, useRef } from 'react';
import { useMapStore } from '../../store/mapStore';
import { useUIStore } from '../../store/uiStore';
import { NODE_PALETTE } from '../../utils/colors';
import { getAISettings, improveNodeText } from '../../utils/aiService';
import { v4 as uuid } from 'uuid';

export const ContextMenu: React.FC = () => {
  const contextMenu = useUIStore(s => s.contextMenu);
  const setContextMenu = useUIStore(s => s.setContextMenu);
  const setSelectedNode = useUIStore(s => s.setSelectedNode);
  const setEditingNode = useUIStore(s => s.setEditingNode);
  const setFocusMode = useUIStore(s => s.setFocusMode);
  const setPendingCrossConnect = useUIStore(s => s.setPendingCrossConnect);
  const setAISuggestions = useUIStore(s => s.setAISuggestions);
  const setAILoading = useUIStore(s => s.setAILoading);
  const setAIImproveOptions = useUIStore(s => s.setAIImproveOptions);
  const ref = useRef<HTMLDivElement>(null);

  const maps = useMapStore(s => s.maps);
  const activeMapId = useMapStore(s => s.activeMapId);
  const addNode = useMapStore(s => s.addNode);
  const addSiblingNode = useMapStore(s => s.addSiblingNode);
  const deleteNode = useMapStore(s => s.deleteNode);
  const duplicateNode = useMapStore(s => s.duplicateNode);
  const toggleCollapse = useMapStore(s => s.toggleCollapse);
  const colorBranch = useMapStore(s => s.colorBranch);
  const toggleNodeStar = useMapStore(s => s.toggleNodeStar);
  const setActivePanel = useUIStore(s => s.setActivePanel);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };
    if (contextMenu) {
      document.addEventListener('mousedown', close);
      return () => document.removeEventListener('mousedown', close);
    }
  }, [contextMenu, setContextMenu]);

  if (!contextMenu) return null;

  const map = maps.find(m => m.id === activeMapId);
  if (!map) return null;

  const node = map.nodes[contextMenu.nodeId];
  if (!node) return null;

  const isRoot = (map.rootNodeIds || [map.rootNodeId]).includes(contextMenu.nodeId);
  const rootCount = (map.rootNodeIds || [map.rootNodeId]).length;
  const isStarred = node.content.isStarred;

  const close = () => setContextMenu(null);
  const action = (fn: () => void) => () => { fn(); close(); };

  const handleAIBranches = async () => {
    close();
    const aiSettings = getAISettings();
    setAILoading(true);
    try {
      const { generateBranches } = await import('../../utils/aiService');
      const contextNodes = Object.values(map.nodes)
        .filter(n => n.id !== contextMenu.nodeId)
        .map(n => n.content.text)
        .filter(Boolean)
        .slice(0, 15);
      const suggestions = await generateBranches(
        node.content.text || 'nœud',
        contextNodes,
        aiSettings.geminiApiKey,
        aiSettings.model,
        aiSettings.language
      );
      setAISuggestions({
        parentId: contextMenu.nodeId,
        items: suggestions.map(text => ({ id: uuid(), text })),
      });
    } catch (err) {
      alert('Erreur IA : ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setAILoading(false);
    }
  };

  const handleAIImprove = async () => {
    close();
    if (!node.content.text) return;
    const aiSettings = getAISettings();
    setAILoading(true);
    try {
      const options = await improveNodeText(
        node.content.text,
        aiSettings.geminiApiKey,
        aiSettings.model,
        aiSettings.language
      );
      setAIImproveOptions(options);
      setSelectedNode(contextMenu.nodeId);
    } catch (err) {
      alert('Erreur IA : ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setAILoading(false);
    }
  };

  const [showBranchColors, setShowBranchColors] = React.useState(false);

  return (
    <div
      ref={ref}
      className="panel-enter"
      style={{
        position: 'fixed',
        left: contextMenu.x,
        top: contextMenu.y,
        background: '#fff',
        border: '1px solid #DFE6E9',
        borderRadius: 8,
        boxShadow: '0 8px 24px rgba(0,0,0,0.14)',
        zIndex: 100,
        minWidth: 210,
        overflow: 'hidden',
        fontSize: 13,
      }}
    >
      <MenuItem icon="✏" label="Renommer" onClick={action(() => { setSelectedNode(contextMenu.nodeId); setEditingNode(contextMenu.nodeId); })} />
      <MenuItem icon="⊕" label="Ajouter enfant (Tab)" onClick={action(() => { const nid = addNode(contextMenu.nodeId); setSelectedNode(nid); setTimeout(() => setEditingNode(nid), 50); })} />
      {!isRoot && <MenuItem icon="↓" label="Ajouter frère (Entrée)" onClick={action(() => { const nid = addSiblingNode(contextMenu.nodeId); if (nid) { setSelectedNode(nid); setTimeout(() => setEditingNode(nid), 50); } })} />}
      <MenuItem icon="⧉" label="Dupliquer" onClick={action(() => { const nid = duplicateNode(contextMenu.nodeId); if (nid) setSelectedNode(nid); })} />

      <Divider />

      <MenuItem
        icon={isStarred ? '★' : '☆'}
        label={isStarred ? 'Retirer des favoris' : 'Marquer comme important'}
        onClick={action(() => toggleNodeStar(contextMenu.nodeId))}
      />

      {node.childrenIds.length > 0 && (
        <MenuItem
          icon={node.position.collapsed ? '▶' : '▼'}
          label={node.position.collapsed ? 'Développer' : 'Réduire'}
          onClick={action(() => toggleCollapse(contextMenu.nodeId))}
        />
      )}

      <div style={{ position: 'relative' }}>
        <MenuItem icon="🎨" label="Colorier la branche →" onClick={() => setShowBranchColors(!showBranchColors)} />
        {showBranchColors && (
          <div style={{
            position: 'absolute', left: '100%', top: 0,
            background: '#fff', border: '1px solid #DFE6E9', borderRadius: 8,
            padding: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
            display: 'grid', gridTemplateColumns: 'repeat(5,20px)', gap: 4, zIndex: 110,
          }}>
            {NODE_PALETTE.map(c => (
              <button key={c} onClick={action(() => colorBranch(contextMenu.nodeId, c))}
                style={{ width: 20, height: 20, borderRadius: 3, background: c, border: '1px solid rgba(0,0,0,0.1)', cursor: 'pointer', padding: 0 }}
              />
            ))}
          </div>
        )}
      </div>

      <MenuItem icon="📝" label="Ajouter une note" onClick={action(() => { setSelectedNode(contextMenu.nodeId); setActivePanel('notes'); })} />

      <Divider />

      {/* AI features */}
      <MenuItem icon="✨" label="Générer des branches (IA)" onClick={handleAIBranches} />
      <MenuItem icon="✦" label="Améliorer le texte (IA)" onClick={handleAIImprove} />

      <Divider />

      {/* Focus mode */}
      <MenuItem
        icon="🔍"
        label="Mode Focus"
        onClick={action(() => { setSelectedNode(contextMenu.nodeId); setFocusMode(contextMenu.nodeId); })}
      />

      {/* Cross connect */}
      <MenuItem
        icon="↔"
        label="Lier à un autre nœud…"
        onClick={action(() => { setSelectedNode(contextMenu.nodeId); setPendingCrossConnect(contextMenu.nodeId); })}
      />

      <Divider />
      {!(isRoot && rootCount <= 1) && (
        <MenuItem icon="🗑" label="Supprimer" onClick={action(() => { deleteNode(contextMenu.nodeId); setSelectedNode(null); })} danger />
      )}
    </div>
  );
};

const MenuItem: React.FC<{ icon: string; label: string; onClick: () => void; danger?: boolean }> = ({ icon, label, onClick, danger }) => (
  <button
    onClick={onClick}
    style={{
      width: '100%', background: 'none', border: 'none',
      padding: '8px 14px', fontSize: 13, cursor: 'pointer',
      display: 'flex', alignItems: 'center', gap: 8,
      color: danger ? '#E17055' : '#2D3436', textAlign: 'left',
      transition: 'background 80ms',
    }}
    onMouseEnter={e => (e.currentTarget.style.background = '#F8F9FA')}
    onMouseLeave={e => (e.currentTarget.style.background = 'none')}
  >
    <span style={{ width: 18, textAlign: 'center' }}>{icon}</span>
    {label}
  </button>
);

const Divider = () => <div style={{ height: 1, background: '#F0F0F0', margin: '2px 0' }} />;
