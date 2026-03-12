import React, { useRef, useCallback, useEffect, useState } from 'react';
import { useMapStore } from '../../store/mapStore';
import { useUIStore } from '../../store/uiStore';
import { MindNode } from './MindNode';
import { Connector } from './Connector';
import { StickyNote } from './StickyNote';
import { Minimap } from './Minimap';
import type { MindMapNode } from '../../types';

function getNodeDepth(nodeId: string, nodes: Record<string, MindMapNode>): number {
  let depth = 0;
  let current = nodes[nodeId];
  while (current && current.parentId) {
    depth++;
    current = nodes[current.parentId];
  }
  return depth;
}

function collectVisibleEdges(
  nodeId: string,
  nodes: Record<string, MindMapNode>
): Array<{ parent: MindMapNode; child: MindMapNode }> {
  const node = nodes[nodeId];
  if (!node || node.position.collapsed) return [];
  const edges: Array<{ parent: MindMapNode; child: MindMapNode }> = [];
  for (const childId of node.childrenIds) {
    const child = nodes[childId];
    if (child) {
      edges.push({ parent: node, child });
      edges.push(...collectVisibleEdges(childId, nodes));
    }
  }
  return edges;
}

export const MindMapCanvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const maps = useMapStore(s => s.maps);
  const activeMapId = useMapStore(s => s.activeMapId);
  const addNode = useMapStore(s => s.addNode);
  const addSiblingNode = useMapStore(s => s.addSiblingNode);
  const deleteNode = useMapStore(s => s.deleteNode);
  const moveNode = useMapStore(s => s.moveNode);
  const updateNodePosition = useMapStore(s => s.updateNodePosition);
  const undo = useMapStore(s => s.undo);
  const redo = useMapStore(s => s.redo);
  const addStickyNote = useMapStore(s => s.addStickyNote);

  const {
    zoom, panX, panY, selectedNodeId, selectedNodeIds, editingNodeId, showMinimap,
    selectedConnectorId,
    setZoom, setPan, setSelectedNode, setEditingNode, fitToScreen,
    setSelectedConnector, setContextMenu, toggleMultiSelect,
  } = useUIStore();

  const map = maps.find(m => m.id === activeMapId);

  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const [isPanningActive, setIsPanningActive] = useState(false);
  const [dims, setDims] = useState({ w: window.innerWidth, h: window.innerHeight });

  // Node drag state — BUG 1 fix
  const nodeDragRef = useRef<{
    nodeId: string;
    startClientX: number;
    startClientY: number;
    startWorldX: number;
    startWorldY: number;
    dragged: boolean;
  } | null>(null);

  useEffect(() => {
    const ro = new ResizeObserver(entries => {
      for (const e of entries) {
        setDims({ w: e.contentRect.width, h: e.contentRect.height });
      }
    });
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!map) return;
    const nodes = Object.values(map.nodes);
    if (nodes.length === 0) return;
    const xs = nodes.map(n => n.position.x);
    const ys = nodes.map(n => n.position.y);
    fitToScreen(dims.w, dims.h, {
      minX: Math.min(...xs), minY: Math.min(...ys),
      maxX: Math.max(...xs), maxY: Math.max(...ys),
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMapId]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const rect = containerRef.current!.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    if (e.ctrlKey || e.metaKey) {
      const factor = e.deltaY < 0 ? 1.1 : 0.9;
      const newZoom = Math.max(0.2, Math.min(3, zoom * factor));
      setZoom(newZoom);
      setPan(cx - (cx - panX) * (newZoom / zoom), cy - (cy - panY) * (newZoom / zoom));
    } else {
      setPan(panX - e.deltaX, panY - e.deltaY);
    }
  }, [zoom, panX, panY, setZoom, setPan]);

  // Canvas mouseDown — only fires on empty canvas because MindNode calls stopPropagation
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest('.sticky-note')) return;
    isPanning.current = true;
    setIsPanningActive(true);
    panStart.current = { x: e.clientX, y: e.clientY, panX, panY };
  }, [panX, panY]);

  // BUG 1 FIX: real-time node position update while dragging
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    // Node drag takes priority — stops canvas pan
    if (nodeDragRef.current) {
      const dr = nodeDragRef.current;
      const dx = e.clientX - dr.startClientX;
      const dy = e.clientY - dr.startClientY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        dr.dragged = true;
        updateNodePosition(dr.nodeId, dr.startWorldX + dx / zoom, dr.startWorldY + dy / zoom);
      }
      return;
    }

    if (isPanning.current) {
      const dx = e.clientX - panStart.current.x;
      const dy = e.clientY - panStart.current.y;
      setPan(panStart.current.panX + dx, panStart.current.panY + dy);
    }
  }, [setPan, zoom, updateNodePosition]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (isPanning.current) {
      isPanning.current = false;
      setIsPanningActive(false);
    }

    if (nodeDragRef.current) {
      const dr = nodeDragRef.current;
      if (dr.dragged && map) {
        // Check for reparent on drop
        const worldX = (e.clientX - panX) / zoom;
        const worldY = (e.clientY - panY) / zoom;
        for (const node of Object.values(map.nodes)) {
          if (node.id === dr.nodeId) continue;
          const dist = Math.sqrt(
            Math.pow(node.position.x - worldX, 2) + Math.pow(node.position.y - worldY, 2)
          );
          if (dist < 60) {
            moveNode(dr.nodeId, node.id);
            break;
          }
        }
      }
      nodeDragRef.current = null;
    }
  }, [map, moveNode, panX, panY, zoom]);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.sticky-note')) return;
    setSelectedNode(null);
    setEditingNode(null);
    setSelectedConnector(null);
    setContextMenu(null);
  }, [setSelectedNode, setEditingNode, setSelectedConnector, setContextMenu]);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.sticky-note')) return;
    if ((e.target as HTMLElement).closest('.node-wrapper')) return;
    const rect = containerRef.current!.getBoundingClientRect();
    const wx = (e.clientX - rect.left - panX) / zoom;
    const wy = (e.clientY - rect.top - panY) / zoom;
    addStickyNote(wx, wy);
  }, [panX, panY, zoom, addStickyNote]);

  const handleNodeSelect = useCallback((nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (e.ctrlKey || e.metaKey) {
      toggleMultiSelect(nodeId);
    } else {
      setSelectedNode(nodeId);
      setEditingNode(null);
    }
  }, [setSelectedNode, setEditingNode, toggleMultiSelect]);

  const handleNodeDoubleClick = useCallback((nodeId: string) => {
    setSelectedNode(nodeId);
    setEditingNode(nodeId);
  }, [setSelectedNode, setEditingNode]);

  const handleAddChild = useCallback((nodeId: string) => {
    const newId = addNode(nodeId);
    setSelectedNode(newId);
    setTimeout(() => setEditingNode(newId), 50);
  }, [addNode, setSelectedNode, setEditingNode]);

  // Called by MindNode's onDragStart — node's onMouseDown already called stopPropagation
  // so canvas handleMouseDown never fires for node drags
  const handleNodeDragStart = useCallback((nodeId: string, e: React.MouseEvent) => {
    if (!map) return;
    const node = map.nodes[nodeId];
    if (!node) return;
    isPanning.current = false;
    setIsPanningActive(false);
    nodeDragRef.current = {
      nodeId,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startWorldX: node.position.x,
      startWorldY: node.position.y,
      dragged: false,
    };
  }, [map]);

  const handleContextMenu = useCallback((nodeId: string, e: React.MouseEvent) => {
    setContextMenu({ x: e.clientX, y: e.clientY, nodeId });
    setSelectedNode(nodeId);
  }, [setContextMenu, setSelectedNode]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (editingNodeId) return;
      if (!map) return;

      const ctrl = e.ctrlKey || e.metaKey;

      if (ctrl && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); return; }
      if (ctrl && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redo(); return; }
      if (ctrl && e.key === 'f') { e.preventDefault(); useUIStore.getState().setSearchOpen(true); return; }

      if (e.key === 'Tab' && selectedNodeId) {
        e.preventDefault();
        const newId = addNode(selectedNodeId);
        setSelectedNode(newId);
        setTimeout(() => setEditingNode(newId), 50);
        return;
      }
      if (e.key === 'Enter' && selectedNodeId) {
        e.preventDefault();
        const newId = addSiblingNode(selectedNodeId);
        if (newId) { setSelectedNode(newId); setTimeout(() => setEditingNode(newId), 50); }
        return;
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedNodeId) {
        e.preventDefault();
        deleteNode(selectedNodeId);
        setSelectedNode(null);
        return;
      }
      if (e.key === 'F2' && selectedNodeId) {
        e.preventDefault();
        setEditingNode(selectedNodeId);
        return;
      }
      if (e.key === ' ' && selectedNodeId) {
        e.preventDefault();
        const node = map.nodes[selectedNodeId];
        if (node?.childrenIds.length) useMapStore.getState().toggleCollapse(selectedNodeId);
        return;
      }
      if (e.key === 'ArrowRight' && selectedNodeId) {
        e.preventDefault();
        const node = map.nodes[selectedNodeId];
        if (node?.childrenIds.length) setSelectedNode(node.childrenIds[0]);
        return;
      }
      if (e.key === 'ArrowLeft' && selectedNodeId) {
        e.preventDefault();
        const node = map.nodes[selectedNodeId];
        if (node?.parentId) setSelectedNode(node.parentId);
        return;
      }
      if ((e.key === 'ArrowUp' || e.key === 'ArrowDown') && selectedNodeId) {
        e.preventDefault();
        const node = map.nodes[selectedNodeId];
        if (node?.parentId) {
          const parent = map.nodes[node.parentId];
          if (parent) {
            const idx = parent.childrenIds.indexOf(selectedNodeId);
            const dir = e.key === 'ArrowUp' ? -1 : 1;
            setSelectedNode(parent.childrenIds[Math.max(0, Math.min(parent.childrenIds.length - 1, idx + dir))]);
          }
        }
        return;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [editingNodeId, selectedNodeId, map, addNode, addSiblingNode, deleteNode, undo, redo, setSelectedNode, setEditingNode]);

  if (!map) return null;

  const rootIds = map.rootNodeIds || [map.rootNodeId];
  const edges = rootIds.flatMap(rootId => collectVisibleEdges(rootId, map.nodes));
  const allNodes = Object.values(map.nodes);

  return (
    <div
      ref={containerRef}
      className={`canvas-container${isPanningActive ? ' panning' : ''}`}
      style={{ top: 56 }}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={handleCanvasClick}
      onDoubleClick={handleDoubleClick}
    >
      <div
        className="canvas-transform"
        style={{ transform: `translate(${panX}px, ${panY}px) scale(${zoom})` }}
      >
        {/* SVG layer for connectors */}
        <svg className="connector-svg" style={{ width: 1, height: 1, overflow: 'visible' }}>
          {edges.map(({ parent, child }) => (
            <Connector
              key={`${parent.id}|${child.id}`}
              parent={parent}
              child={child}
              mapStyle={map.settings.style}
              themeColor={map.settings.themeColor}
              depth={getNodeDepth(child.id, map.nodes)}
              isSelected={selectedConnectorId === `${parent.id}|${child.id}`}
              onSelect={setSelectedConnector}
            />
          ))}
        </svg>

        {/* Sticky notes */}
        {map.stickyNotes.map(note => (
          <StickyNote key={note.id} note={note} />
        ))}

        {/* Nodes */}
        {allNodes.map(node => (
          <MindNode
            key={node.id}
            node={node}
            isRoot={rootIds.includes(node.id)}
            isSelected={selectedNodeId === node.id}
            isMultiSelected={selectedNodeIds.includes(node.id) && selectedNodeIds.length > 1}
            isEditing={editingNodeId === node.id}
            mapStyle={map.settings.style}
            themeColor={map.settings.themeColor}
            depth={getNodeDepth(node.id, map.nodes)}
            onSelect={handleNodeSelect}
            onDoubleClick={handleNodeDoubleClick}
            onAddChild={handleAddChild}
            onDragStart={handleNodeDragStart}
            onContextMenu={handleContextMenu}
          />
        ))}
      </div>

      {/* Zoom controls */}
      <div style={{ position: 'absolute', bottom: 16, left: 16, display: 'flex', flexDirection: 'column', gap: 4, zIndex: 20 }}>
        <button onClick={() => setZoom(Math.min(3, zoom * 1.2))} style={zoomBtnStyle} title="Zoom in" aria-label="Zoom in">+</button>
        <button onClick={() => setZoom(Math.max(0.2, zoom * 0.8))} style={zoomBtnStyle} title="Zoom out" aria-label="Zoom out">−</button>
        <button
          onClick={() => {
            const nodes = Object.values(map.nodes);
            const xs = nodes.map(n => n.position.x);
            const ys = nodes.map(n => n.position.y);
            fitToScreen(dims.w, dims.h, { minX: Math.min(...xs), minY: Math.min(...ys), maxX: Math.max(...xs), maxY: Math.max(...ys) });
          }}
          style={{ ...zoomBtnStyle, fontSize: 11 }}
          title="Fit to screen"
          aria-label="Fit to screen"
        >⊡</button>
        <span style={{ background: 'white', border: '1px solid #DFE6E9', borderRadius: 6, padding: '2px 6px', fontSize: 11, color: '#636E72', textAlign: 'center' }}>
          {Math.round(zoom * 100)}%
        </span>
      </div>

      {/* Minimap */}
      {showMinimap && (
        <div style={{ position: 'absolute', bottom: 16, right: 16, zIndex: 20 }}>
          <Minimap map={map} canvasW={dims.w} canvasH={dims.h} zoom={zoom} panX={panX} panY={panY} />
        </div>
      )}
    </div>
  );
};

const zoomBtnStyle: React.CSSProperties = {
  width: 32, height: 32, background: 'white', border: '1px solid #DFE6E9',
  borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center',
  justifyContent: 'center', fontSize: 18, color: '#2D3436',
  boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
};
