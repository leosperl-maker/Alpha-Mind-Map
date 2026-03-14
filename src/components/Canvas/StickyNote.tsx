import React, { useRef, useState } from 'react';
import type { StickyNote as StickyNoteType } from '../../types';
import { useMapStore } from '../../store/mapStore';
import { useUIStore } from '../../store/uiStore';
import { STICKY_COLORS } from '../../utils/colors';

interface StickyNoteProps {
  note: StickyNoteType;
}

export const StickyNote: React.FC<StickyNoteProps> = ({ note }) => {
  const { updateStickyNote, deleteStickyNote } = useMapStore();
  const dragRef = useRef<{ startX: number; startY: number; noteX: number; noteY: number; zoom: number } | null>(null);
  const resizeRef = useRef<{ startX: number; startY: number; startW: number; startH: number } | null>(null);
  const [showColors, setShowColors] = useState(false);

  // ── Drag: pointer events + setPointerCapture (same system as nodes) ──────────
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).tagName === 'TEXTAREA') return;
    if ((e.target as HTMLElement).closest('.sticky-resize')) return;
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      noteX: note.x,
      noteY: note.y,
      zoom: useUIStore.getState().zoom,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    updateStickyNote(note.id, {
      x: dragRef.current.noteX + (e.clientX - dragRef.current.startX) / dragRef.current.zoom,
      y: dragRef.current.noteY + (e.clientY - dragRef.current.startY) / dragRef.current.zoom,
    });
  };

  const handlePointerUp = () => {
    dragRef.current = null;
  };

  // ── Resize: mouse ─────────────────────────────────────────────────────────────
  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    resizeRef.current = {
      startX: e.clientX, startY: e.clientY,
      startW: note.width, startH: note.height,
    };
    const currentZoom = useUIStore.getState().zoom;
    const onMove = (me: MouseEvent) => {
      if (!resizeRef.current) return;
      updateStickyNote(note.id, {
        width: Math.max(120, resizeRef.current.startW + (me.clientX - resizeRef.current.startX) / currentZoom),
        height: Math.max(80, resizeRef.current.startH + (me.clientY - resizeRef.current.startY) / currentZoom),
      });
    };
    const onUp = () => {
      resizeRef.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  // ── Resize: touch ─────────────────────────────────────────────────────────────
  const handleResizeTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (e.touches.length !== 1) return;
    const t = e.touches[0];
    resizeRef.current = { startX: t.clientX, startY: t.clientY, startW: note.width, startH: note.height };
    const currentZoom = useUIStore.getState().zoom;
    const onMove = (me: TouchEvent) => {
      me.preventDefault();
      if (!resizeRef.current || me.touches.length !== 1) return;
      const touch = me.touches[0];
      updateStickyNote(note.id, {
        width: Math.max(120, resizeRef.current.startW + (touch.clientX - resizeRef.current.startX) / currentZoom),
        height: Math.max(80, resizeRef.current.startH + (touch.clientY - resizeRef.current.startY) / currentZoom),
      });
    };
    const onEnd = () => {
      resizeRef.current = null;
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
    };
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onEnd);
  };

  return (
    <div
      className="sticky-note"
      style={{
        position: 'absolute',
        left: note.x,
        top: note.y,
        width: note.width,
        height: note.height,
        backgroundColor: note.color,
        borderRadius: 3,
        boxShadow: '3px 5px 16px rgba(0,0,0,0.18)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 5,
        cursor: 'grab',
        border: '1px solid rgba(0,0,0,0.06)',
        userSelect: 'none',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onDoubleClick={e => e.stopPropagation()}
      onClick={e => e.stopPropagation()}
    >
      {/* Header */}
      <div
        className="sticky-controls"
        style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '4px 6px', borderBottom: '1px solid rgba(0,0,0,0.08)',
          cursor: 'grab',
        }}
      >
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowColors(!showColors)}
            onPointerDown={e => e.stopPropagation()}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', fontSize: 12, color: '#636E72', display: 'flex', alignItems: 'center', gap: 3 }}
            title="Change color"
          >
            <span style={{ width: 12, height: 12, borderRadius: 2, background: note.color, border: '1px solid rgba(0,0,0,0.2)', display: 'inline-block' }} />
            🎨
          </button>
          {showColors && (
            <div
              style={{
                position: 'absolute', top: '110%', left: 0, zIndex: 30,
                background: '#fff', border: '1px solid #DFE6E9', borderRadius: 6,
                padding: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                display: 'flex', gap: 4,
              }}
              onPointerDown={e => e.stopPropagation()}
            >
              {STICKY_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => { updateStickyNote(note.id, { color: c }); setShowColors(false); }}
                  style={{ width: 20, height: 20, borderRadius: 3, background: c, border: note.color === c ? '2px solid #2D3436' : '1px solid rgba(0,0,0,0.1)', cursor: 'pointer', padding: 0 }}
                />
              ))}
            </div>
          )}
        </div>
        <button
          onClick={() => deleteStickyNote(note.id)}
          onPointerDown={e => e.stopPropagation()}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', fontSize: 14, color: '#636E72', lineHeight: 1 }}
          title="Delete"
        >×</button>
      </div>

      {/* Text area — stopPropagation so clicks don't trigger drag */}
      <textarea
        value={note.text}
        onChange={(e) => updateStickyNote(note.id, { text: e.target.value })}
        onClick={e => e.stopPropagation()}
        onDoubleClick={e => e.stopPropagation()}
        onPointerDown={e => e.stopPropagation()}
        placeholder="Type your note..."
        style={{
          flex: 1, background: 'none', border: 'none', outline: 'none',
          resize: 'none', fontFamily: 'inherit', fontSize: 13, color: '#2D3436',
          lineHeight: 1.5, cursor: 'text', padding: '6px 8px',
        }}
      />

      {/* Resize handle — bottom-right only */}
      <div
        className="sticky-resize"
        onMouseDown={handleResizeMouseDown}
        onTouchStart={handleResizeTouchStart}
        style={{
          position: 'absolute', bottom: 0, right: 0,
          width: 16, height: 16, cursor: 'se-resize',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end',
          padding: '2px',
        }}
      >
        <svg width="10" height="10" viewBox="0 0 10 10">
          <path d="M1 9 L9 1 M5 9 L9 5 M9 9 L9 9" stroke="#aaa" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </div>
    </div>
  );
};
