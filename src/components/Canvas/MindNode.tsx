import React, { useRef, useEffect, useCallback } from 'react';
import type { MindMapNode, MapStyle } from '../../types';
import { getNodeDimensions } from '../../utils/layout';
import { getLevelColor, hexToRgba } from '../../utils/colors';
import { useUIStore } from '../../store/uiStore';
import { useMapStore } from '../../store/mapStore';
import { NodeMediaDisplay } from './NodeMedia';

interface MindNodeProps {
  node: MindMapNode;
  isRoot: boolean;
  isSelected: boolean;
  isMultiSelected: boolean;
  isEditing: boolean;
  mapStyle: MapStyle;
  themeColor: string;
  depth: number;
  onSelect: (id: string, e: React.MouseEvent) => void;
  onDoubleClick: (id: string) => void;
  onAddChild: (id: string) => void;
  onAddChildLeft?: (id: string) => void;
  onAddChildTop?: (id: string) => void;
  onAddChildBottom?: (id: string) => void;
  onDragStart: (id: string, e: React.MouseEvent) => void;
  onContextMenu: (id: string, e: React.MouseEvent) => void;
}

const FONT_SIZE_MAP = { xs: 11, s: 12, m: 14, l: 17, xl: 21 };

const ADD_BTN_SIZE = 22;
const ADD_BTN_OFFSET = 28;

