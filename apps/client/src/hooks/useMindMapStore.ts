//
// useMindMapStore.ts
//
// This file creates a global state store for the mind map app using Zustand.
// - Zustand is a small, simple state management library for React.
// - This store holds all the nodes, edges, and UI state for the mind map.
// - It also handles saving/loading maps to localStorage.
//
// Learnings for beginners:
//   - How to define TypeScript interfaces for your data
//   - How to create a Zustand store
//   - How to use localStorage for persistence
//   - How to write functions to update state
//

import { create } from 'zustand';

// --- TypeScript interfaces for our data ---
export interface MindMapNode {
  id: string; // Unique ID for the node
  label: string; // The text shown in the node
  summary?: string; // Optional summary (from AI)
  aiSuggested?: boolean; // Was this node suggested by AI?
}

export interface MindMapEdge {
  id?: string; // Optional unique ID for the edge
  source: string; // ID of the source node
  target: string; // ID of the target node
}

export interface MindMap {
  id: string;
  name: string;
  nodes: MindMapNode[];
  edges: MindMapEdge[];
  created: number;
  modified: number;
}

export interface SavedMap {
  name: string;
  createdAt: number;
  nodes: MindMapNode[];
  edges: MindMapEdge[];
}

// --- The shape of our global state ---
interface MindMapState {
  nodes: MindMapNode[];
  edges: MindMapEdge[];
  loading: boolean;
  error: string | null;
  setNodes: (nodes: MindMapNode[]) => void;
  setEdges: (edges: MindMapEdge[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
  addNodes: (newNodes: MindMapNode[]) => void;
  addEdges: (newEdges: MindMapEdge[]) => void;
  renameNode: (id: string, label: string) => void;
  deleteNode: (id: string) => void;
  selectedMapId: string | null;
  saveMap: (name: string) => void;
  loadMap: (name: string) => void;
  deleteMap: (name: string) => void;
  listMaps: () => SavedMap[];
  listSavedMaps: () => { name: string, createdAt: number }[];
  renameMap: (oldName: string, newName: string) => void;
  setSelectedMapId: (id: string | null) => void;
}

// --- Helper: get all maps from localStorage ---
function getAllMaps(): SavedMap[] {
  const maps: SavedMap[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('mindmaps:')) {
      try {
        const map = JSON.parse(localStorage.getItem(key)!);
        if (
          map &&
          map.name &&
          map.nodes &&
          map.edges &&
          typeof map.createdAt === 'number' &&
          !isNaN(map.createdAt)
        ) {
          maps.push(map);
        }
      } catch {}
    }
  }
  // Sort by most recent
  return maps.sort((a, b) => b.createdAt - a.createdAt);
}

// --- The Zustand store itself ---
export const useMindMapStore = create<MindMapState & { version: number; cleanupInvalidMaps: () => void }>((set, get) => ({
  // --- State variables ---
  nodes: [],
  edges: [],
  loading: false,
  error: null,
  version: 0, // Used to force updates when maps change

  // --- State update functions ---
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  reset: () => set({ nodes: [], edges: [], loading: false, error: null }),
  addNodes: (newNodes) => set((state) => ({ nodes: [...state.nodes, ...newNodes] })),
  addEdges: (newEdges) => set((state) => ({ edges: [...state.edges, ...newEdges] })),
  renameNode: (id, label) => set((state) => ({ nodes: state.nodes.map(n => n.id === id ? { ...n, label } : n) })),
  deleteNode: (id) => set((state) => ({
    nodes: state.nodes.filter(n => n.id !== id),
    edges: state.edges.filter(e => e.source !== id && e.target !== id),
  })),
  selectedMapId: null,

  // --- Persistence: save/load/delete maps in localStorage ---
  saveMap: (name) => {
    const now = Date.now();
    const map: SavedMap = {
      name,
      createdAt: now,
      nodes: get().nodes,
      edges: get().edges,
    };
    localStorage.setItem(`mindmaps:${name}`, JSON.stringify(map));
    set({ selectedMapId: name, version: get().version + 1 });
  },
  loadMap: (name) => {
    const raw = localStorage.getItem(`mindmaps:${name}`);
    if (!raw) return;
    const map: SavedMap = JSON.parse(raw);
    set({ nodes: map.nodes, edges: map.edges, selectedMapId: name });
  },
  deleteMap: (name) => {
    localStorage.removeItem(`mindmaps:${name}`);
    if (get().selectedMapId === name) set({ selectedMapId: null, nodes: [], edges: [], version: get().version + 1 });
    else set({ version: get().version + 1 });
  },
  listMaps: () => getAllMaps(),
  listSavedMaps: () => getAllMaps().map(m => ({ name: m.name, createdAt: m.createdAt })),
  renameMap: (oldName, newName) => {
    const raw = localStorage.getItem(`mindmaps:${oldName}`);
    if (!raw) return;
    const map: SavedMap = JSON.parse(raw);
    map.name = newName;
    localStorage.setItem(`mindmaps:${newName}`, JSON.stringify(map));
    localStorage.removeItem(`mindmaps:${oldName}`);
    if (get().selectedMapId === oldName) set({ selectedMapId: newName, version: get().version + 1 });
    else set({ version: get().version + 1 });
  },
  setSelectedMapId: (id) => set({ selectedMapId: id }),

  // --- Helper: clean up invalid maps in localStorage ---
  cleanupInvalidMaps: () => {
    const keysToDelete: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('mindmaps:')) {
        try {
          const map = JSON.parse(localStorage.getItem(key)!);
          if (!map || typeof map.createdAt !== 'number' || isNaN(map.createdAt)) {
            keysToDelete.push(key);
          }
        } catch {
          keysToDelete.push(key!);
        }
      }
    }
    keysToDelete.forEach(key => localStorage.removeItem(key));
    set({ version: get().version + 1 });
  },
})); 