import { create } from 'zustand';

export type ActivePanel = 'personalize' | 'notes' | 'comments' | 'share' | 'export' | null;
export type AppView = 'dashboard' | 'editor';

export interface ContextMenuState {
  x: number;
  y: number;
  nodeId: string;
}

interface UIState {
  view: AppView;
  activePanel: ActivePanel;
  selectedNodeId: string | null;
  selectedNodeIds: string[];
  editingNodeId: string | null;
  hoveredNodeId: string | null;
  selectedConnectorId: string | null; // "parentId-childId"
  contextMenu: ContextMenuState | null;
  searchQuery: string;
  searchResults: string[];
  searchOpen: boolean;
  showMinimap: boolean;
  zoom: number;
  panX: number;
  panY: number;
  saveStatus: 'saved' | 'saving' | 'unsaved';

  setView: (v: AppView) => void;
  setActivePanel: (p: ActivePanel) => void;
  setSelectedNode: (id: string | null) => void;
  toggleMultiSelect: (id: string) => void;
  clearMultiSelect: () => void;
  setEditingNode: (id: string | null) => void;
  setHoveredNode: (id: string | null) => void;
  setSelectedConnector: (id: string | null) => void;
  setContextMenu: (menu: ContextMenuState | null) => void;
  setSearch: (q: string) => void;
  setSearchResults: (ids: string[]) => void;
  setSearchOpen: (open: boolean) => void;
  toggleMinimap: () => void;
  setZoom: (z: number) => void;
  setPan: (x: number, y: number) => void;
  setSaveStatus: (s: 'saved' | 'saving' | 'unsaved') => void;
  fitToScreen: (canvasW: number, canvasH: number, contentBounds: { minX: number; minY: number; maxX: number; maxY: number }) => void;
}

export const useUIStore = create<UIState>((set) => ({
  view: 'dashboard',
  activePanel: null,
  selectedNodeId: null,
  selectedNodeIds: [],
  editingNodeId: null,
  hoveredNodeId: null,
  selectedConnectorId: null,
  contextMenu: null,
  searchQuery: '',
  searchResults: [],
  searchOpen: false,
  showMinimap: true,
  zoom: 1,
  panX: 0,
  panY: 0,
  saveStatus: 'saved',

  setView: (v) => set({ view: v }),
  setActivePanel: (p) => set(s => ({ activePanel: s.activePanel === p ? null : p })),
  setSelectedNode: (id) => set({ selectedNodeId: id, selectedNodeIds: id ? [id] : [], selectedConnectorId: null, contextMenu: null }),
  toggleMultiSelect: (id) => set(s => {
    const ids = s.selectedNodeIds.includes(id)
      ? s.selectedNodeIds.filter(x => x !== id)
      : [...s.selectedNodeIds, id];
    return { selectedNodeIds: ids, selectedNodeId: ids[ids.length - 1] ?? null };
  }),
  clearMultiSelect: () => set({ selectedNodeIds: [], selectedNodeId: null }),
  setEditingNode: (id) => set({ editingNodeId: id }),
  setHoveredNode: (id) => set({ hoveredNodeId: id }),
  setSelectedConnector: (id) => set({ selectedConnectorId: id, selectedNodeId: null }),
  setContextMenu: (menu) => set({ contextMenu: menu }),
  setSearch: (q) => set({ searchQuery: q }),
  setSearchResults: (ids) => set({ searchResults: ids }),
  setSearchOpen: (open) => set({ searchOpen: open }),
  toggleMinimap: () => set(s => ({ showMinimap: !s.showMinimap })),
  setZoom: (z) => set({ zoom: Math.max(0.2, Math.min(3, z)) }),
  setPan: (x, y) => set({ panX: x, panY: y }),
  setSaveStatus: (s) => set({ saveStatus: s }),

  fitToScreen: (canvasW, canvasH, bounds) => {
    const padding = 100;
    const contentW = bounds.maxX - bounds.minX + 400;
    const contentH = bounds.maxY - bounds.minY + 200;
    const scaleX = (canvasW - padding * 2) / contentW;
    const scaleY = (canvasH - padding * 2) / contentH;
    const zoom = Math.max(0.3, Math.min(1.5, Math.min(scaleX, scaleY)));
    const panX = canvasW / 2 - ((bounds.minX + bounds.maxX) / 2) * zoom;
    const panY = canvasH / 2 - ((bounds.minY + bounds.maxY) / 2) * zoom;
    set({ zoom, panX, panY });
  },
}));
