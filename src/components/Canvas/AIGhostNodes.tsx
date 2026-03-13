import React from 'react';
import { useUIStore } from '../../store/uiStore';
import { useMapStore } from '../../store/mapStore';

// Ghost nodes are suggestion overlays rendered at computed positions near their parent
export const AIGhostNodes: React.FC = () => {
  const aiSuggestions = useUIStore(s => s.aiSuggestions);
  const setAISuggestions = useUIStore(s => s.setAISuggestions);
  const zoom = useUIStore(s => s.zoom);
  const panX = useUIStore(s => s.panX);
  const panY = useUIStore(s => s.panY);

  const maps = useMapStore(s => s.maps);
  const activeMapId = useMapStore(s => s.activeMapId);
  const addNode = useMapStore(s => s.addNode);
  const updateNodeText = useMapStore(s => s.updateNodeText);
  const setSelectedNode = useUIStore(s => s.setSelectedNode);

  if (!aiSuggestions) return null;

  const map = maps.find(m => m.id === activeMapId);
  if (!map) return null;
  const parent = map.nodes[aiSuggestions.parentId];
  if (!parent) return null;

  // Compute screen position of parent
  const parentScreenX = parent.position.x * zoom + panX;
  const parentScreenY = parent.position.y * zoom + panY;

  const count = aiSuggestions.items.length;
  const BASE_OFFSET_X = 220;
  const V_STEP = 56;

  const acceptAll = () => {
    for (const item of aiSuggestions.items) {
      const nid = addNode(aiSuggestions.parentId);
      setTimeout(() => updateNodeText(nid, item.text), 10);
    }
    setAISuggestions(null);
  };

  const rejectAll = () => setAISuggestions(null);

  const acceptOne = (itemId: string, text: string) => {
    const nid = addNode(aiSuggestions.parentId);
    setTimeout(() => { updateNodeText(nid, text); setSelectedNode(nid); }, 10);
    const remaining = aiSuggestions.items.filter(i => i.id !== itemId);
    if (remaining.length === 0) {
      setAISuggestions(null);
    } else {
      setAISuggestions({ parentId: aiSuggestions.parentId, items: remaining });
    }
  };

  const rejectOne = (itemId: string) => {
    const remaining = aiSuggestions.items.filter(i => i.id !== itemId);
    if (remaining.length === 0) {
      setAISuggestions(null);
    } else {
      setAISuggestions({ parentId: aiSuggestions.parentId, items: remaining });
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 35 }}>
      {/* Accept all / Reject all bar */}
      <div
        style={{
          position: 'absolute',
          left: parentScreenX + BASE_OFFSET_X * zoom,
          top: parentScreenY - ((count / 2) * V_STEP * zoom) - 36,
          pointerEvents: 'auto',
          display: 'flex', gap: 6,
          background: '#fff',
          borderRadius: 8, padding: '4px 8px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.14)',
          border: '1px solid #DFE6E9',
          fontSize: 12,
        }}
      >
        <span style={{ color: '#636E72', alignSelf: 'center', marginRight: 4 }}>✨ Suggestions IA</span>
        <button
          onClick={acceptAll}
          style={{ background: '#00B894', color: '#fff', border: 'none', borderRadius: 5, padding: '3px 10px', cursor: 'pointer', fontSize: 12 }}
        >✓ Tout accepter</button>
        <button
          onClick={rejectAll}
          style={{ background: '#F8F9FA', color: '#636E72', border: '1px solid #DFE6E9', borderRadius: 5, padding: '3px 10px', cursor: 'pointer', fontSize: 12 }}
        >✕ Tout rejeter</button>
      </div>

      {/* Individual ghost nodes */}
      {aiSuggestions.items.map((item, i) => {
        const offsetY = (i - (count - 1) / 2) * V_STEP;
        const screenX = parentScreenX + BASE_OFFSET_X * zoom;
        const screenY = parentScreenY + offsetY * zoom;

        return (
          <div
            key={item.id}
            style={{
              position: 'absolute',
              left: screenX,
              top: screenY,
              transform: 'translateY(-50%)',
              pointerEvents: 'auto',
              display: 'flex', alignItems: 'center', gap: 4,
            }}
          >
            {/* Dashed ghost node */}
            <div
              style={{
                background: 'rgba(108,92,231,0.06)',
                border: '1.5px dashed #6C5CE7',
                borderRadius: 8,
                padding: '5px 12px',
                fontSize: 13,
                color: '#2D3436',
                opacity: 0.8,
                maxWidth: 180,
                boxShadow: '0 1px 4px rgba(108,92,231,0.12)',
                userSelect: 'none',
              }}
            >
              {item.text}
            </div>
            {/* Accept / Reject buttons */}
            <button
              onClick={() => acceptOne(item.id, item.text)}
              style={{ background: '#00B894', color: '#fff', border: 'none', borderRadius: '50%', width: 22, height: 22, cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
              title="Accepter"
            >✓</button>
            <button
              onClick={() => rejectOne(item.id)}
              style={{ background: '#F8F9FA', color: '#636E72', border: '1px solid #DFE6E9', borderRadius: '50%', width: 22, height: 22, cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
              title="Rejeter"
            >✕</button>
          </div>
        );
      })}

      {/* Connector lines from parent to ghost nodes */}
      <svg
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
      >
        {aiSuggestions.items.map((item, i) => {
          const offsetY = (i - (count - 1) / 2) * V_STEP;
          const x2 = parentScreenX + BASE_OFFSET_X * zoom;
          const y2 = parentScreenY + offsetY * zoom;
          return (
            <line
              key={item.id}
              x1={parentScreenX + 40 * zoom}
              y1={parentScreenY}
              x2={x2}
              y2={y2}
              stroke="#6C5CE7"
              strokeWidth={1.5}
              strokeDasharray="4 3"
              opacity={0.5}
            />
          );
        })}
      </svg>
    </div>
  );
};
