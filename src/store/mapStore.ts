import { create } from 'zustand';
import { v4 as uuid } from 'uuid';
import type {
  MindMap,
  MindMapNode,
  MapSettings,
  NodeStyle,
  StickyNote,
  HistoryEntry,
} from '../types';
import { computeRadialLayout } from '../utils/layout';

const DEFAULT_STYLE: NodeStyle = {
  fillColor: null,
  borderColor: null,
  textColor: null,
  fontSize: 'm',
  fontWeight: 'normal',
  shape: 'rounded',
  connectorStyle: 'curved',
};

function createRootNode(): MindMapNode {
  return {
    id: 'root',
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
    nodes: { [root.id]: root },
    stickyNotes: [],
  };
}

export interface MapState {
  maps: MindMap[];
  activeMapId: string | null;
  past: HistoryEntry[];
  future: HistoryEntry[];

  // Actions
  createMap: (title?: string) => string;
  deleteMap: (id: string) => void;
  duplicateMap: (id: string) => string;
  setActiveMap: (id: string) => void;
  renameMap: (id: string, title: string) => void;
  toggleStarMap: (id: string) => void;
  updateSettings: (settings: Partial<MapSettings>) => void;

  addNode: (parentId: string) => string;
  addSiblingNode: (nodeId: string) => string | null;
  deleteNode: (nodeId: string) => void;
  updateNodeText: (nodeId: string, text: string) => void;
  updateNodeNote: (nodeId: string, note: string) => void;
  updateNodeStyle: (nodeId: string, style: Partial<NodeStyle>) => void;
  toggleCollapse: (nodeId: string) => void;
  moveNode: (nodeId: string, newParentId: string) => void;

  addStickyNote: (x: number, y: number) => void;
  updateStickyNote: (id: string, text: string) => void;
  deleteStickyNote: (id: string) => void;
  moveStickyNote: (id: string, x: number, y: number) => void;

  recomputeLayout: () => void;
  undo: () => void;
  redo: () => void;
  pushHistory: () => void;
}

function getActiveMap(state: MapState): MindMap | undefined {
  return state.maps.find(m => m.id === state.activeMapId);
}

