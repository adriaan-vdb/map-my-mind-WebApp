import React, { useState, useRef, useEffect } from 'react';
import CytoscapeComponent from 'react-cytoscapejs';
import { useMindMapStore } from '../../hooks/useMindMapStore';
import NodeMenu from './NodeMenu';
import { InformationCircleIcon, EllipsisVerticalIcon, PlusIcon, BookmarkIcon } from '@heroicons/react/24/outline';
import { Dialog } from '@headlessui/react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

// Each suggestion is an object: { label: string, value: string }
const SAMPLE_PROMPTS = [
  {
    label: 'Suggestion',
    value: 'okay so like I keep thinking about how I should really get back to reading more, not just scrolling on my phone but like actual books, and maybe I could pair that with some journaling again, like morning pages or something, because it helped me feel more grounded before and also coffee ☕ obviously has to be part of the routine — and oh I should try that new Colombian roast I saw last week, also the gym is still something I want to go back to, but only if I find a schedule that doesn’t feel forced, maybe evenings after work? or is morning better? probably depends on if I sleep early which I don’t, lol, but sleep — yeah that’s a whole other problem, need to cut screen time at night, maybe use a proper alarm clock again instead of my phone, and I still haven’t called my dentist back about that thing',
  },
  // Add more suggestions here if desired
];

// Debounce utility
function debounce<T extends (...args: any[]) => void>(fn: T, ms: number) {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), ms);
  };
}

