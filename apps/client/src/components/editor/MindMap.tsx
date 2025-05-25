import React, { useState, useRef, useEffect } from 'react';
import CytoscapeComponent from 'react-cytoscapejs';
import { useMindMapStore } from '../../hooks/useMindMapStore';
import NodeMenu from './NodeMenu';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export default function MindMap() {
  const [input, setInput] = useState('');
  const {
    nodes, edges, loading, error, setNodes, setEdges, setLoading, setError, reset, addNodes, addEdges, renameNode, deleteNode
  } = useMindMapStore();
  const [submitted, setSubmitted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [graphHeight, setGraphHeight] = useState(400);
  const [menuNode, setMenuNode] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [expandLoading, setExpandLoading] = useState(false);
  const [expandError, setExpandError] = useState<string | null>(null);

  // Responsive graph height
  useEffect(() => {
    function handleResize() {
      if (containerRef.current) {
        setGraphHeight(containerRef.current.offsetHeight - 120);
      }
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Cytoscape event handlers
  const cyRef = useRef<any>(null);
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    const handleContext = (evt: any) => {
      evt.preventDefault();
      setMenuNode(evt.target.data('id'));
      setMenuPos({ x: evt.originalEvent.clientX, y: evt.originalEvent.clientY });
    };
    cy.on('cxttap', 'node', handleContext);
    cy.on('tap', () => { setMenuNode(null); });
    return () => {
      cy.removeListener('cxttap', 'node', handleContext);
      cy.removeListener('tap');
    };
  }, [cyRef.current, nodes, edges]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSubmitted(true);
    try {
      const res = await fetch(`${API_URL}/api/maps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: input }),
      });
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      setNodes(data.nodes);
      setEdges(data.edges);
    } catch (err: any) {
      setError(err.message || 'Unknown error');
      setNodes([]);
      setEdges([]);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    reset();
    setInput('');
    setSubmitted(false);
  };

  // Node actions
  const handleExpand = async (nodeId: string) => {
    setExpandLoading(true);
    setExpandError(null);
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    try {
      const res = await fetch(`${API_URL}/api/maps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: node.label, parentId: node.id }),
      });
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      addNodes(data.nodes.filter((n: any) => !nodes.some(existing => existing.id === n.id)));
      addEdges(data.edges.filter((e: any) => !edges.some(existing => existing.source === e.source && existing.target === e.target)));
      setMenuNode(null);
    } catch (err: any) {
      setExpandError(err.message || 'Unknown error');
    } finally {
      setExpandLoading(false);
    }
  };
  const handleRename = (nodeId: string, label: string) => {
    renameNode(nodeId, label);
    setMenuNode(null);
  };
  const handleDelete = (nodeId: string) => {
    deleteNode(nodeId);
    setMenuNode(null);
  };

  const elements = [
    ...nodes.map((n) => ({ data: { id: n.id, label: n.label } })),
    ...edges.map((e) => ({ data: { source: e.source, target: e.target } })),
  ];

  return (
    <div ref={containerRef} className="min-h-screen flex flex-col md:flex-row gap-8 bg-gray-50 p-4 md:p-8">
      {/* Left: Form and controls */}
      <div className="md:w-1/3 w-full flex flex-col gap-4">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 bg-white rounded shadow p-4">
          <label className="font-semibold text-lg">Paste or type your notes:</label>
          <textarea
            className="w-full min-h-[100px] p-3 border rounded resize-y"
            placeholder="e.g. Productivity, time management, healthy habits..."
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={loading}
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
              disabled={loading || !input.trim()}
            >
              {loading ? 'Generating...' : 'Generate Mind Map'}
            </button>
            <button
              type="button"
              className="px-4 py-2 bg-gray-200 rounded"
              onClick={handleReset}
              disabled={loading}
            >
              Reset
            </button>
          </div>
        </form>
        {error && <div className="text-red-600 bg-white rounded shadow p-2 mt-2">{error}</div>}
      </div>
      {/* Right: Graph or placeholder */}
      <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] relative">
        {(!submitted || nodes.length === 0) && !loading && !error && (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 select-none">
            <svg width="80" height="80" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="mb-4"><circle cx="12" cy="12" r="10" strokeWidth="2" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h8m-4-4v8" /></svg>
            <div className="text-lg">Your mind map will appear here</div>
          </div>
        )}
        {nodes.length > 0 && (
          <div className="w-full h-full min-h-[400px]">
            <CytoscapeComponent
              cy={cy => (cyRef.current = cy)}
              elements={elements}
              style={{ width: '100%', height: graphHeight || 400 }}
              layout={{ name: 'breadthfirst', fit: true, directed: true, padding: 30 }}
              stylesheet={[
                {
                  selector: 'node',
                  style: {
                    'background-color': '#2563eb',
                    'label': 'data(label)',
                    'color': '#fff',
                    'text-valign': 'center',
                    'text-halign': 'center',
                    'font-size': 16,
                    'width': 120,
                    'height': 50,
                    'shape': 'roundrectangle',
                    'text-wrap': 'wrap',
                    'text-max-width': 100,
                  },
                },
                {
                  selector: 'edge',
                  style: {
                    'width': 3,
                    'line-color': '#a5b4fc',
                    'target-arrow-color': '#a5b4fc',
                    'target-arrow-shape': 'triangle',
                    'curve-style': 'bezier',
                  },
                },
              ]}
              minZoom={0.2}
              maxZoom={2}
              wheelSensitivity={0.2}
            />
            {menuNode && menuPos && (
              <div style={{ position: 'fixed', left: menuPos.x, top: menuPos.y, zIndex: 50 }}>
                <NodeMenu
                  node={nodes.find(n => n.id === menuNode)!}
                  onExpand={() => handleExpand(menuNode)}
                  onRename={label => handleRename(menuNode, label)}
                  onDelete={() => handleDelete(menuNode)}
                  loading={expandLoading}
                  error={expandError}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 