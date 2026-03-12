import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuid } from 'uuid';

export interface Workspace {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

function defaultWorkspace(ownerId: string): Workspace {
  return {
    id: 'personal',
    name: 'Mon Espace',
    description: 'Espace personnel par défaut',
    color: '#7C5CE7',
    icon: '🏠',
    ownerId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

interface WorkspaceState {
  workspaces: Workspace[];
  activeWorkspaceId: string;

  initForUser: (ownerId: string) => void;
  createWorkspace: (name: string, color: string, icon: string, description?: string, ownerId?: string) => string;
  updateWorkspace: (id: string, updates: Partial<Pick<Workspace, 'name' | 'description' | 'color' | 'icon'>>) => void;
  deleteWorkspace: (id: string) => void;
  setActiveWorkspace: (id: string) => void;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      workspaces: [],
      activeWorkspaceId: 'personal',

      initForUser: (ownerId: string) => {
        const { workspaces } = get();
        if (workspaces.length === 0) {
          set({ workspaces: [defaultWorkspace(ownerId)], activeWorkspaceId: 'personal' });
        }
      },

      createWorkspace: (name, color, icon, description = '', ownerId = 'local') => {
        const id = uuid();
        const ws: Workspace = {
          id,
          name,
          description,
          color,
          icon,
          ownerId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set(s => ({ workspaces: [...s.workspaces, ws] }));
        return id;
      },

      updateWorkspace: (id, updates) => {
        set(s => ({
          workspaces: s.workspaces.map(ws =>
            ws.id === id ? { ...ws, ...updates, updatedAt: new Date().toISOString() } : ws
          ),
        }));
      },

      deleteWorkspace: (id) => {
        set(s => ({
          workspaces: s.workspaces.filter(ws => ws.id !== id),
          activeWorkspaceId: s.activeWorkspaceId === id ? (s.workspaces[0]?.id ?? 'personal') : s.activeWorkspaceId,
        }));
      },

      setActiveWorkspace: (id) => set({ activeWorkspaceId: id }),
    }),
    { name: 'alpha-workspaces' }
  )
);
