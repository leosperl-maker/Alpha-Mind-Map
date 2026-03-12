import React, { useEffect, useRef } from 'react';
import { useMapStore } from '../../store/mapStore';
import { useUIStore } from '../../store/uiStore';
import { NODE_PALETTE } from '../../utils/colors';

export const ContextMenu: React.FC = () => {
  const contextMenu = useUIStore(s => s.contextMenu);
  const setContextMenu = useUIStore(s => s.setContextMenu);
  const setSelectedNode = useUIStore(s => s.setSelectedNode);
  const setEditingNode = useUIStore(s => s.setEditingNode);
  const ref = useRef<HTMLDivElement>(null);

  const maps = useMapStore(s => s.maps);
  const activeMapId = useMapStore(s => s.activeMapId);
  const addNode = useMapStore(s => s.addNode);
  const addSiblingNode = useMapStore(s => s.addSiblingNode);
  const deleteNode = useMapStore(s => s.deleteNode);
  const duplicateNode = useMapStore(s => s.duplicateNode);
  const toggleCollapse = useMapStore(s => s.toggleCollapse);
  const colorBranch = useMapStore(s => s.colorBranch);
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

  const close = () => setContextMenu(null);

  const action = (fn: () => void) => () => { fn(); close(); };

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
        minWidth: 200,
        overflow: 'hidden',
        fontSize: 13,
      }}
    >
      <MenuItem icon="✏" label="Rename" onClick={action(() => { setSelectedNode(contextMenu.nodeId); setEditingNode(contextMenu.nodeId); })} />
      <MenuItem icon="⊕" label="Add child (Tab)" onClick={action(() => { const nid = addNode(contextMenu.nodeId); setSelectedNode(nid); setTimeout(() => setEditingNode(nid), 50); })} />
      {!isRoot && <MenuItem icon="↓" label="Add sibling (Enter)" onClick={action(() => { const nid = addSiblingNode(contextMenu.nodeId); if (nid) { setSelectedNode(nid); setTimeout(() => setEditingNode(nid), 50); } })} />}
      <MenuItem icon="⧉" label="Duplicate" onClick={action(() => { const nid = duplicateNode(contextMenu.nodeId); if (nid) setSelectedNode(nid); })} />
      <Divider />
      {node.childrenIds.length > 0 && (
        <MenuItem
          icon={node.position.collapsed ? '▶' : '▼'}
          label={node.position.collapsed ? 'Expand branch' : 'Collapse branch'}
          onClick={action(() => toggleCollapse(contextMenu.nodeId))}
        />
      )}
      <div style={{ position: 'relative' }}>
        <MenuItem icon="🎨" label="Color branch →" onClick={() => setShowBranchColors(!showBranchColors)} />
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
      <MenuItem icon="📝" label="Add note" onClick={action(() => { setSelectedNode(contextMenu.nodeId); setActivePanel('notes'); })} />
      <Divider />
      {!(isRoot && rootCount <= 1) && (
        <MenuItem icon="🗑" label="Delete" onClick={action(() => { deleteNode(contextMenu.nodeId); setSelectedNode(null); })} danger />
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
