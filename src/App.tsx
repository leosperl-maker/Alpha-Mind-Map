import { useEffect } from 'react';
import { useUIStore } from './store/uiStore';
import { useMapStore } from './store/mapStore';
import { TopToolbar } from './components/Toolbar/TopToolbar';
import { NodeToolbar } from './components/Toolbar/NodeToolbar';
import { MindMapCanvas } from './components/Canvas/MindMapCanvas';
import { PersonalizePanel } from './components/Panels/PersonalizePanel';
import { NotesPanel } from './components/Panels/NotesPanel';
import { DashboardPage } from './components/Dashboard/DashboardPage';

function App() {
  const view = useUIStore(s => s.view);
  const createMap = useMapStore(s => s.createMap);
  const maps = useMapStore(s => s.maps);

  // Create a demo map on first load
  useEffect(() => {
    if (maps.length === 0) {
      const id = createMap('My First Mind Map');
      // Add some demo nodes
      setTimeout(() => {
        const { addNode, maps: currentMaps } = useMapStore.getState();
        const map = currentMaps.find(m => m.id === id);
        if (!map) return;
        const n1 = addNode(map.rootNodeId);
        const n2 = addNode(map.rootNodeId);
        const n3 = addNode(map.rootNodeId);
        const n4 = addNode(map.rootNodeId);

        setTimeout(() => {
          const { maps: m2, addNode: add2, updateNodeText } = useMapStore.getState();
          const liveMap = m2.find(m => m.id === id);
          if (!liveMap) return;

          const nodeIds = [n1, n2, n3, n4];
          const labels = ['Ideas', 'Tasks', 'Goals', 'Notes'];
          nodeIds.forEach((nid, i) => {
            updateNodeText(nid, labels[i]);
            const child1 = add2(nid);
            const child2 = add2(nid);
            const { updateNodeText: ut2 } = useMapStore.getState();
            const subLabels: Record<string, string[]> = {
              'Ideas': ['Brainstorm', 'Research'],
              'Tasks': ['In Progress', 'Backlog'],
              'Goals': ['Short term', 'Long term'],
              'Notes': ['Resources', 'References'],
            };
            ut2(child1, subLabels[labels[i]][0]);
            ut2(child2, subLabels[labels[i]][1]);
          });

          useMapStore.getState().recomputeLayout();
          const { fitToScreen } = useUIStore.getState();
          const finalMap = useMapStore.getState().maps.find(m => m.id === id);
          if (!finalMap) return;
          const nodes = Object.values(finalMap.nodes);
          const xs = nodes.map(n => n.position.x);
          const ys = nodes.map(n => n.position.y);
          fitToScreen(window.innerWidth, window.innerHeight - 56, {
            minX: Math.min(...xs), minY: Math.min(...ys),
            maxX: Math.max(...xs), maxY: Math.max(...ys),
          });
        }, 50);
      }, 10);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (view === 'dashboard') {
    return <DashboardPage />;
  }

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative' }}>
      <TopToolbar />
      <NodeToolbar />
      <MindMapCanvas />
      <PersonalizePanel />
      <NotesPanel />
    </div>
  );
}

export default App;
