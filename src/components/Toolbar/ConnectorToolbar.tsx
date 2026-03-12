import React, { useState } from 'react';
import { useMapStore } from '../../store/mapStore';
import { useUIStore } from '../../store/uiStore';
import type { ConnectorStyle, ConnectorWidth } from '../../types';
import { NODE_PALETTE, ALPHA_COLORS } from '../../utils/colors';

export const ConnectorToolbar: React.FC = () => {
  const selectedConnectorId = useUIStore(s => s.selectedConnectorId);
  const setSelectedConnector = useUIStore(s => s.setSelectedConnector);
  const maps = useMapStore(s => s.maps);
  const activeMapId = useMapStore(s => s.activeMapId);
  const updateNodeStyle = useMapStore(s => s.updateNodeStyle);

  const [showColorPicker, setShowColorPicker] = useState(false);

  if (!selectedConnectorId) return null;

  const childId = selectedConnectorId.split('|')[1];
  if (!childId) return null;

  const map = maps.find(m => m.id === activeMapId);
  if (!map) return null;

  const node = map.nodes[childId];
  if (!node) return null;

  const style = node.style;

  const connectors: { key: ConnectorStyle; label: string }[] = [
    { key: 'curved', label: '⌒' },
    { key: 'straight', label: '—' },
    { key: 'dashed', label: '- -' },
    { key: 'dotted', label: '···' },
  ];

  const widths: { key: ConnectorWidth; label: string }[] = [
    { key: 'thin', label: 'S' },
    { key: 'normal', label: 'M' },
    { key: 'thick', label: 'L' },
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
      }}
      onClick={e => e.stopPropagation()}
    >
      <span style={{ fontSize: 11, color: '#636E72', marginRight: 4 }}>Connector</span>
      <Divider />

      {/* Connector style */}
      {connectors.map(c => (
        <button
          key={c.key}
          onClick={() => updateNodeStyle(childId, { connectorStyle: c.key })}
          style={{
            ...toolBtnStyle,
            background: style.connectorStyle === c.key ? ALPHA_COLORS.primary : 'transparent',
            color: style.connectorStyle === c.key ? '#fff' : '#636E72',
            fontSize: 12, padding: '2px 6px', borderRadius: 4,
          }}
          title={c.key}
        >{c.label}</button>
      ))}

      <Divider />

      {/* Width */}
      {widths.map(w => (
        <button
          key={w.key}
          onClick={() => updateNodeStyle(childId, { connectorWidth: w.key })}
          style={{
            ...toolBtnStyle,
            background: style.connectorWidth === w.key ? ALPHA_COLORS.primary : 'transparent',
            color: style.connectorWidth === w.key ? '#fff' : '#636E72',
            fontSize: 12, padding: '2px 6px', borderRadius: 4,
            fontWeight: w.key === 'thick' ? 700 : 400,
          }}
          title={`Width: ${w.key}`}
        >{w.label}</button>
      ))}

      <Divider />

      {/* Color */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setShowColorPicker(!showColorPicker)}
          style={{
            ...toolBtnStyle,
            width: 24, height: 24, borderRadius: 4,
            background: style.connectorColor || '#DFE6E9',
            border: `2px solid ${style.connectorColor || '#DFE6E9'}`,
          }}
          title="Connector color"
        />
        {showColorPicker && (
          <div
            style={{
              position: 'absolute', top: '110%', left: 0,
              background: '#fff', border: '1px solid #DFE6E9',
              borderRadius: 8, padding: 8,
              boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
              zIndex: 50, display: 'grid',
              gridTemplateColumns: 'repeat(5, 20px)', gap: 4,
            }}
            onClick={e => e.stopPropagation()}
          >
            {NODE_PALETTE.map(c => (
              <button
                key={c}
                onClick={() => { updateNodeStyle(childId, { connectorColor: c }); setShowColorPicker(false); }}
                style={{ width: 20, height: 20, borderRadius: 4, background: c, border: '1px solid rgba(0,0,0,0.1)', cursor: 'pointer', padding: 0 }}
              />
            ))}
            <button
              onClick={() => { updateNodeStyle(childId, { connectorColor: null }); setShowColorPicker(false); }}
              style={{ width: 20, height: 20, borderRadius: 4, background: '#F8F9FA', border: '1px dashed #DFE6E9', cursor: 'pointer', fontSize: 10, color: '#636E72', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
              title="Default"
            >✕</button>
          </div>
        )}
      </div>

      <Divider />

      <button
        onClick={() => setSelectedConnector(null)}
        style={{ ...toolBtnStyle, color: '#636E72', fontSize: 16, padding: '2px 6px', borderRadius: 4 }}
        title="Deselect connector"
      >×</button>
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
