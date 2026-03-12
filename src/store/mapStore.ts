import { create } from 'zustand';
import { v4 as uuid } from 'uuid';
import { useUIStore } from './uiStore';
import type {
  MindMap,
  MindMapNode,
  MapSettings,
  NodeStyle,
  StickyNote,
  HistoryEntry,
} from '../types';
import { computeRadialLayout } from '../utils/layout';

const STORAGE_KEY = 'alpha-mind-map-data';

const DEFAULT_STYLE: NodeStyle = {
  fillColor: null,
  borderColor: null,
  textColor: null,
  fontSize: 'm',
  fontWeight: 'normal',
  shape: 'rounded',
  connectorStyle: 'curved',
  connectorColor: null,
  connectorWidth: 'normal',
};

function createRootNode(id = 'root'): MindMapNode {
  return {
    id,
    parentId: null,
    childrenIds: [],
    content: { text: 'Main Idea', note: '', attachments: [] },
    style: { ...DEFAULT_STYLE, fillColor: '#6C5CE7', textColor: '#ffffff', fontSize: 'l' },
    position: { x: 0, y: 0, collapsed: false },
    comments: [],
    sequenceLabel: null,
  };
}

function createNewMap(title = 'Untitled Map'): MindMap {
  const root = createRootNode();
  return {
    id: uuid(),
    title,
    ownerId: 'local',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isStarred: false,
    tags: [],
    settings: {
      layout: 'standard',
      direction: 'default',
      style: 'bubbles',
      themeColor: '#6C5CE7',
    },
    rootNodeId: root.id,
    rootNodeIds: [root.id],
    nodes: { [root.id]: root },
    stickyNotes: [],
  };
}

function loadFromStorage(): { maps: MindMap[]; activeMapId: string | null } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { maps: [], activeMapId: null };
    const data = JSON.parse(raw);
    // Migrate old maps that don't have rootNodeIds
    const maps = (data.maps || []).map((m: MindMap) => ({
      ...m,
      rootNodeIds: m.rootNodeIds || [m.rootNodeId],
      stickyNotes: (m.stickyNotes || []).map((s: StickyNote) => ({
        ...s,
        width: s.width ?? 180,
        height: s.height ?? 140,
      })),
      nodes: Object.fromEntries(
        Object.entries(m.nodes || {}).map(([k, v]) => {
          const node = v as MindMapNode;
          return [k, {
            ...node,
            style: {
              ...node.style,
              connectorColor: node.style.connectorColor ?? null,
              connectorWidth: node.style.connectorWidth ?? ('normal' as const),
            },
          }];
        })
      ),
    }));
    return { maps, activeMapId: data.activeMapId || null };
  } catch {
    return { maps: [], activeMapId: null };
  }
}

function saveToStorage(maps: MindMap[], activeMapId: string | null) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ maps, activeMapId }));
  } catch { /* ignore */ }
}

export interface MapState {
  maps: MindMap[];
  activeMapId: string | null;
  past: HistoryEntry[];
  future: HistoryEntry[];

  createMap: (title?: string) => string;
  deleteMap: (id: string) => void;
  duplicateMap: (id: string) => string;
  setActiveMap: (id: string) => void;
  renameMap: (id: string, title: string) => void;
  toggleStarMap: (id: string) => void;
  updateSettings: (settings: Partial<MapSettings>) => void;
  importMap: (json: string) => string | null;

  addNode: (parentId: string) => string;
  addRootNode: () => string;
  addSiblingNode: (nodeId: string) => string | null;
  deleteNode: (nodeId: string) => void;
  updateNodeText: (nodeId: string, text: string) => void;
  updateNodeNote: (nodeId: string, note: string) => void;
  updateNodeStyle: (nodeId: string, style: Partial<NodeStyle>) => void;
  updateNodePosition: (nodeId: string, x: number, y: number) => void;
  setNodeSide: (nodeId: string, side: 'left' | 'right') => void;
  toggleCollapse: (nodeId: string) => void;
  moveNode: (nodeId: string, newParentId: string) => void;
  colorBranch: (nodeId: string, color: string) => void;
  duplicateNode: (nodeId: string) => string | null;