export default function MindMap() {
  const [input, setInput] = useState('');
  const {
    nodes, edges, loading, error, setNodes, setEdges, setLoading, setError, reset, addNodes, addEdges, renameNode, deleteNode, saveMap, selectedMapId
  } = useMindMapStore();
  const [submitted, setSubmitted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [graphHeight, setGraphHeight] = useState(400);
  const [menuNode, setMenuNode] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [expandLoading, setExpandLoading] = useState(false);
  const [expandError, setExpandError] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [showSave, setShowSave] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [showAddNode, setShowAddNode] = useState(false);
  const [newNodeLabel, setNewNodeLabel] = useState('');
  const cyRef = useRef<any>(null);
  const [nodeIconPositions, setNodeIconPositions] = useState<{ [id: string]: { x: number; y: number } }>({});

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

  // Node menu icon overlay logic (update on drag, zoom, pan, render, layoutstop, and after nodes/edges change)
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    const updatePositions = () => {
      const positions: { [id: string]: { x: number; y: number } } = {};
      nodes.forEach(n => {
        const ele = cy.getElementById(n.id);
        if (ele && ele.isNode()) {
          const pos = ele.renderedPosition();
          positions[n.id] = {
            x: pos.x + 60,
            y: pos.y - 25
          };
        }
      });
      setNodeIconPositions(positions);
    };
    const debouncedUpdate = debounce(updatePositions, 10);
    cy.on('render drag free pan zoom layoutstop', debouncedUpdate);
    updatePositions();
    return () => {
      cy.removeListener('render', debouncedUpdate);
      cy.removeListener('drag', debouncedUpdate);
      cy.removeListener('free', debouncedUpdate);
      cy.removeListener('pan', debouncedUpdate);
      cy.removeListener('zoom', debouncedUpdate);
      cy.removeListener('layoutstop', debouncedUpdate);
    };
  }, [nodes, edges]);
  // Also update positions immediately after nodes/edges change
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    const updatePositions = () => {
      const positions: { [id: string]: { x: number; y: number } } = {};
      nodes.forEach(n => {
        const ele = cy.getElementById(n.id);
        if (ele && ele.isNode()) {
          const pos = ele.renderedPosition();
          positions[n.id] = {
            x: pos.x + 60,
            y: pos.y - 25
          };
        }
      });
      setNodeIconPositions(positions);
    };
    updatePositions();
  }, [nodes, edges]);

  // Menu icon click handler
  const handleMenuIconClick = (nodeId: string, evt: React.MouseEvent) => {
    setMenuNode(nodeId);
    setMenuPos(nodeIconPositions[nodeId]);
    evt.stopPropagation();
  };

  // Submit handler
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

  // Reset handler
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

  // Add node
  const handleAddNode = () => {
    if (!newNodeLabel.trim()) return;
    const id = crypto.randomUUID();
    addNodes([{ id, label: newNodeLabel }]);
    setNewNodeLabel('');
    setShowAddNode(false);
  };

  // Save map
  const handleSaveMap = () => {
    if (!saveName.trim()) return;
    saveMap(saveName.trim());
    setShowSave(false);
  };

  const elements = [
    ...nodes.map((n) => ({ data: { id: n.id, label: n.label } })),
    ...edges.map((e) => ({ data: { source: e.source, target: e.target } })),
  ];

  return (
    <div ref={containerRef} className="min-h-screen flex flex-col md:flex-row gap-8 bg-gray-50 p-4 md:p-8 relative">
      {/* Left: Form and controls */}
      <div className="md:w-1/3 w-full flex flex-col gap-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="font-semibold text-lg">Paste or type your notes:</span>
          <button type="button" onClick={() => setShowInfo(true)} className="ml-1 text-blue-600 hover:text-blue-800">
            <InformationCircleIcon className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 bg-white rounded shadow p-4">
          <textarea
            className="w-full min-h-[100px] p-3 border rounded resize-y"
            placeholder="e.g. Productivity, time management, healthy habits..."
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={loading}
          />
          <div className="flex gap-2 flex-wrap">
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
            <button
              type="button"
              className="px-4 py-2 bg-green-600 text-white rounded flex items-center gap-1"
              onClick={() => setShowSave(true)}
              disabled={nodes.length === 0}
            >
              <BookmarkIcon className="w-5 h-5" /> Save Map
            </button>
            <button
              type="button"
              className="px-4 py-2 bg-blue-200 text-blue-900 rounded flex items-center gap-1"
              onClick={() => setShowAddNode(true)}
            >
              <PlusIcon className="w-5 h-5" /> Add Node
            </button>
          </div>
        </form>
        {/* Sample prompts below textarea */}
        <div className="flex flex-wrap gap-2 mt-4">
          {SAMPLE_PROMPTS.map((prompt, i) => (
            <button
              key={i}
              type="button"
              className="px-3 py-1 bg-white border border-blue-200 rounded-full text-sm shadow hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
              onClick={() => setInput(prompt.value)}
              disabled={loading}
            >
              {prompt.label}
            </button>
          ))}
        </div>
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
                    'overlay-padding': 8,
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
            {/* Render node menu icons as overlays, positioned relative to Cytoscape container */}
            <div style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
              {Object.entries(nodeIconPositions).map(([id, pos]) => (
                <button
                  key={id}
                  style={{
                    position: 'absolute',
                    left: pos.x,
                    top: pos.y,
                    zIndex: 20,
                    background: 'white',
                    borderRadius: '9999px',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                    border: '1px solid #dbeafe',
                    padding: 2,
                    width: 28,
                    height: 28,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    pointerEvents: 'auto',
                  }}
                  onClick={e => handleMenuIconClick(id, e)}
                  tabIndex={0}
                  aria-label="Node actions"
                  type="button"
                >
                  <EllipsisVerticalIcon className="w-5 h-5 text-blue-600" />
                </button>
              ))}
            </div>
          </div>
        )}
        {/* NodeMenu, Save, Add Node, and Info modals rendered at the end for accessibility */}
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
        <Dialog open={showSave} onClose={() => setShowSave(false)} className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black bg-opacity-30" aria-hidden="true" />
          <div className="bg-white rounded shadow-lg p-6 max-w-sm relative z-10">
            <button type="button" className="absolute top-2 right-2 text-gray-400 hover:text-gray-600" onClick={() => setShowSave(false)}>&times;</button>
            <Dialog.Title className="text-lg font-bold mb-2">Save Mind Map</Dialog.Title>
            <input
              className="border rounded px-3 py-2 w-full mb-3"
              placeholder="Map name"
              value={saveName}
              onChange={e => setSaveName(e.target.value)}
              autoFocus
              onKeyDown={e => { if (e.key === 'Enter') handleSaveMap(); }}
            />
            <button
              type="button"
              className="px-4 py-2 bg-green-600 text-white rounded w-full"
              onClick={handleSaveMap}
              disabled={!saveName.trim()}
            >Save</button>
          </div>
        </Dialog>
        <Dialog open={showAddNode} onClose={() => setShowAddNode(false)} className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black bg-opacity-30" aria-hidden="true" />
          <div className="bg-white rounded shadow-lg p-6 max-w-sm relative z-10">
            <button type="button" className="absolute top-2 right-2 text-gray-400 hover:text-gray-600" onClick={() => setShowAddNode(false)}>&times;</button>
            <Dialog.Title className="text-lg font-bold mb-2">Add Node</Dialog.Title>
            <input
              className="border rounded px-3 py-2 w-full mb-3"
              placeholder="Node label"
              value={newNodeLabel}
              onChange={e => setNewNodeLabel(e.target.value)}
              autoFocus
              onKeyDown={e => { if (e.key === 'Enter') handleAddNode(); }}
            />
            <button
              type="button"
              className="px-4 py-2 bg-blue-600 text-white rounded w-full"
              onClick={handleAddNode}
              disabled={!newNodeLabel.trim()}
            >Add Node</button>
          </div>
        </Dialog>
        <Dialog open={showInfo} onClose={() => setShowInfo(false)} className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black bg-opacity-30" aria-hidden="true" />
          <div className="bg-white rounded shadow-lg p-6 max-w-md relative z-10">
            <button type="button" className="absolute top-2 right-2 text-gray-400 hover:text-gray-600" onClick={() => setShowInfo(false)}>&times;</button>
            <Dialog.Title className="text-xl font-bold mb-2">How to use the Mind Map Editor</Dialog.Title>
            <ul className="list-disc pl-5 space-y-1 text-gray-700 mb-2">
              <li>Enter or paste your notes or ideas in the text area below.</li>
              <li>Click <b>Generate Mind Map</b> to visualize your thoughts.</li>
              <li>Click the <EllipsisVerticalIcon className="inline w-4 h-4 align-text-bottom" /> icon on a node for actions: <b>Expand</b>, <b>Rename</b>, <b>Delete</b>.</li>
              <li>Use the <b>Reset</b> button to clear the current map.</li>
              <li>Use <b>Save Map</b> to store your map for later, or load previous maps from the dashboard.</li>
              <li>Use <b>Add Node</b> to manually add a new node.</li>
            </ul>
            <div className="text-sm text-gray-500">Tip: Try the sample prompts for inspiration!</div>
          </div>
        </Dialog>
      </div>
    </div>
  );
} 