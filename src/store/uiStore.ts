import { create } from 'zustand';

export type ActivePanel = 'personalize' | 'notes' | 'comments' | 'share' | null;
export type AppView = 'dashboard' | 'editor';

interface UIState {
  view: AppView;
  activePanel: ActivePanel;
  selectedNodeId: string | null;
  editingNodeId: string | null;
  hoveredNodeId: string | null;
  showMinimap: boolean;
  zoom: number;
  panX: number;
  panY: number;

  setView: (v: AppView) => void;
  setActivePanel: (p: ActivePanel) => void;
  setSelectedNode: (id: string | null) => void;
  setEditingNode: (id: string | null) => void;
  setHoveredNode: (id: string | null) => void;
  toggleMinimap: () => void;
  setZoom: (z: number) => void;
  setPan: (x: number, y: number) => void;
  fitToScreen: (canvasW: number, canvasH: number, contentBounds: { minX: number; minY: number; maxX: number; maxY: number }) => void;
}

export const useUIStore = create<UIState>((set) => ({
  view: 'dashboard',
  activePanel: null,
  selectedNodeId: null,
  editingNodeId: null,
  hoveredNodeId: null,
  showMinimap: true,
  zoom: 1,
  panX: 0,
  panY: 0,

  setView: (v) => set({ view: v }),
  setActivePanel: (p) => set(s => ({ activePanel: s.activePanel === p ? null : p })),
  setSelectedNode: (id) => set({ selectedNodeId: id }),
  setEditingNode: (id) => set({ editingNodeId: id }),
  setHoveredNode: (id) => set({ hoveredNodeId: id }),
  toggleMinimap: () => set(s => ({ showMinimap: !s.showMinimap })),
  setZoom: (z) => set({ zoom: Math.max(0.2, Math.min(3, z)) }),
  setPan: (x, y) => set({ panX: x, panY: y }),

  fitToScreen: (canvasW, canvasH, bounds) => {
    const padding = 80;
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