export const useMapStore = create<MapState>((set, get) => ({
  maps: [],
  activeMapId: null,
  past: [],
  future: [],

  createMap: (title) => {
    const map = createNewMap(title);
    set(s => ({ maps: [...s.maps, map], activeMapId: map.id }));
    get().recomputeLayout();
    return map.id;
  },

  deleteMap: (id) => {
    set(s => ({
      maps: s.maps.filter(m => m.id !== id),
      activeMapId: s.activeMapId === id ? null : s.activeMapId,
    }));
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
    return dup.id;
  },

  setActiveMap: (id) => set({ activeMapId: id, past: [], future: [] }),

  renameMap: (id, title) => {
    set(s => ({
      maps: s.maps.map(m => m.id === id ? { ...m, title, updatedAt: new Date().toISOString() } : m),
    }));
  },

  toggleStarMap: (id) => {
    set(s => ({
      maps: s.maps.map(m => m.id === id ? { ...m, isStarred: !m.isStarred } : m),
    }));
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

  addNode: (parentId) => {
    get().pushHistory();
    const id = get().activeMapId;
    if (!id) return '';
    const nodeId = uuid();
    const newNode: MindMapNode = {
      id: nodeId,
      parentId,
      childrenIds: [],
      content: { text: '', note: '', attachments: [] },
      style: { ...DEFAULT_STYLE },
      position: { x: 0, y: 0, collapsed: false },
      comments: [],
      sequenceLabel: null,
    };
    set(s => ({
      maps: s.maps.map(m => {
        if (m.id !== id) return m;
        const parent = m.nodes[parentId];
        if (!parent) return m;
        return {
          ...m,
          updatedAt: new Date().toISOString(),
          nodes: {
            ...m.nodes,
            [parentId]: { ...parent, childrenIds: [...parent.childrenIds, nodeId] },
            [nodeId]: newNode,
          },
        };
      }),
    }));
    get().recomputeLayout();
    return nodeId;
  },

  addSiblingNode: (nodeId) => {
    const map = getActiveMap(get());
    if (!map) return null;
    const node = map.nodes[nodeId];
    if (!node || !node.parentId) return null;
    return get().addNode(node.parentId);
  },

  deleteNode: (nodeId) => {
    const map = getActiveMap(get());
    if (!map || nodeId === map.rootNodeId) return;
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
        return { ...m, nodes: newNodes, updatedAt: new Date().toISOString() };
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
          nodes: {
            ...m.nodes,
            [nodeId]: { ...node, content: { ...node.content, text } },
          },
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
          nodes: {
            ...m.nodes,
            [nodeId]: { ...node, style: { ...node.style, ...style } },
          },
        };
      }),
    }));
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
            [nodeId]: {
              ...node,
              position: { ...node.position, collapsed: !node.position.collapsed },
            },
          },
        };
      }),
    }));
    get().recomputeLayout();
  },

  moveNode: (nodeId, newParentId) => {
    const map = getActiveMap(get());
    if (!map || nodeId === map.rootNodeId || nodeId === newParentId) return;
    get().pushHistory();

    const node = map.nodes[nodeId];
    if (!node) return;
    const moveMapNodes = map.nodes;

    // Prevent moving to own descendant
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
        // Remove from old parent
        if (node.parentId && newNodes[node.parentId]) {
          newNodes[node.parentId] = {
            ...newNodes[node.parentId],
            childrenIds: newNodes[node.parentId].childrenIds.filter(c => c !== nodeId),
          };
        }
        // Add to new parent
        if (newNodes[newParentId]) {
          newNodes[newParentId] = {
            ...newNodes[newParentId],
            childrenIds: [...newNodes[newParentId].childrenIds, nodeId],
          };
        }
        newNodes[nodeId] = { ...node, parentId: newParentId };
        return { ...m, nodes: newNodes, updatedAt: new Date().toISOString() };
      }),
    }));
    get().recomputeLayout();
  },

  addStickyNote: (x, y) => {
    const id = get().activeMapId;
    if (!id) return;
    const note: StickyNote = { id: uuid(), text: '', x, y, color: '#FFEAA7' };
    set(s => ({
      maps: s.maps.map(m =>
        m.id === id ? { ...m, stickyNotes: [...m.stickyNotes, note] } : m
      ),
    }));
  },

  updateStickyNote: (noteId, text) => {
    const id = get().activeMapId;
    if (!id) return;
    set(s => ({
      maps: s.maps.map(m =>
        m.id === id
          ? { ...m, stickyNotes: m.stickyNotes.map(n => n.id === noteId ? { ...n, text } : n) }
          : m
      ),
    }));
  },

  deleteStickyNote: (noteId) => {
    const id = get().activeMapId;
    if (!id) return;
    set(s => ({
      maps: s.maps.map(m =>
        m.id === id
          ? { ...m, stickyNotes: m.stickyNotes.filter(n => n.id !== noteId) }
          : m
      ),
    }));
  },

  moveStickyNote: (noteId, x, y) => {
    const id = get().activeMapId;
    if (!id) return;
    set(s => ({
      maps: s.maps.map(m =>
        m.id === id
          ? { ...m, stickyNotes: m.stickyNotes.map(n => n.id === noteId ? { ...n, x, y } : n) }
          : m
      ),
    }));
  },

  recomputeLayout: () => {
    const { maps, activeMapId } = get();
    const map = maps.find(m => m.id === activeMapId);
    if (!map) return;

    const positions = computeRadialLayout(map.rootNodeId, map.nodes, map.settings.direction);

    set(s => ({
      maps: s.maps.map(m => {
        if (m.id !== activeMapId) return m;
        const newNodes = { ...m.nodes };
        for (const { id, x, y } of positions) {
          if (newNodes[id]) {
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
    };
    set(s => ({
      past: [...s.past.slice(-49), entry],
      future: [],
    }));
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
    };
    set(s => ({
      past: s.past.slice(0, -1),
      future: [...s.future, current],
      maps: s.maps.map(m =>
        m.id === activeMapId ? { ...m, nodes: prev.nodes, stickyNotes: prev.stickyNotes } : m
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
    };
    set(s => ({
      future: s.future.slice(0, -1),
      past: [...s.past, current],
      maps: s.maps.map(m =>
        m.id === activeMapId ? { ...m, nodes: next.nodes, stickyNotes: next.stickyNotes } : m
      ),
    }));
  },
}));
