import React, { useState } from 'react';
import { useMapStore } from '../../store/mapStore';
import { useUIStore } from '../../store/uiStore';
import type { NodeStyle, FontSize, NodeShape, ConnectorStyle } from '../../types';
import { NODE_PALETTE, ALPHA_COLORS } from '../../utils/colors';

export const NodeToolbar: React.FC = () => {
  const selectedNodeId = useUIStore(s => s.selectedNodeId);
  const editingNodeId = useUIStore(s => s.editingNodeId);
  const maps = useMapStore(s => s.maps);
  const activeMapId = useMapStore(s => s.activeMapId);
  const updateNodeStyle = useMapStore(s => s.updateNodeStyle);
  const deleteNode = useMapStore(s => s.deleteNode);
  const { setSelectedNode } = useUIStore();

  const [showColorPicker, setShowColorPicker] = useState<'fill' | 'border' | null>(null);

  if (!selectedNodeId || editingNodeId) return null;

  const map = maps.find(m => m.id === activeMapId);
  if (!map) return null;

  const node = map.nodes[selectedNodeId];
  if (!node) return null;

  const isRoot = selectedNodeId === map.rootNodeId;
  const style = node.style;

  const set = (s: Partial<NodeStyle>) => updateNodeStyle(selectedNodeId, s);

  const fontSizes: FontSize[] = ['xs', 's', 'm', 'l', 'xl'];
  const shapes: { key: NodeShape; label: string }[] = [
    { key: 'rounded', label: '▭' },
    { key: 'pill', label: '⬭' },
    { key: 'circle', label: '○' },
    { key: 'rectangle', label: '▬' },
  ];
  const connectors: { key: ConnectorStyle; label: string }[] = [
    { key: 'curved', label: '⌒' },
    { key: 'straight', label: '—' },
    { key: 'dashed', label: '- -' },
    { key: 'dotted', label: '···' },
  ];

  return (
    <div
      className="panel-enter"
      style={{
        position: 'fixed',
        top: 68,
        left: '50%',
        transform: 'translateX(-50%)',
        background: '#fff',
        border: '1px solid #DFE6E9',
        borderRadius: 10,
        boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
        display: 'flex',
        alignItems: 'center',
        padding: '6px 10px',
        gap: 6,
        zIndex: 40,
        flexWrap: 'wrap',
      }}
      onClick={e => e.stopPropagation()}
    >
      {/* Fill color */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setShowColorPicker(showColorPicker === 'fill' ? null : 'fill')}
          style={{
            ...toolBtnStyle,
            background: style.fillColor || '#F8F9FA',
            border: `2px solid ${style.fillColor ? style.fillColor : '#DFE6E9'}`,
            width: 24,
            height: 24,
            borderRadius: 4,
          }}
          title="Fill color"
          aria-label="Fill color"
        />
        {showColorPicker === 'fill' && (
          <ColorPicker
            onSelect={c => { set({ fillColor: c, textColor: '#fff' }); setShowColorPicker(null); }}
            onClear={() => { set({ fillColor: null, textColor: null }); setShowColorPicker(null); }}
            onClose={() => setShowColorPicker(null)}
          />
        )}
      </div>

      {/* Border color */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setShowColorPicker(showColorPicker === 'border' ? null : 'border')}
          style={{
            ...toolBtnStyle,
            background: '#fff',
            border: `3px solid ${style.borderColor || '#DFE6E9'}`,
            width: 24,
            height: 24,
            borderRadius: 4,
          }}
          title="Border color"
          aria-label="Border color"
        />
        {showColorPicker === 'border' && (
          <ColorPicker
            onSelect={c => { set({ borderColor: c }); setShowColorPicker(null); }}
            onClear={() => { set({ borderColor: null }); setShowColorPicker(null); }}
            onClose={() => setShowColorPicker(null)}
          />
        )}
      </div>

      <Divider />

      {/* Shape */}
      {shapes.map(s => (
        <button
          key={s.key}
          onClick={() => set({ shape: s.key })}
          style={{
            ...toolBtnStyle,
            background: style.shape === s.key ? ALPHA_COLORS.primary : 'transparent',
            color: style.shape === s.key ? '#fff' : '#636E72',
            fontSize: 13,
            padding: '3px 8px',
            borderRadius: 4,
          }}
          title={s.key}
        >
          {s.label}
        </button>
      ))}

      <Divider />

      {/* Font size */}
      {fontSizes.map(fs => (
        <button
          key={fs}
          onClick={() => set({ fontSize: fs })}
          style={{
            ...toolBtnStyle,
            background: style.fontSize === fs ? ALPHA_COLORS.primary : 'transparent',
            color: style.fontSize === fs ? '#fff' : '#636E72',
            fontSize: fs === 'xs' ? 9 : fs === 's' ? 11 : fs === 'm' ? 13 : fs === 'l' ? 15 : 18,
            padding: '2px 5px',
            borderRadius: 4,
            minWidth: 22,
          }}
          title={`Font size: ${fs.toUpperCase()}`}
        >
          A
        </button>
      ))}

      {/* Bold */}
      <button
        onClick={() => set({ fontWeight: style.fontWeight === 'bold' ? 'normal' : 'bold' })}
        style={{
          ...toolBtnStyle,
          background: style.fontWeight === 'bold' ? ALPHA_COLORS.primary : 'transparent',
          color: style.fontWeight === 'bold' ? '#fff' : '#636E72',
          fontWeight: 700,
          padding: '2px 8px',
          borderRadius: 4,
        }}
        title="Bold"
      >
        B
      </button>

      <Divider />

      {/* Connector style */}
      {connectors.map(c => (
        <button
          key={c.key}
          onClick={() => set({ connectorStyle: c.key })}
          style={{
            ...toolBtnStyle,
            background: style.connectorStyle === c.key ? ALPHA_COLORS.primary : 'transparent',
            color: style.connectorStyle === c.key ? '#fff' : '#636E72',
            fontSize: 12,
            padding: '2px 6px',
            borderRadius: 4,
          }}
          title={c.key}
        >
          {c.label}
        </button>
      ))}

      {!isRoot && (
        <>
          <Divider />
          <button
            onClick={() => { deleteNode(selectedNodeId); setSelectedNode(null); }}
            style={{
              ...toolBtnStyle,
              color: '#E17055',
              padding: '2px 8px',
              borderRadius: 4,
              fontSize: 16,
            }}
            title="Delete node (Delete)"
            aria-label="Delete node"
          >
            🗑
          </button>
        </>
      )}
    </div>
  );
};

