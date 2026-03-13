import React, { useRef, useCallback, useEffect, useState } from 'react';
import { useMapStore } from '../../store/mapStore';
import { useUIStore } from '../../store/uiStore';
import { MindNode } from './MindNode';
import { Connector } from './Connector';
import { StickyNote } from './StickyNote';
import { Minimap } from './Minimap';
import { CrossConnectorLayer } from './CrossConnectorLayer';
import { getNodeDimensions } from '../../utils/layout';
import type { MindMapNode, NodeMedia } from '../../types';

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

/** Collect all descendant IDs of a node (inclusive) */
function collectSubtreeIds(nodeId: string, nodes: Record<string, MindMapNode>): Set<string> {
  const ids = new Set<string>();
  function walk(id: string) {
    ids.add(id);
    const n = nodes[id];
    if (n) n.childrenIds.forEach(walk);
  }
  walk(nodeId);
  return ids;
}

function getTouchDist(touches: React.TouchList): number {
  if (touches.length < 2) return 0;
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

export const MindMapCanvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const maps = useMapStore(s => s.maps);
  const activeMapId = useMapStore(s => s.activeMapId);
  const addNode = useMapStore(s => s.addNode);
  const addNodeOnSide = useMapStore(s => s.addNodeOnSide);
  const addSiblingNode = useMapStore(s => s.addSiblingNode);
  const deleteNode = useMapStore(s => s.deleteNode);
  const moveNode = useMapStore(s => s.moveNode);
  const batchUpdateNodePositions = useMapStore(s => s.batchUpdateNodePositions);
  const updateNodePosition = useMapStore(s => s.updateNodePosition);
  const updateNodeMedia = useMapStore(s => s.updateNodeMedia);
  const addCrossConnector = useMapStore(s => s.addCrossConnector);
  const undo = useMapStore(s => s.undo);
  const redo = useMapStore(s => s.redo);
  const addStickyNote = useMapStore(s => s.addStickyNote);

  const {
    zoom, panX, panY, selectedNodeId, selectedNodeIds, editingNodeId, showMinimap,
    selectedConnectorId, focusModeNodeId, pendingCrossConnect,
    setZoom, setPan, setSelectedNode, setEditingNode, fitToScreen,
    setSelectedConnector, setContextMenu, toggleMultiSelect, setPendingCrossConnect,
  } = useUIStore();

  const map = maps.find(m => m.id === activeMapId);

  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const [isPanningActive, setIsPanningActive] = useState(false);
  const [dims, setDims] = useState({ w: window.innerWidth, h: window.innerHeight });

  const nodeDragRef = useRef<{
    nodeId: string;
    startClientX: number;
    startClientY: number;
    startWorldX: number;
    startWorldY: number;
    dragged: boolean;
    subtreeStartPositions: Map<string, { x: number; y: number }>;
  } | null>(null);

  const touchStartRef = useRef<{ x: number; y: number; time: number; dist: number } | null>(null);
  const lastTapRef = useRef<{ time: number; x: number; y: number } | null>(null);
  const isCreatingStickyNoteRef = useRef(false);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchPanRef = useRef<{ panX: number; panY: number; x: number; y: number } | null>(null);
  const pinchRef = useRef<{ dist: number; zoom: number; midX: number; midY: number } | null>(null);

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

  // Paste image from clipboard
  useEffect(() => {
    const handler = async (e: ClipboardEvent) => {
      if (!selectedNodeId || editingNodeId) return;
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          e.preventDefault();
          const file = item.getAsFile();
          if (!file) continue;
          const reader = new FileReader();
          reader.onload = (ev) => {
            const dataUrl = ev.target?.result as string;
            const currentMap = useMapStore.getState().maps.find(m => m.id === activeMapId);
            const currentNode = currentMap?.nodes[selectedNodeId];
            const existing: NodeMedia = currentNode?.content.media || {};
            updateNodeMedia(selectedNodeId, { ...existing, image: { type: 'base64', data: dataUrl } });
          };
          reader.readAsDataURL(file);
          break;
        }
      }
    };
    window.addEventListener('paste', handler);
    return () => window.removeEventListener('paste', handler);
  }, [selectedNodeId, editingNodeId, activeMapId, updateNodeMedia]);

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

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest('.sticky-note')) return;
    // If cross-connect pending, clicking canvas cancels it
    if (pendingCrossConnect) { setPendingCrossConnect(null); return; }
    isPanning.current = true;
    setIsPanningActive(true);
    panStart.current = { x: e.clientX, y: e.clientY, panX, panY };
  }, [panX, panY, pendingCrossConnect, setPendingCrossConnect]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (nodeDragRef.current) {
      const dr = nodeDragRef.current;
      const dx = e.clientX - dr.startClientX;
      const dy = e.clientY - dr.startClientY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        dr.dragged = true;
        const dxWorld = dx / zoom;
        const dyWorld = dy / zoom;
        const updates: Array<{ id: string; x: number; y: number }> = [];
        dr.subtreeStartPositions.forEach(({ x, y }, id) => {
          updates.push({ id, x: x + dxWorld, y: y + dyWorld });
        });
        batchUpdateNodePositions(updates);
      }
      return;
    }

    if (isPanning.current) {
      const dx = e.clientX - panStart.current.x;
      const dy = e.clientY - panStart.current.y;
      setPan(panStart.current.panX + dx, panStart.current.panY + dy);
    }
  }, [setPan, zoom, batchUpdateNodePositions]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (isPanning.current) {
      isPanning.current = false;
      setIsPanningActive(false);
    }

    if (nodeDragRef.current) {
      const dr = nodeDragRef.current;
      if (dr.dragged && map) {
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
    if (pendingCrossConnect) { setPendingCrossConnect(null); return; }
    setSelectedNode(null);
    setEditingNode(null);
    setSelectedConnector(null);
    setContextMenu(null);
  }, [setSelectedNode, setEditingNode, setSelectedConnector, setContextMenu, pendingCrossConnect, setPendingCrossConnect]);

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

    // Cross-connect mode: clicking a node completes the connection
    if (pendingCrossConnect && pendingCrossConnect !== nodeId) {
      addCrossConnector(pendingCrossConnect, nodeId);
      setPendingCrossConnect(null);
      return;
    }

    if (e.ctrlKey || e.metaKey) {
      toggleMultiSelect(nodeId);
    } else {
      setSelectedNode(nodeId);
      setEditingNode(null);
    }
  }, [setSelectedNode, setEditingNode, toggleMultiSelect, pendingCrossConnect, addCrossConnector, setPendingCrossConnect]);

  const handleNodeDoubleClick = useCallback((nodeId: string) => {
    setSelectedNode(nodeId);
    setEditingNode(nodeId);
  }, [setSelectedNode, setEditingNode]);

  const handleAddChild = useCallback((nodeId: string) => {
    const newId = addNode(nodeId);
    setSelectedNode(newId);
    setTimeout(() => setEditingNode(newId), 50);
  }, [addNode, setSelectedNode, setEditingNode]);

  const handleAddChildLeft = useCallback((nodeId: string) => {
    const newId = addNodeOnSide(nodeId, 'left');
    setSelectedNode(newId);
    setTimeout(() => setEditingNode(newId), 50);
  }, [addNodeOnSide, setSelectedNode, setEditingNode]);

  const handleAddChildTop = useCallback((nodeId: string) => {
    if (!map) return;
    const parent = map.nodes[nodeId];
    if (!parent) return;
    const dims = getNodeDimensions(parent);
    const newId = addNode(nodeId);
    updateNodePosition(newId, parent.position.x, parent.position.y - dims.h - 60);
    setSelectedNode(newId);
    setTimeout(() => setEditingNode(newId), 50);
  }, [map, addNode, updateNodePosition, setSelectedNode, setEditingNode]);

  const handleAddChildBottom = useCallback((nodeId: string) => {
    if (!map) return;
    const parent = map.nodes[nodeId];
    if (!parent) return;
    const dims = getNodeDimensions(parent);
    const newId = addNode(nodeId);
    updateNodePosition(newId, parent.position.x, parent.position.y + dims.h + 60);
    setSelectedNode(newId);
    setTimeout(() => setEditingNode(newId), 50);
  }, [map, addNode, updateNodePosition, setSelectedNode, setEditingNode]);

  const handleNodeDragStart = useCallback((nodeId: string, e: React.MouseEvent) => {
    if (!map) return;
    const node = map.nodes[nodeId];
    if (!node) return;
    isPanning.current = false;
    setIsPanningActive(false);
    const subtreeStartPositions = new Map<string, { x: number; y: number }>();
    collectSubtreeIds(nodeId, map.nodes).forEach(id => {
      const n = map.nodes[id];
      if (n) subtreeStartPositions.set(id, { x: n.position.x, y: n.position.y });
    });
    nodeDragRef.current = {
      nodeId,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startWorldX: node.position.x,
      startWorldY: node.position.y,
      dragged: false,
      subtreeStartPositions,
    };
  }, [map]);

  const handleContextMenu = useCallback((nodeId: string, e: React.MouseEvent) => {
    setContextMenu({ x: e.clientX, y: e.clientY, nodeId });
    setSelectedNode(nodeId);
  }, [setContextMenu, setSelectedNode]);

  // ── Touch handlers ──────────────────────────────────────────────────────────

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('.sticky-note')) return;
    const touches = e.touches;
    if (longPressTimerRef.current) { clearTimeout(longPressTimerRef.current); longPressTimerRef.current = null; }
    const nodeWrapper = (e.target as HTMLElement).closest('.node-wrapper') as HTMLElement | null;
    if (nodeWrapper && touches.length === 1 && map) {
      const nodeId = nodeWrapper.dataset.nodeId;
      if (nodeId && map.nodes[nodeId]) {
        const node = map.nodes[nodeId];
        const t = touches[0];
        isPanning.current = false;
        touchStartRef.current = { x: t.clientX, y: t.clientY, time: Date.now(), dist: 0 };
        touchPanRef.current = null;
        const subtreeStartPositions = new Map<string, { x: number; y: number }>();
        collectSubtreeIds(nodeId, map.nodes).forEach(id => {
          const n = map.nodes[id];
          if (n) subtreeStartPositions.set(id, { x: n.position.x, y: n.position.y });
        });
        nodeDragRef.current = {
          nodeId,
          startClientX: t.clientX,
          startClientY: t.clientY,
          startWorldX: node.position.x,
          startWorldY: node.position.y,
          dragged: false,
          subtreeStartPositions,
        };
        return;
      }
    }
    if (touches.length === 1) {
      const t = touches[0];
      touchStartRef.current = { x: t.clientX, y: t.clientY, time: Date.now(), dist: 0 };
      touchPanRef.current = { panX, panY, x: t.clientX, y: t.clientY };
      pinchRef.current = null;
      longPressTimerRef.current = setTimeout(() => {
        if (touchStartRef.current) {
          setContextMenu({ x: touchStartRef.current.x, y: touchStartRef.current.y, nodeId: selectedNodeId || '' });
        }
        longPressTimerRef.current = null;
      }, 500);
    } else if (touches.length === 2) {
      if (longPressTimerRef.current) { clearTimeout(longPressTimerRef.current); longPressTimerRef.current = null; }
      const dist = getTouchDist(touches);
      const midX = (touches[0].clientX + touches[1].clientX) / 2;
      const midY = (touches[0].clientY + touches[1].clientY) / 2;
      pinchRef.current = { dist, zoom, midX, midY };
      touchPanRef.current = null;
      touchStartRef.current = null;
    }
  }, [panX, panY, zoom, selectedNodeId, setContextMenu, map]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    const touches = e.touches;
    if (longPressTimerRef.current && touchStartRef.current) {
      const t = touches[0];
      const dx = t.clientX - touchStartRef.current.x;
      const dy = t.clientY - touchStartRef.current.y;
      if (Math.sqrt(dx * dx + dy * dy) > 5) { clearTimeout(longPressTimerRef.current); longPressTimerRef.current = null; }
    }
    if (nodeDragRef.current && touches.length === 1) {
      const dr = nodeDragRef.current;
      const t = touches[0];
      const dx = t.clientX - dr.startClientX;
      const dy = t.clientY - dr.startClientY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        dr.dragged = true;
        const dxWorld = dx / zoom;
        const dyWorld = dy / zoom;
        const updates: Array<{ id: string; x: number; y: number }> = [];
        dr.subtreeStartPositions.forEach(({ x, y }, id) => {
          updates.push({ id, x: x + dxWorld, y: y + dyWorld });
        });
        batchUpdateNodePositions(updates);
      }
      return;
    }
    if (touches.length === 1 && touchPanRef.current) {
      const t = touches[0];
      const dx = t.clientX - touchPanRef.current.x;
      const dy = t.clientY - touchPanRef.current.y;
      setPan(touchPanRef.current.panX + dx, touchPanRef.current.panY + dy);
    } else if (touches.length === 2 && pinchRef.current) {
      const newDist = getTouchDist(touches);
      const scale = newDist / pinchRef.current.dist;
      const newZoom = Math.max(0.2, Math.min(3, pinchRef.current.zoom * scale));
      const rect = containerRef.current!.getBoundingClientRect();
      const midX = pinchRef.current.midX - rect.left;
      const midY = pinchRef.current.midY - rect.top;
      setZoom(newZoom);
      setPan(midX - (midX - panX) * (newZoom / zoom), midY - (midY - panY) * (newZoom / zoom));
    }
  }, [panX, panY, zoom, setPan, setZoom, batchUpdateNodePositions]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (longPressTimerRef.current) { clearTimeout(longPressTimerRef.current); longPressTimerRef.current = null; }
    if (nodeDragRef.current) {
      const dr = nodeDragRef.current;
      const t = e.changedTouches[0];
      if (!dr.dragged && touchStartRef.current) {
        const dt = Date.now() - touchStartRef.current.time;
        if (dt < 300) {
          if (lastTapRef.current) {
            const tapDt = Date.now() - lastTapRef.current.time;
            const tapDx = t.clientX - lastTapRef.current.x;
            const tapDy = t.clientY - lastTapRef.current.y;
            if (tapDt < 400 && Math.sqrt(tapDx * tapDx + tapDy * tapDy) < 30) {
              setSelectedNode(dr.nodeId); setEditingNode(dr.nodeId);
              lastTapRef.current = null; nodeDragRef.current = null; touchStartRef.current = null;
              return;
            }
          }
          setSelectedNode(dr.nodeId); setEditingNode(null);
          lastTapRef.current = { time: Date.now(), x: t.clientX, y: t.clientY };
        }
      } else if (dr.dragged && map) {
        const worldX = (t.clientX - panX) / zoom;
        const worldY = (t.clientY - panY) / zoom;
        for (const node of Object.values(map.nodes)) {
          if (node.id === dr.nodeId) continue;
          const dist = Math.sqrt(Math.pow(node.position.x - worldX, 2) + Math.pow(node.position.y - worldY, 2));
          if (dist < 60) { moveNode(dr.nodeId, node.id); break; }
        }
      }
      nodeDragRef.current = null; touchStartRef.current = null; touchPanRef.current = null; pinchRef.current = null;
      return;
    }
    if (e.changedTouches.length === 1 && touchStartRef.current) {
      const t = e.changedTouches[0];
      const dx = t.clientX - touchStartRef.current.x;
      const dy = t.clientY - touchStartRef.current.y;
      const dt = Date.now() - touchStartRef.current.time;
      const moved = Math.sqrt(dx * dx + dy * dy);
      if (dt < 200 && moved < 5) {
        if (lastTapRef.current) {
          const tapDt = Date.now() - lastTapRef.current.time;
          const tapDist = Math.sqrt(Math.pow(t.clientX - lastTapRef.current.x, 2) + Math.pow(t.clientY - lastTapRef.current.y, 2));
          if (tapDt < 300 && tapDist < 30) {
            if (!isCreatingStickyNoteRef.current) {
              isCreatingStickyNoteRef.current = true;
              const rect = containerRef.current!.getBoundingClientRect();
              const wx = (t.clientX - rect.left - panX) / zoom;
              const wy = (t.clientY - rect.top - panY) / zoom;
              addStickyNote(wx, wy);
              setTimeout(() => { isCreatingStickyNoteRef.current = false; }, 300);
            }
            lastTapRef.current = null; touchStartRef.current = null;
            return;
          }
        }
        setSelectedNode(null); setEditingNode(null); setSelectedConnector(null); setContextMenu(null);
        lastTapRef.current = { time: Date.now(), x: t.clientX, y: t.clientY };
      }
    }
    touchStartRef.current = null; touchPanRef.current = null; pinchRef.current = null;
  }, [panX, panY, zoom, addStickyNote, setSelectedNode, setEditingNode, setSelectedConnector, setContextMenu, map, moveNode]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (editingNodeId) return;
      if (!map) return;

      const ctrl = e.ctrlKey || e.metaKey;

      if (ctrl && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); return; }
      if (ctrl && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redo(); return; }
      if (ctrl && e.key === 'f') { e.preventDefault(); useUIStore.getState().setSearchOpen(true); return; }

      if (e.key === 'Escape') {
        const { pendingCrossConnect: pcc, focusModeNodeId: fmn, setPendingCrossConnect: spcc, setFocusMode: sfm } = useUIStore.getState();
        if (pcc) { spcc(null); return; }
        if (fmn) { sfm(null); return; }
      }

      if (e.key === 'f' && selectedNodeId && !e.ctrlKey) {
        e.preventDefault();
        const { focusModeNodeId: fmn, setFocusMode: sfm } = useUIStore.getState();
        if (fmn === selectedNodeId) { sfm(null); } else { sfm(selectedNodeId); }
        return;
      }

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
      if (e.key === 'F2' && selectedNodeId) { e.preventDefault(); setEditingNode(selectedNodeId); return; }
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

  // Focus mode: only show subtree of focusModeNodeId
  let visibleNodeIds: Set<string> | null = null;
  if (focusModeNodeId && map.nodes[focusModeNodeId]) {
    visibleNodeIds = collectSubtreeIds(focusModeNodeId, map.nodes);
  }

  const allNodes = Object.values(map.nodes).filter(n =>
    visibleNodeIds ? visibleNodeIds.has(n.id) : true
  );
  const visibleEdges = visibleNodeIds
    ? edges.filter(e => visibleNodeIds!.has(e.parent.id) && visibleNodeIds!.has(e.child.id))
    : edges;

  return (
    <div
      ref={containerRef}
      className={`canvas-container${isPanningActive ? ' panning' : ''}${pendingCrossConnect ? ' cross-connect-mode' : ''}`}
      style={{
        top: 56,
        touchAction: 'none',
        userSelect: 'none',
        cursor: pendingCrossConnect ? 'crosshair' : undefined,
      }}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={handleCanvasClick}
      onDoubleClick={handleDoubleClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="canvas-transform"
        style={{ transform: `translate(${panX}px, ${panY}px) scale(${zoom})` }}
      >
        {/* SVG layer for connectors + cross-connectors */}
        <svg className="connector-svg" style={{ width: 1, height: 1, overflow: 'visible' }}>
          {visibleEdges.map(({ parent, child }) => (
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
          {/* Cross-connectors rendered in same SVG (world coordinates) */}
          <CrossConnectorLayer
            crossConnectors={map.crossConnectors || []}
            nodes={map.nodes}
          />
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
            onAddChildLeft={handleAddChildLeft}
            onAddChildTop={handleAddChildTop}
            onAddChildBottom={handleAddChildBottom}
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

      {/* Cross-connect pending indicator */}
      {pendingCrossConnect && (
        <div style={{
          position: 'absolute', top: 66, left: '50%', transform: 'translateX(-50%)',
          background: '#6C5CE7', color: '#fff', borderRadius: 20, padding: '6px 16px',
          fontSize: 13, zIndex: 30, boxShadow: '0 2px 10px rgba(108,92,231,0.3)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span>↔</span> Cliquez sur le nœud cible à lier
          <button
            onClick={() => setPendingCrossConnect(null)}
            style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: 20, height: 20, color: '#fff', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >×</button>
        </div>
      )}

      {/* Minimap */}
      {showMinimap && !pendingCrossConnect && (
        <div style={{ position: 'absolute', bottom: 16, right: 16, zIndex: 20 }}>
          <Minimap map={map} canvasW={dims.w} canvasH={dims.h} zoom={zoom} panX={panX} panY={panY} />
        </div>
      )}
    </div>
  );
};

const zoomBtnStyle: React.CSSProperties = {
  width: 44, height: 44, background: 'white', border: '1px solid #DFE6E9',
  borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center',
  justifyContent: 'center', fontSize: 18, color: '#2D3436',
  boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
};