export const MindNode: React.FC<MindNodeProps> = ({
  node, isRoot, isSelected, isMultiSelected, isEditing,
  mapStyle, themeColor, depth,
  onSelect, onDoubleClick, onAddChild, onAddChildLeft,
  onAddChildTop, onAddChildBottom,
  onDragStart, onContextMenu,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { setEditingNode, setHoveredNode, hoveredNodeId } = useUIStore();
  const { updateNodeText, toggleCollapse } = useMapStore();

  const dims = getNodeDimensions(node);
  const fontSize = FONT_SIZE_MAP[node.style.fontSize] ?? 14;
  const isHovered = hoveredNodeId === node.id;
  const hasMedia = !!(node.content.media?.image || node.content.media?.link);
  const isStarred = node.content.isStarred;

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateNodeText(node.id, e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = e.target.scrollHeight + 'px';
  }, [node.id, updateNodeText]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); setEditingNode(null); }
    if (e.key === 'Escape') setEditingNode(null);
    e.stopPropagation();
  }, [setEditingNode]);

  // Resolve colors
  let fillColor: string;
  let textColor: string;
  let borderColor: string;
  let borderWidth: number;

  if (node.style.fillColor) {
    fillColor = node.style.fillColor;
    textColor = node.style.textColor || '#ffffff';
    borderColor = node.style.borderColor || node.style.fillColor;
    borderWidth = 0;
  } else if (mapStyle === 'productive') {
    const lc = getLevelColor(depth);
    fillColor = hexToRgba(lc, 0.15);
    textColor = node.style.textColor || '#2D3436';
    borderColor = lc;
    borderWidth = 1.5;
  } else if (mapStyle === 'simple') {
    fillColor = 'transparent';
    textColor = node.style.textColor || '#2D3436';
    borderColor = 'transparent';
    borderWidth = 0;
  } else {
    if (isRoot) {
      fillColor = themeColor;
      textColor = node.style.textColor || '#ffffff';
      borderColor = themeColor;
      borderWidth = 0;
    } else {
      fillColor = '#ffffff';
      textColor = node.style.textColor || '#2D3436';
      borderColor = '#DFE6E9';
      borderWidth = 1.5;
    }
  }

  if (node.style.textColor) textColor = node.style.textColor;

  if (isSelected || isMultiSelected) {
    borderColor = isMultiSelected ? '#00B894' : themeColor;
    borderWidth = 2;
  }

  const shapeMap = { rounded: '8px', rectangle: '0px', pill: '999px', circle: '50%' };
  const borderRadius = shapeMap[node.style.shape] || '8px';
  const hasChildren = node.childrenIds.length > 0;
  const hasNote = node.content.note.trim().length > 0;
  const hasAttachments = node.content.attachments.length > 0;

  const nodeWidth = hasMedia ? Math.max(dims.w, 180) : dims.w;
  const showAddButtons = (isHovered || isSelected) && !isEditing && !node.position.collapsed;

  // Shared add button style factory
  const addBtnStyle = (extraStyle: React.CSSProperties): React.CSSProperties => ({
    position: 'absolute',
    width: ADD_BTN_SIZE,
    height: ADD_BTN_SIZE,
    borderRadius: '50%',
    background: themeColor,
    border: 'none',
    cursor: 'pointer',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 16,
    lineHeight: 1,
    zIndex: 10,
    opacity: 0.8,
    transition: 'opacity 120ms, transform 120ms',
    boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
    ...extraStyle,
  });

  const addBtnHover = (base: React.CSSProperties, transform: string) => ({
    onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => {
      e.currentTarget.style.opacity = '1';
      e.currentTarget.style.transform = transform.replace('scale(1)', 'scale(1.1)');
    },
    onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => {
      e.currentTarget.style.opacity = '0.8';
      e.currentTarget.style.transform = transform;
    },
  });

  return (
    <div
      className="node-wrapper"
      data-node-id={node.id}
      style={{ left: node.position.x, top: node.position.y }}
      onMouseEnter={() => setHoveredNode(node.id)}
      onMouseLeave={() => setHoveredNode(null)}
    >
      <div
        role="button"
        aria-label={node.content.text || 'New node'}
        aria-selected={isSelected}
        style={{
          width: nodeWidth,
          minHeight: dims.h,
          backgroundColor: fillColor,
          border: `${borderWidth}px solid ${borderColor}`,
          borderRadius,
          boxShadow: isSelected
            ? `0 0 0 2px ${hexToRgba(themeColor, 0.3)}, 0 2px 10px rgba(0,0,0,0.12)`
            : isMultiSelected
            ? `0 0 0 2px rgba(0,184,148,0.4), 0 2px 8px rgba(0,0,0,0.1)`
            : isHovered
            ? '0 3px 14px rgba(0,0,0,0.14)'
            : '0 1px 4px rgba(0,0,0,0.06)',
          cursor: isEditing ? 'text' : 'grab',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: hasMedia ? '6px 10px' : '8px 14px',
          transition: 'box-shadow 120ms ease, border-color 120ms ease',
          position: 'relative',
          userSelect: 'none',
          gap: hasMedia ? 6 : 0,
        }}
        onClick={(e) => { if (!isEditing) onSelect(node.id, e); }}
        onDoubleClick={(e) => { e.stopPropagation(); onDoubleClick(node.id); }}
        onMouseDown={(e) => { if (!isEditing) { e.stopPropagation(); onDragStart(node.id, e); } }}
        onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); onContextMenu(node.id, e); }}
      >
        {/* Media: image + link rendered above text */}
        {hasMedia && node.content.media && (
          <div style={{ width: '100%' }} onMouseDown={e => e.stopPropagation()}>
            <NodeMediaDisplay nodeId={node.id} media={node.content.media} />
          </div>
        )}

        {isEditing ? (
          <textarea
            ref={textareaRef}
            className="node-edit-input"
            value={node.content.text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            onBlur={() => setEditingNode(null)}
            rows={1}
            style={{
              fontSize,
              fontWeight: node.style.fontWeight === 'bold' ? 700 : 400,
              color: textColor,
              minHeight: fontSize * 1.4,
              width: '100%',
            }}
          />
        ) : (
          <span style={{
            fontSize,
            fontWeight: node.style.fontWeight === 'bold' ? 700 : 400,
            color: textColor,
            lineHeight: 1.4,
            wordBreak: 'break-word',
            textAlign: 'center',
            whiteSpace: node.content.text ? 'pre-wrap' : 'nowrap',
            opacity: node.content.text ? 1 : 0.4,
          }}>
            {node.content.text || 'New node'}
          </span>
        )}

        {/* Badges */}
        <div style={{ position: 'absolute', top: -4, right: -4, display: 'flex', gap: 3 }}>
          {isStarred && (
            <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#FDCB6E', border: '1.5px solid white' }} title="Favori" />
          )}
          {hasNote && (
            <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#00B894', border: '1.5px solid white' }} title="Has note" />
          )}
          {hasAttachments && (
            <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#74B9FF', border: '1.5px solid white' }} title="Has attachments" />
          )}
        </div>

        {/* Collapse/Expand button — inside the node, bottom-right corner */}
        {hasChildren && (
          <button
            onClick={(e) => { e.stopPropagation(); toggleCollapse(node.id); }}
            onDoubleClick={e => e.stopPropagation()}
            onMouseDown={e => e.stopPropagation()}
            style={{
              position: 'absolute',
              bottom: 3,
              right: 5,
              width: 14,
              height: 14,
              borderRadius: '50%',
              background: hexToRgba(themeColor, 0.15),
              border: `1px solid ${hexToRgba(themeColor, 0.5)}`,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 9,
              color: themeColor,
              zIndex: 10,
              lineHeight: 1,
              padding: 0,
              transition: 'background 120ms',
            }}
            aria-label={node.position.collapsed ? 'Expand' : 'Collapse'}
            title={node.position.collapsed ? 'Développer' : 'Réduire'}
          >
            {node.position.collapsed ? '+' : '−'}
          </button>
        )}
      </div>

      {/* ── Add child buttons (visible on hover/select) ── */}

      {/* RIGHT */}
      {showAddButtons && (
        <button
          onClick={(e) => { e.stopPropagation(); onAddChild(node.id); }}
          onDoubleClick={e => e.stopPropagation()}
          onMouseDown={e => e.stopPropagation()}
          style={addBtnStyle({
            right: -ADD_BTN_OFFSET,
            top: '50%',
            transform: 'translateY(-50%)',
          })}
          {...addBtnHover({}, 'translateY(-50%) scale(1)')}
          title="Ajouter un enfant à droite (Tab)"
          aria-label="Add child node right"
        >
          +
        </button>
      )}

      {/* LEFT */}
      {showAddButtons && onAddChildLeft && (
        <button
          onClick={(e) => { e.stopPropagation(); onAddChildLeft(node.id); }}
          onDoubleClick={e => e.stopPropagation()}
          onMouseDown={e => e.stopPropagation()}
          style={addBtnStyle({
            left: -ADD_BTN_OFFSET,
            top: '50%',
            transform: 'translateY(-50%)',
          })}
          {...addBtnHover({}, 'translateY(-50%) scale(1)')}
          title="Ajouter un enfant à gauche"
          aria-label="Add child node left"
        >
          +
        </button>
      )}

      {/* TOP */}
      {showAddButtons && onAddChildTop && (
        <button
          onClick={(e) => { e.stopPropagation(); onAddChildTop(node.id); }}
          onDoubleClick={e => e.stopPropagation()}
          onMouseDown={e => e.stopPropagation()}
          style={addBtnStyle({
            top: -ADD_BTN_OFFSET,
            left: '50%',
            transform: 'translateX(-50%)',
          })}
          {...addBtnHover({}, 'translateX(-50%) scale(1)')}
          title="Ajouter un enfant au-dessus"
          aria-label="Add child node above"
        >
          +
        </button>
      )}

      {/* BOTTOM */}
      {showAddButtons && onAddChildBottom && (
        <button
          onClick={(e) => { e.stopPropagation(); onAddChildBottom(node.id); }}
          onDoubleClick={e => e.stopPropagation()}
          onMouseDown={e => e.stopPropagation()}
          style={addBtnStyle({
            bottom: -ADD_BTN_OFFSET,
            left: '50%',
            transform: 'translateX(-50%)',
          })}
          {...addBtnHover({}, 'translateX(-50%) scale(1)')}
          title="Ajouter un enfant en dessous"
          aria-label="Add child node below"
        >
          +
        </button>
      )}
    </div>
  );
};
