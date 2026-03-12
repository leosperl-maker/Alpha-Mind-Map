import React, { useRef, useState } from 'react';
import type { StickyNote as StickyNoteType } from '../../types';
import { useMapStore } from '../../store/mapStore';
import { STICKY_COLORS } from '../../utils/colors';

interface StickyNoteProps {
  note: StickyNoteType;
}

export const StickyNote: React.FC<StickyNoteProps> = ({ note }) => {
  const { updateStickyNote, deleteStickyNote } = useMapStore();
  const dragRef = useRef<{ startX: number; startY: number; noteX: number; noteY: number } | null>(null);
  const resizeRef = useRef<{ startX: number; startY: number; startW: number; startH: number } | null>(null);
  const [showColors, setShowColors] = useState(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).tagName === 'TEXTAREA') return;
    if ((e.target as HTMLElement).closest('.sticky-resize')) return;
    if ((e.target as HTMLElement).closest('.sticky-controls')) return;
    e.stopPropagation();
    dragRef.current = { startX: e.clientX, startY: e.clientY, noteX: note.x, noteY: note.y };

    const onMove = (me: MouseEvent) => {
      if (!dragRef.current) return;
      updateStickyNote(note.id, {
        x: dragRef.current.noteX + (me.clientX - dragRef.current.startX),
        y: dragRef.current.noteY + (me.clientY - dragRef.current.startY),
      });
    };
    const onUp = () => {
      dragRef.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    resizeRef.current = {
      startX: e.clientX, startY: e.clientY,
      startW: note.width, startH: note.height,
    };
    const onMove = (me: MouseEvent) => {
      if (!resizeRef.current) return;
      updateStickyNote(note.id, {
        width: Math.max(120, resizeRef.current.startW + (me.clientX - resizeRef.current.startX)),
        height: Math.max(80, resizeRef.current.startH + (me.clientY - resizeRef.current.startY)),
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

  return (
    <div
      className="sticky-note"
      style={{
        left: note.x, top: note.y,
        width: note.width, height: note.height,
        backgroundColor: note.color,
        borderRadius: 3,
        boxShadow: '3px 5px 16px rgba(0,0,0,0.18)',
        display: 'flex', flexDirection: 'column',
        zIndex: 5, cursor: 'grab',
        border: '1px solid rgba(0,0,0,0.06)',
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Header */}
      <div
        className="sticky-controls"
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 6px', borderBottom: '1px solid rgba(0,0,0,0.08)' }}
        onMouseDown={e => e.stopPropagation()}
      >
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowColors(!showColors)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', fontSize: 12, color: '#636E72', display: 'flex', alignItems: 'center', gap: 3 }}
            title="Change color"
          >
            <span style={{ width: 12, height: 12, borderRadius: 2, background: note.color, border: '1px solid rgba(0,0,0,0.2)', display: 'inline-block' }} />
            🎨
          </button>
          {showColors && (
            <div style={{
              position: 'absolute', top: '110%', left: 0, zIndex: 30,
              background: '#fff', border: '1px solid #DFE6E9', borderRadius: 6,
              padding: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
              display: 'flex', gap: 4,
            }}
            onMouseDown={e => e.stopPropagation()}
            >
              {STICKY_COLORS.map(c => (
                <button key={c} onClick={() => { updateStickyNote(note.id, { color: c }); setShowColors(false); }}
                  style={{ width: 20, height: 20, borderRadius: 3, background: c, border: note.color === c ? '2px solid #2D3436' : '1px solid rgba(0,0,0,0.1)', cursor: 'pointer', padding: 0 }}
                />
              ))}
            </div>
          )}
        </div>
        <button
          onClick={() => deleteStickyNote(note.id)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', fontSize: 14, color: '#636E72', lineHeight: 1 }}
          title="Delete"
        >×</button>
      </div>

      {/* Text area */}
      <textarea
        value={note.text}
        onChange={(e) => updateStickyNote(note.id, { text: e.target.value })}
        onClick={e => e.stopPropagation()}
        onMouseDown={e => e.stopPropagation()}
        placeholder="Type your note..."
        style={{
          flex: 1, background: 'none', border: 'none', outline: 'none',
          resize: 'none', fontFamily: 'inherit', fontSize: 13, color: '#2D3436',
          lineHeight: 1.5, cursor: 'text', padding: '6px 8px',
        }}
      />

      {/* Resize handle */}
      <div
        className="sticky-resize"
        onMouseDown={handleResizeMouseDown}
        style={{
          position: 'absolute', bottom: 0, right: 0,
          width: 14, height: 14, cursor: 'nw-resize',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end',
          padding: '2px',
        }}
      >
        <svg width="8" height="8" viewBox="0 0 8 8">
          <path d="M0 8 L8 0 M4 8 L8 4" stroke="#999" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </div>
    </div>
  );
};