const ColorPicker: React.FC<{
  onSelect: (c: string) => void;
  onClear: () => void;
  onClose: () => void;
}> = ({ onSelect, onClear, onClose }) => {
  return (
    <div
      className="panel-enter"
      style={{
        position: 'absolute',
        top: '110%',
        left: 0,
        background: '#fff',
        border: '1px solid #DFE6E9',
        borderRadius: 8,
        padding: 8,
        boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
        zIndex: 50,
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 20px)',
        gap: 4,
      }}
      onClick={e => e.stopPropagation()}
    >
      {NODE_PALETTE.map(c => (
        <button
          key={c}
          onClick={() => onSelect(c)}
          style={{
            width: 20,
            height: 20,
            borderRadius: 4,
            background: c,
            border: '1px solid rgba(0,0,0,0.1)',
            cursor: 'pointer',
            padding: 0,
          }}
          title={c}
          aria-label={c}
        />
      ))}
      <button
        onClick={onClear}
        style={{
          width: 20,
          height: 20,
          borderRadius: 4,
          background: '#F8F9FA',
          border: '1px dashed #DFE6E9',
          cursor: 'pointer',
          fontSize: 10,
          color: '#636E72',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 0,
        }}
        title="Clear"
      >
        ✕
      </button>
      <div style={{ gridColumn: '1 / -1', borderTop: '1px solid #DFE6E9', paddingTop: 4, display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={onClose} style={{ fontSize: 10, color: '#636E72', background: 'none', border: 'none', cursor: 'pointer' }}>
          Close
        </button>
      </div>
    </div>
  );
};

const Divider: React.FC = () => (
  <div style={{ width: 1, height: 20, background: '#DFE6E9', margin: '0 2px' }} />
);

const toolBtnStyle: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid transparent',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'background 100ms',
};
