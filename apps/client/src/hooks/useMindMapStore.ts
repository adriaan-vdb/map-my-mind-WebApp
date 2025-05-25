import { create } from 'zustand';

export interface MindMapNode {
  id: string;
  label: string;
  summary?: string;
  aiSuggested?: boolean;
}

export interface MindMapEdge {
  id?: string;
  source: string;
  target: string;
}

export interface MindMap {
  id: string;
  name: string;
  nodes: MindMapNode[];
  edges: MindMapEdge[];
  created: number;
  modified: number;
}

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
  loadMap: (id: string) => void;
  deleteMap: (id: string) => void;
  listMaps: () => MindMap[];
  renameMap: (id: string, name: string) => void;
  setSelectedMapId: (id: string | null) => void;
}

function getAllMaps(): MindMap[] {
  const maps: MindMap[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('mindmaps:')) {
      try {
        const map = JSON.parse(localStorage.getItem(key)!);
        maps.push(map);
      } catch {}
    }
  }
  return maps.sort((a, b) => b.modified - a.modified);
}

export const useMindMapStore = create<MindMapState>((set, get) => ({
  nodes: [],
  edges: [],
  loading: false,
  error: null,
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
  saveMap: (name) => {
    const id = get().selectedMapId || crypto.randomUUID();
    const now = Date.now();
    const map: MindMap = {
      id,
      name,
      nodes: get().nodes,
      edges: get().edges,
      created: get().selectedMapId ? getAllMaps().find(m => m.id === id)?.created || now : now,
      modified: now,
    };
    localStorage.setItem(`mindmaps:${id}`, JSON.stringify(map));
    set({ selectedMapId: id });
  },
  loadMap: (id) => {
    const raw = localStorage.getItem(`mindmaps:${id}`);
    if (!raw) return;
    const map: MindMap = JSON.parse(raw);
    set({ nodes: map.nodes, edges: map.edges, selectedMapId: id });
  },
  deleteMap: (id) => {
    localStorage.removeItem(`mindmaps:${id}`);
    if (get().selectedMapId === id) set({ selectedMapId: null, nodes: [], edges: [] });
  },
  listMaps: () => getAllMaps(),
  renameMap: (id, name) => {
    const raw = localStorage.getItem(`mindmaps:${id}`);
    if (!raw) return;
    const map: MindMap = JSON.parse(raw);
    map.name = name;
    map.modified = Date.now();
    localStorage.setItem(`mindmaps:${id}`, JSON.stringify(map));
  },
  setSelectedMapId: (id) => set({ selectedMapId: id }),
})); 