  addStickyNote: (x: number, y: number) => void;
  updateStickyNote: (id: string, patch: Partial<StickyNote>) => void;
  deleteStickyNote: (id: string) => void;

  recomputeLayout: () => void;
  undo: () => void;
  redo: () => void;
  pushHistory: () => void;
  save: () => void;
}

function getActiveMap(state: MapState): MindMap | undefined {
  return state.maps.find(m => m.id === state.activeMapId);
}

const initialData = loadFromStorage();

export const useMapStore = create<MapState>((set, get) => ({
  maps: initialData.maps,
  activeMapId: initialData.activeMapId,
  past: [],
  future: [],

  save: () => {
    const { maps, activeMapId } = get();
    saveToStorage(maps, activeMapId);
  },

  createMap: (title) => {
    const map = createNewMap(title);
    set(s => ({ maps: [...s.maps, map], activeMapId: map.id }));
    get().recomputeLayout();
    get().save();
    return map.id;
  },

  deleteMap: (id) => {
    set(s => ({
      maps: s.maps.filter(m => m.id !== id),
      activeMapId: s.activeMapId === id ? (s.maps.find(m => m.id !== id)?.id ?? null) : s.activeMapId,
    }));
    get().save();
  },

  duplicateMap: (id) => {
    const src = get().maps.find(m => m.id === id);
    if (!src) return id;
    const dup: MindMap = {
      ...JSON.parse(JSON.stringify(src)),
      id: uuid(),
      title: src.title + ' (copy)',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    set(s => ({ maps: [...s.maps, dup] }));
    get().save();
    return dup.id;
  },

  setActiveMap: (id) => {
    set({ activeMapId: id, past: [], future: [] });
    get().save();
  },

  renameMap: (id, title) => {
    set(s => ({
      maps: s.maps.map(m => m.id === id ? { ...m, title, updatedAt: new Date().toISOString() } : m),
    }));
    get().save();
  },

  toggleStarMap: (id) => {
    set(s => ({
      maps: s.maps.map(m => m.id === id ? { ...m, isStarred: !m.isStarred } : m),
    }));
    get().save();
  },

  updateSettings: (settings) => {
    const id = get().activeMapId;
    if (!id) return;
    set(s => ({
      maps: s.maps.map(m =>
        m.id === id
          ? { ...m, settings: { ...m.settings, ...settings }, updatedAt: new Date().toISOString() }
          : m
      ),
    }));
    get().recomputeLayout();
  },

  importMap: (json) => {
    try {
      const data = JSON.parse(json);
      if (!data.nodes || !data.rootNodeId) return null;
      const imported: MindMap = {
        ...data,
        id: uuid(),
        title: (data.title || 'Imported Map') + ' (imported)',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        rootNodeIds: data.rootNodeIds || [data.rootNodeId],
      };
      set(s => ({ maps: [...s.maps, imported], activeMapId: imported.id }));
      get().recomputeLayout();
      get().save();
      return imported.id;
    } catch {
      return null;
    }
  },

  addNode: (parentId) => {
    get().pushHistory();
    const id = get().activeMapId;
    if (!id) return '';
    const nodeId = uuid();
    const map = get().maps.find(m => m.id === id);
    if (!map) return '';
    const parent = map.nodes[parentId];
    if (!parent) return '';

    // Determine side: inherit from parent or default to right
    const parentSide = parent.position.side;
    let side: 'left' | 'right' = 'right';
    if (parent.parentId === null) {
      // parent is root — new child goes right by default
      side = 'right';
    } else if (parentSide) {
      side = parentSide;
    }

    const newNode: MindMapNode = {
      id: nodeId,
      parentId,
      childrenIds: [],
      content: { text: '', note: '', attachments: [] },
      style: { ...DEFAULT_STYLE },
      position: { x: 0, y: 0, collapsed: false, side },
      comments: [],
      sequenceLabel: null,
    };
    set(s => ({
      maps: s.maps.map(m => {
        if (m.id !== id) return m;
        const p = m.nodes[parentId];
        if (!p) return m;
        return {
          ...m,
          updatedAt: new Date().toISOString(),
          nodes: {
            ...m.nodes,
            [parentId]: { ...p, childrenIds: [...p.childrenIds, nodeId] },
            [nodeId]: newNode,
          },
        };
      }),
    }));
    get().recomputeLayout();
    return nodeId;
  },

  addRootNode: () => {
    get().pushHistory();
    const id = get().activeMapId;
    if (!id) return '';
    const nodeId = uuid();
    const newRoot: MindMapNode = {
      id: nodeId,
      parentId: null,
      childrenIds: [],
      content: { text: 'New Topic', note: '', attachments: [] },
      style: { ...DEFAULT_STYLE, fillColor: '#00B894', textColor: '#ffffff', fontSize: 'l' },
      position: { x: 300, y: 0, collapsed: false },
      comments: [],
      sequenceLabel: null,
    };
    set(s => ({
      maps: s.maps.map(m => {
        if (m.id !== id) return m;
        return {
          ...m,
          updatedAt: new Date().toISOString(),
          rootNodeIds: [...(m.rootNodeIds || [m.rootNodeId]), nodeId],
          nodes: { ...m.nodes, [nodeId]: newRoot },
        };
      }),
    }));
    return nodeId;
  },

  addSiblingNode: (nodeId) => {
    const map = getActiveMap(get());
    if (!map) return null;
    const node = map.nodes[nodeId];
    if (!node || !node.parentId) return null;
    const sibling = get().addNode(node.parentId);
    // inherit side
    if (node.position.side) {
      get().setNodeSide(sibling, node.position.side);
    }
    return sibling;
  },

  deleteNode: (nodeId) => {
    const map = getActiveMap(get());
    if (!map) return;
    // Can't delete the last root
    const isRoot = (map.rootNodeIds || [map.rootNodeId]).includes(nodeId);
    const rootCount = (map.rootNodeIds || [map.rootNodeId]).length;
    if (isRoot && rootCount <= 1) return;

    get().pushHistory();
    const mapNodes = map.nodes;

    function collectIds(id: string): string[] {
      const n = mapNodes[id];
      if (!n) return [];
      return [id, ...n.childrenIds.flatMap((c: string) => collectIds(c))];
    }

    const toRemove = new Set(collectIds(nodeId));
    const node = map.nodes[nodeId];

    set(s => ({
      maps: s.maps.map(m => {
        if (m.id !== map.id) return m;
        const newNodes = { ...m.nodes };
        toRemove.forEach(id => delete newNodes[id]);
        if (node?.parentId && newNodes[node.parentId]) {
          newNodes[node.parentId] = {
            ...newNodes[node.parentId],
            childrenIds: newNodes[node.parentId].childrenIds.filter(c => c !== nodeId),
          };
        }
        const newRootIds = (m.rootNodeIds || [m.rootNodeId]).filter(r => r !== nodeId);
        return {
          ...m,
          nodes: newNodes,
          rootNodeIds: newRootIds,
          rootNodeId: newRootIds[0] ?? m.rootNodeId,
          updatedAt: new Date().toISOString(),
        };
      }),
    }));
    get().recomputeLayout();
  },

  updateNodeText: (nodeId, text) => {
    const id = get().activeMapId;
    if (!id) return;
    set(s => ({
      maps: s.maps.map(m => {
        if (m.id !== id) return m;
        const node = m.nodes[nodeId];
        if (!node) return m;
        return {
          ...m,
          updatedAt: new Date().toISOString(),
          nodes: { ...m.nodes, [nodeId]: { ...node, content: { ...node.content, text } } },
        };
      }),
    }));
  },

  updateNodeNote: (nodeId, note) => {
    const id = get().activeMapId;
    if (!id) return;
    set(s => ({
      maps: s.maps.map(m => {
        if (m.id !== id) return m;
        const node = m.nodes[nodeId];
        if (!node) return m;
        return {
          ...m,
          nodes: { ...m.nodes, [nodeId]: { ...node, content: { ...node.content, note } } },
        };
      }),
    }));
  },

  updateNodeStyle: (nodeId, style) => {
    get().pushHistory();
    const id = get().activeMapId;
    if (!id) return;
    set(s => ({
      maps: s.maps.map(m => {
        if (m.id !== id) return m;
        const node = m.nodes[nodeId];
        if (!node) return m;
        return {
          ...m,
          nodes: { ...m.nodes, [nodeId]: { ...node, style: { ...node.style, ...style } } },
        };
      }),
    }));
  },

  updateNodePosition: (nodeId, x, y) => {
    const id = get().activeMapId;
    if (!id) return;
    set(s => ({
      maps: s.maps.map(m => {
        if (m.id !== id) return m;
        const node = m.nodes[nodeId];
        if (!node) return m;
        return {
          ...m,
          nodes: {
            ...m.nodes,
            [nodeId]: { ...node, position: { ...node.position, x, y, manuallyPositioned: true } },
          },
        };
      }),
    }));
  },

  setNodeSide: (nodeId, side) => {
    const id = get().activeMapId;
    if (!id) return;
    set(s => ({
      maps: s.maps.map(m => {
        if (m.id !== id) return m;
        const node = m.nodes[nodeId];
        if (!node) return m;
        return {
          ...m,
          nodes: {
            ...m.nodes,
            [nodeId]: { ...node, position: { ...node.position, side } },
          },
        };
      }),
    }));
    get().recomputeLayout();
  },

  toggleCollapse: (nodeId) => {
    const id = get().activeMapId;
    if (!id) return;
    set(s => ({
      maps: s.maps.map(m => {
        if (m.id !== id) return m;
        const node = m.nodes[nodeId];
        if (!node) return m;
        return {
          ...m,
          nodes: {
            ...m.nodes,
            [nodeId]: { ...node, position: { ...node.position, collapsed: !node.position.collapsed } },
          },
        };
      }),
    }));
    get().recomputeLayout();
  },

  moveNode: (nodeId, newParentId) => {
    const map = getActiveMap(get());
    if (!map || nodeId === newParentId) return;
    const rootIds = map.rootNodeIds || [map.rootNodeId];
    if (rootIds.includes(nodeId) && rootIds.length <= 1) return;
    get().pushHistory();

    const node = map.nodes[nodeId];
    if (!node) return;
    const moveMapNodes = map.nodes;

    function isDescendant(candidate: string, ancestor: string): boolean {
      const n = moveMapNodes[candidate];
      if (!n || !n.parentId) return false;
      if (n.parentId === ancestor) return true;
      return isDescendant(n.parentId, ancestor);
    }
    if (isDescendant(newParentId, nodeId)) return;

    set(s => ({
      maps: s.maps.map(m => {
        if (m.id !== map.id) return m;
        const newNodes = { ...m.nodes };
        if (node.parentId && newNodes[node.parentId]) {
          newNodes[node.parentId] = {
            ...newNodes[node.parentId],
            childrenIds: newNodes[node.parentId].childrenIds.filter(c => c !== nodeId),
          };
        }
        if (newNodes[newParentId]) {
          newNodes[newParentId] = {
            ...newNodes[newParentId],
            childrenIds: [...newNodes[newParentId].childrenIds, nodeId],
          };
        }
        newNodes[nodeId] = { ...node, parentId: newParentId };
        // If was a root, remove from rootNodeIds
        const newRootIds = (m.rootNodeIds || [m.rootNodeId]).filter(r => r !== nodeId);
        return {
          ...m,
          nodes: newNodes,
          rootNodeIds: newRootIds,
          rootNodeId: newRootIds[0] ?? m.rootNodeId,
          updatedAt: new Date().toISOString(),
        };
      }),
    }));
    get().recomputeLayout();
  },

  colorBranch: (nodeId, color) => {
    get().pushHistory();
    const map = getActiveMap(get());
    if (!map) return;
    const id = get().activeMapId;
    if (!id) return;

    const mapNodes = map.nodes;
    function collectSubtree(nid: string): string[] {
      const n = mapNodes[nid];
      if (!n) return [];
      return [nid, ...n.childrenIds.flatMap(collectSubtree)];
    }

    const allIds = collectSubtree(nodeId);

    set(s => ({
      maps: s.maps.map(m => {
        if (m.id !== id) return m;
        const newNodes = { ...m.nodes };
        for (const nid of allIds) {
          if (newNodes[nid]) {
            newNodes[nid] = {
              ...newNodes[nid],
              style: {
                ...newNodes[nid].style,
                fillColor: color,
                textColor: '#ffffff',
                connectorColor: color,
              },
            };
          }
        }
        return { ...m, nodes: newNodes, updatedAt: new Date().toISOString() };
      }),
    }));
  },

  duplicateNode: (nodeId) => {
    const map = getActiveMap(get());
    if (!map) return null;
    const node = map.nodes[nodeId];
    if (!node || !node.parentId) return null;
    get().pushHistory();
    const id = get().activeMapId;
    if (!id) return null;

    function cloneSubtree(
      srcId: string,
      newParentId: string | null,
      nodes: Record<string, MindMapNode>
    ): Record<string, MindMapNode> {
      const src = nodes[srcId];
      if (!src) return {};
      const newId = uuid();
      const clones: Record<string, MindMapNode> = {};
      const childIds: string[] = [];

      for (const cid of src.childrenIds) {
        const childClones = cloneSubtree(cid, newId, nodes);
        Object.assign(clones, childClones);
        const childNewId = Object.keys(childClones).find(k => childClones[k].parentId === newId);
        if (childNewId) childIds.push(childNewId);
      }

      clones[newId] = { ...JSON.parse(JSON.stringify(src)), id: newId, parentId: newParentId, childrenIds: childIds };
      return clones;
    }

    const clones = cloneSubtree(nodeId, node.parentId, map.nodes);
    const newRootId = Object.keys(clones).find(k => clones[k].parentId === node.parentId);
    if (!newRootId) return null;

    set(s => ({
      maps: s.maps.map(m => {
        if (m.id !== id) return m;
        const parent = m.nodes[node.parentId!];
        if (!parent) return m;
        return {
          ...m,
          updatedAt: new Date().toISOString(),
          nodes: {
            ...m.nodes,
            ...clones,
            [node.parentId!]: { ...parent, childrenIds: [...parent.childrenIds, newRootId] },
          },
        };
      }),
    }));
    get().recomputeLayout();
    return newRootId;
  },

  addStickyNote: (x, y) => {
    const id = get().activeMapId;
    if (!id) return;
    const note: StickyNote = { id: uuid(), text: '', x, y, color: '#FFEAA7', width: 180, height: 140 };
    set(s => ({
      maps: s.maps.map(m => m.id === id ? { ...m, stickyNotes: [...m.stickyNotes, note] } : m),
    }));
  },

  updateStickyNote: (noteId, patch) => {
    const id = get().activeMapId;
    if (!id) return;
    set(s => ({
      maps: s.maps.map(m =>
        m.id === id
          ? { ...m, stickyNotes: m.stickyNotes.map(n => n.id === noteId ? { ...n, ...patch } : n) }
          : m
      ),
    }));
  },

  deleteStickyNote: (noteId) => {
    const id = get().activeMapId;
    if (!id) return;
    set(s => ({
      maps: s.maps.map(m =>
        m.id === id ? { ...m, stickyNotes: m.stickyNotes.filter(n => n.id !== noteId) } : m
      ),
    }));
  },

  recomputeLayout: () => {
    const { maps, activeMapId } = get();
    const map = maps.find(m => m.id === activeMapId);
    if (!map) return;

    const allPositions: { id: string; x: number; y: number }[] = [];

    // Layout each root independently
    const rootIds = map.rootNodeIds || [map.rootNodeId];
    let offsetX = 0;
    for (const rootId of rootIds) {
      const positions = computeRadialLayout(rootId, map.nodes, map.settings.direction);
      // Shift additional roots to avoid overlap
      for (const p of positions) {
        allPositions.push({ id: p.id, x: p.x + offsetX, y: p.y });
      }
      if (rootIds.length > 1) offsetX += 800;
    }

    set(s => ({
      maps: s.maps.map(m => {
        if (m.id !== activeMapId) return m;
        const newNodes = { ...m.nodes };
        for (const { id, x, y } of allPositions) {
          if (newNodes[id] && !newNodes[id].position.manuallyPositioned) {
            newNodes[id] = { ...newNodes[id], position: { ...newNodes[id].position, x, y } };
          }
        }
        return { ...m, nodes: newNodes };
      }),
    }));
  },

  pushHistory: () => {
    const map = getActiveMap(get());
    if (!map) return;
    const entry: HistoryEntry = {
      nodes: JSON.parse(JSON.stringify(map.nodes)),
      stickyNotes: JSON.parse(JSON.stringify(map.stickyNotes)),
      rootNodeIds: [...(map.rootNodeIds || [map.rootNodeId])],
    };
    set(s => ({ past: [...s.past.slice(-49), entry], future: [] }));
  },

  undo: () => {
    const { past, maps, activeMapId } = get();
    if (past.length === 0) return;
    const prev = past[past.length - 1];
    const map = maps.find(m => m.id === activeMapId);
    if (!map) return;
    const current: HistoryEntry = {
      nodes: JSON.parse(JSON.stringify(map.nodes)),
      stickyNotes: JSON.parse(JSON.stringify(map.stickyNotes)),
      rootNodeIds: [...(map.rootNodeIds || [map.rootNodeId])],
    };
    set(s => ({
      past: s.past.slice(0, -1),
      future: [...s.future, current],
      maps: s.maps.map(m =>
        m.id === activeMapId
          ? { ...m, nodes: prev.nodes, stickyNotes: prev.stickyNotes, rootNodeIds: prev.rootNodeIds }
          : m
      ),
    }));
  },

  redo: () => {
    const { future, maps, activeMapId } = get();
    if (future.length === 0) return;
    const next = future[future.length - 1];
    const map = maps.find(m => m.id === activeMapId);
    if (!map) return;
    const current: HistoryEntry = {
      nodes: JSON.parse(JSON.stringify(map.nodes)),
      stickyNotes: JSON.parse(JSON.stringify(map.stickyNotes)),
      rootNodeIds: [...(map.rootNodeIds || [map.rootNodeId])],
    };
    set(s => ({
      future: s.future.slice(0, -1),
      past: [...s.past, current],
      maps: s.maps.map(m =>
        m.id === activeMapId
          ? { ...m, nodes: next.nodes, stickyNotes: next.stickyNotes, rootNodeIds: next.rootNodeIds }
          : m
      ),
    }));
  },
}));

// Auto-save to localStorage (debounced 2s) + save status indicator
let saveTimer: ReturnType<typeof setTimeout> | null = null;
useMapStore.subscribe((state) => {
  useUIStore.getState().setSaveStatus('unsaved');
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveToStorage(state.maps, state.activeMapId);
    useUIStore.getState().setSaveStatus('saved');
  }, 2000);
});
