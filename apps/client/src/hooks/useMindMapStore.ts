import { create } from 'zustand';

export interface MindMapNode {
  id: string;
  label: string;
  summary?: string;
}

export interface MindMapEdge {
  source: string;
  target: string;
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
}

export const useMindMapStore = create<MindMapState>((set) => ({
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
})); 