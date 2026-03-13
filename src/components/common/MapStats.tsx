import React from 'react';
import { useUIStore } from '../../store/uiStore';
import { useMapStore } from '../../store/mapStore';

function getMaxDepth(nodes: Record<string, { parentId: string | null; childrenIds: string[] }>, rootIds: string[]): number {
  let max = 0;
  const visit = (id: string, depth: number) => {
    if (depth > max) max = depth;
    const node = nodes[id];
    if (node) node.childrenIds.forEach(cid => visit(cid, depth + 1));
  };
  rootIds.forEach(id => visit(id, 0));
  return max;
}

export const MapStats: React.FC = () => {
  const showMapStats = useUIStore(s => s.showMapStats);
  const maps = useMapStore(s => s.maps);
  const activeMapId = useMapStore(s => s.activeMapId);

  if (!showMapStats) return null;

  const map = maps.find(m => m.id === activeMapId);
  if (!map) return null;

  const nodeCount = Object.keys(map.nodes).length;
  const branchCount = Object.values(map.nodes).reduce((acc, n) => acc + n.childrenIds.length, 0);
  const maxDepth = getMaxDepth(map.nodes, map.rootNodeIds);
  const stickyCount = map.stickyNotes.length;
  const starredCount = Object.values(map.nodes).filter(n => n.content.isStarred).length;

  const stats = [
    { icon: '⬡', label: 'Nœuds', value: nodeCount },
    { icon: '↗', label: 'Branches', value: branchCount },
    { icon: '⬇', label: 'Profondeur max', value: maxDepth },
    { icon: '📌', label: 'Post-its', value: stickyCount },
    { icon: '★', label: 'Favoris', value: starredCount },
  ];

  return (
    <div style={{
      position: 'fixed',
      bottom: 68,
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 100,
      background: '#fff',
      border: '1px solid #DFE6E9',
      borderRadius: 12,
      boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
      padding: '10px 20px',
      display: 'flex',
      gap: 24,
      alignItems: 'center',
      pointerEvents: 'none',
    }}>
      {stats.map(stat => (
        <div key={stat.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <span style={{ fontSize: 18, lineHeight: 1 }}>{stat.icon}</span>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#2D3436', lineHeight: 1.2 }}>{stat.value}</span>
          <span style={{ fontSize: 10, color: '#636E72', whiteSpace: 'nowrap' }}>{stat.label}</span>
        </div>
      ))}
    </div>
  );
};
