import React from 'react';
import { useMapStore } from '../../store/mapStore';
import { useUIStore } from '../../store/uiStore';
import type { MapLayout, MapDirection, MapStyle } from '../../types';
import { ALPHA_COLORS, NODE_PALETTE } from '../../utils/colors';

export const PersonalizePanel: React.FC = () => {
  const maps = useMapStore(s => s.maps);
  const activeMapId = useMapStore(s => s.activeMapId);
  const updateSettings = useMapStore(s => s.updateSettings);
  const { activePanel } = useUIStore();

  if (activePanel !== 'personalize') return null;

  const map = maps.find(m => m.id === activeMapId);
  if (!map) return null;

  const settings = map.settings;

  const layouts: { key: MapLayout; label: string; desc: string; icon: string }[] = [
    { key: 'standard', label: 'Mind Map', desc: 'Radial branches from center', icon: '⬡' },
    { key: 'orgchart', label: 'Org Chart', desc: 'Top-down hierarchy', icon: '⬆' },
    { key: 'fishbone', label: 'Fishbone', desc: 'Cause and effect', icon: '⊳' },
    { key: 'argument', label: 'Argument', desc: 'Claims & reasons', icon: '◈' },
  ];

  const directions: { key: MapDirection; label: string; icon: string }[] = [
    { key: 'default', label: 'Default', icon: '⊕' },
    { key: 'left-right', label: 'Left → Right', icon: '→' },
    { key: 'top-bottom', label: 'Top → Bottom', icon: '↓' },
    { key: 'right-left', label: 'Right → Left', icon: '←' },
  ];

  const styles: { key: MapStyle; label: string; desc: string }[] = [
    { key: 'bubbles', label: 'Bubbles', desc: 'Rounded nodes with borders' },
    { key: 'simple', label: 'Simple', desc: 'Text only, minimal' },
    { key: 'productive', label: 'Productive', desc: 'Color-coded by level' },
  ];

  return (
    <div
      className="slide-in-right"
      style={{
        position: 'fixed',
        top: 56,
        right: 0,
        bottom: 0,
        width: 280,
        background: '#fff',
        borderLeft: '1px solid #DFE6E9',
        overflowY: 'auto',
        zIndex: 30,
        padding: '16px',
      }}
    >
      <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: '#2D3436' }}>
        Personalize
      </h3>

      {/* Map Layout */}
      <Section title="Map Layout">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {layouts.map(l => (
            <button
              key={l.key}
              onClick={() => updateSettings({ layout: l.key })}
              style={{
                background: settings.layout === l.key ? ALPHA_COLORS.primary + '15' : '#F8F9FA',
                border: `2px solid ${settings.layout === l.key ? ALPHA_COLORS.primary : '#DFE6E9'}`,
                borderRadius: 8,
                padding: '10px 8px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 150ms',
              }}
            >
              <div style={{ fontSize: 20, marginBottom: 4 }}>{l.icon}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#2D3436' }}>{l.label}</div>
              <div style={{ fontSize: 10, color: '#636E72', marginTop: 2 }}>{l.desc}</div>
            </button>
          ))}
        </div>
      </Section>

      {/* Map Direction */}
      <Section title="Direction">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {directions.map(d => (
            <button
              key={d.key}
              onClick={() => updateSettings({ direction: d.key })}
              style={{
                background: settings.direction === d.key ? ALPHA_COLORS.primary + '15' : 'transparent',
                border: `1.5px solid ${settings.direction === d.key ? ALPHA_COLORS.primary : '#DFE6E9'}`,
                borderRadius: 6,
                padding: '7px 12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                fontSize: 13,
                color: '#2D3436',
                transition: 'all 150ms',
              }}
            >
              <span style={{ fontSize: 16 }}>{d.icon}</span>
              {d.label}
            </button>
          ))}
        </div>
      </Section>

      {/* Map Style */}
      <Section title="Map Style">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {styles.map(s => (
            <button
              key={s.key}
              onClick={() => updateSettings({ style: s.key })}
              style={{
                background: settings.style === s.key ? ALPHA_COLORS.primary + '15' : 'transparent',
                border: `1.5px solid ${settings.style === s.key ? ALPHA_COLORS.primary : '#DFE6E9'}`,
                borderRadius: 6,
                padding: '9px 12px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 150ms',
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 600, color: '#2D3436' }}>{s.label}</div>
              <div style={{ fontSize: 11, color: '#636E72', marginTop: 2 }}>{s.desc}</div>
            </button>
          ))}
        </div>
      </Section>

      {/* Theme Color */}
      <Section title="Theme Color">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {NODE_PALETTE.map(c => (
            <button
              key={c}
              onClick={() => updateSettings({ themeColor: c })}
              style={{
                width: 24,
                height: 24,
                borderRadius: 4,
                background: c,
                border: settings.themeColor === c ? '2px solid #2D3436' : '1px solid rgba(0,0,0,0.1)',
                cursor: 'pointer',
                padding: 0,
              }}
              title={c}
              aria-label={`Theme color ${c}`}
            />
          ))}
        </div>
      </Section>
    </div>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div style={{ marginBottom: 20 }}>
    <div style={{ fontSize: 11, fontWeight: 700, color: '#636E72', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
      {title}
    </div>
    {children}
  </div>
);
