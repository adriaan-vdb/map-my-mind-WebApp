import React, { useState, useRef, useEffect } from 'react';
import CytoscapeComponent from 'react-cytoscapejs';
import { useMindMapStore } from '../../hooks/useMindMapStore';
import NodeMenu from './NodeMenu';
import { InformationCircleIcon, EllipsisVerticalIcon, PlusIcon, BookmarkIcon } from '@heroicons/react/24/outline';
import { Dialog } from '@headlessui/react';
import Cytoscape from 'cytoscape';
import edgehandles from 'cytoscape-edgehandles';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

// Each suggestion is an object: { label: string, value: string }
const SAMPLE_PROMPTS = [
  {
    label: 'Suggestion',
    value: `okay so like I keep thinking about how I should really get back to reading more, not just scrolling on my phone but like actual books, and maybe I could pair that with some journaling again, like morning pages or something, because it helped me feel more grounded before and also coffee ☕ obviously has to be part of the routine — and oh I should try that new Colombian roast I saw last week, also the gym is still something I want to go back to, but only if I find a schedule that doesn't feel forced, maybe evenings after work? or is morning better? probably depends on if I sleep early which I don't, lol, but sleep — yeah that's a whole other problem, need to cut screen time at night, maybe use a proper alarm clock again instead of my phone, and I still haven't called my dentist back about that thing`,
  }
];

// Debounce utility
function debounce<T extends (...args: any[]) => void>(fn: T, ms: number) {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), ms);
  };
}

// Ensure plugin registration is at the top (already present, but keep for clarity)
if (!(Cytoscape as any).registeredEh) {
  Cytoscape.use(edgehandles);
  (Cytoscape as any).registeredEh = true;
}

declare global {
  interface CytoscapeCore {
    ehInstance?: any;
  }
}

const greenDotSVG = true

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
  const [newEdges, setNewEdges] = useState<{ id: string; source: string; target: string }[]>([]);
  const [edgeMenu, setEdgeMenu] = useState<{
    id: string;
    source: string;
    target: string;
    x: number;
    y: number;
  } | null>(null);
  const [addEdgeSource, setAddEdgeSource] = useState<string | null>(null);
  const [addNodePos, setAddNodePos] = useState<{ x: number; y: number } | null>(null);

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

  // Node menu icon click handler
  const handleMenuIconClick = (nodeId: string, evt: React.MouseEvent) => {
    setMenuNode(nodeId);
    setMenuPos(nodeIconPositions[nodeId]);
    evt.stopPropagation();
  };

  // Enable right-click on node to open NodeMenu at correct position
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    const onNodeContext = (evt: any) => {
      evt.preventDefault();
      const nodeId = evt.target.id();
      // Get rendered position and convert to screen coordinates
      const rendered = evt.target.renderedPosition();
      // Get Cytoscape container bounding rect
      const container = cy.container();
      const rect = container.getBoundingClientRect();
      // Offset for menu (similar to icon)
      const x = rect.left + rendered.x + 60;
      const y = rect.top + rendered.y - 25;
      setMenuNode(nodeId);
      setMenuPos({ x, y });
    };
    cy.on('cxttap', 'node', onNodeContext);
    return () => {
      cy.removeListener('cxttap', 'node', onNodeContext);
    };
  }, [nodeIconPositions]);

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
    setAddNodePos(null);
  };

  // Save map
  const handleSaveMap = () => {
    if (!saveName.trim()) return;
    saveMap(saveName.trim());
    setShowSave(false);
  };

  // Add the helper function inside the component (or just above it)
  const initEdgeHandles = (cy: Cytoscape.Core) => {
    if ((cy as any).ehInstance) {
      (cy as any).ehInstance.destroy();
    }
    const eh = (cy as any).edgehandles({
      handleNodes: 'node',
      handlePosition: () => 'right middle',
      handleIcon: true,
      handleSize: 16,
      handleColor: '#22c55e',
      handleLineType: 'ghost',
      handleLineWidth: 2,
      edgeType: () => 'flat',
      loopAllowed: () => true,
      complete: (sourceNode: any, targetNode: any, addedEles: any) => {
        const source = sourceNode.id();
        const target = targetNode.id();
        if (
          edges.some(e => e.source === source && e.target === target) ||
          newEdges.some(e => e.source === source && e.target === target)
        ) {
          addedEles.remove();
          return;
        }
        const id = `${source}__${target}__${crypto.randomUUID()}`;
        setNewEdges(prev => [...prev, { id, source, target }]);
      }
    });
    (cy as any).ehInstance = eh;
  };

  // Edgehandles instance
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    initEdgeHandles(cy);
  }, [nodes, edges]);

  // Edge deletion: context menu or delete key
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    const handleDelete = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const sel = cy.$('edge:selected');
        if (sel.length > 0) {
          const toRemove = sel.map((ele: any) => ({ source: ele.data('source'), target: ele.data('target') }));
          setEdges(edges.filter(e => !toRemove.some((rm: any) => rm.source === e.source && rm.target === e.target)));
          setNewEdges(newEdges.filter(e => !toRemove.some((rm: any) => rm.source === e.source && rm.target === e.target)));
        }
      }
    };
    document.addEventListener('keydown', handleDelete);
    // Custom context menu for edge delete
    const onEdgeContext = (evt: any) => {
      evt.preventDefault();
      const edge = evt.target;
      if (edge.isEdge && edge.isEdge()) {
        console.log('Edge context menu:', edge.data());
        const id = edge.data('id');
        const source = edge.data('source');
        const target = edge.data('target');
        // Get mouse position relative to viewport
        const { x, y } = evt.originalEvent;
        setEdgeMenu({ id, source, target, x, y });
      }
    };
    cy.on('cxttap', 'edge', onEdgeContext);
    // Hide menu on tap/click elsewhere
    const hideMenu = () => setEdgeMenu(null);
    cy.on('tap', hideMenu);
    document.addEventListener('scroll', hideMenu, true);
    return () => {
      document.removeEventListener('keydown', handleDelete);
      cy.removeListener('cxttap', 'edge', onEdgeContext);
      cy.removeListener('tap', hideMenu);
      document.removeEventListener('scroll', hideMenu, true);
    };
  }, [edges, newEdges]);

  // Delete edge from context menu
  const handleDeleteEdgeMenu = () => {
    if (!edgeMenu) return;
    setEdges(edges.filter(e => e.id !== edgeMenu.id));
    setNewEdges(newEdges.filter(e => e.id !== edgeMenu.id));
    setEdgeMenu(null);
  };

  // Add new edges to store when user saves (or on explicit action)
  const handleSaveNewEdges = () => {
    if (newEdges.length > 0) {
      setEdges([...edges, ...newEdges]);
      setNewEdges([]);
    }
  };

  const elements = [
    ...nodes.map((n) => ({ data: { id: n.id, label: n.label } })),
    ...edges.map((e) => ({ data: { id: e.id || `${e.source}__${e.target}`, source: e.source, target: e.target }, classes: e.source === e.target ? 'circular' : '' })),
    ...newEdges.map((e) => ({ data: { id: e.id, source: e.source, target: e.target, newEdge: true }, classes: e.source === e.target ? 'circular' : '' })),
  ];

  // Add after menuNode and menuPos state declarations
  useEffect(() => {
    if (!menuNode) return;
    function handleClick(e: MouseEvent) {
      // If the click is inside the NodeMenu, do nothing
      const menu = document.getElementById('node-menu-popup');
      if (menu && menu.contains(e.target as Node)) return;
      setMenuNode(null);
      setMenuPos(null);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuNode]);

  // Add this useEffect to disable the default context menu on the Cytoscape container
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    const container = cy.container();
    const handler = (e: Event) => e.preventDefault();
    container?.addEventListener('contextmenu', handler);
    return () => container?.removeEventListener('contextmenu', handler);
  }, []);

  // Minimal edgehandles test for debugging
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;

    const eh = (cy as any).edgehandles({
      handleNodes: 'node',
      handlePosition: 'right middle',
      handleSize: 10,
      handleColor: '#22c55e',
      handleIcon: true,
      edgeType: () => 'flat',
      loopAllowed: () => true,
      complete: (sourceNode: any, targetNode: any, addedEles: any) => {
        console.log('✔️ Edge created:', sourceNode.id(), '→', targetNode.id());
      },
    });

    (cy as any).ehInstance = eh;

    return () => {
      eh.destroy();
    };
  }, []);

  // Add effect to handle click-to-select target node for edge creation
  useEffect(() => {
    if (!addEdgeSource) return;
    const cy = cyRef.current;
    if (!cy) return;
    const handler = (evt: any) => {
      if (evt.target.isNode && evt.target.isNode()) {
        const targetId = evt.target.id();
        if (targetId === addEdgeSource) {
          setAddEdgeSource(null);
          return;
        }
        // Prevent duplicates
        if (
          edges.some(e => e.source === addEdgeSource && e.target === targetId) ||
          newEdges.some(e => e.source === addEdgeSource && e.target === targetId)
        ) {
          setAddEdgeSource(null);
          return;
        }
        const id = `${addEdgeSource}__${targetId}__${crypto.randomUUID()}`;
        setNewEdges(prev => [...prev, { id, source: addEdgeSource, target: targetId }]);
        setAddEdgeSource(null);
      } else {
        // Clicked elsewhere, exit mode
        setAddEdgeSource(null);
      }
    };
    cy.on('tap', handler);
    return () => cy.removeListener('tap', handler);
  }, [addEdgeSource, edges, newEdges]);

  // Show overlay message when in addEdgeSource mode
  {addEdgeSource && (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div className="bg-blue-600 text-white px-6 py-3 rounded shadow-lg text-lg font-semibold pointer-events-auto">
        Click a node to connect from <b>{nodes.find(n => n.id === addEdgeSource)?.label}</b>
      </div>
    </div>
  )}

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
        {nodes.length === 0 && !loading && !error && (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 select-none">
            <svg width="80" height="80" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="mb-4"><circle cx="12" cy="12" r="10" strokeWidth="2" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h8m-4-4v8" /></svg>
            <div className="text-lg">Your mind map will appear here</div>
          </div>
        )}
        {nodes.length > 0 && (
          <div className="w-full h-full min-h-[400px] relative">
            <CytoscapeComponent
              cy={(cy: Cytoscape.Core) => {
                cyRef.current = cy;
                initEdgeHandles(cy);
                // Add right-click handler for background
                cy.on('cxttap', (evt: any) => {
                  if (evt.target === cy) {
                    // Get mouse position relative to viewport
                    const { x, y } = evt.originalEvent;
                    setAddNodePos({ x, y });
                    setShowAddNode(true);
                  }
                });
              }}
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
                {
                  selector: 'edge[newEdge]',
                  style: {
                    'line-color': '#f59e42', // orange highlight
                    'target-arrow-color': '#f59e42',
                    'width': 4,
                    'line-style': 'dashed',
                    'z-index': 999,
                  },
                },
                {
                  selector: 'edge.circular',
                  style: {
                    'line-color': '#e11d48', // red for circular
                    'target-arrow-color': '#e11d48',
                    'width': 4,
                    'line-style': 'dotted',
                  },
                },
              ]}
              minZoom={0.2}
              maxZoom={2}
              wheelSensitivity={1}
            />
            {/* Save new edges button */}
            {newEdges.length > 0 && (
              <button
                className="absolute top-2 right-2 px-4 py-2 bg-orange-500 text-white rounded shadow z-50"
                onClick={handleSaveNewEdges}
              >
                Save New Connections
              </button>
            )}
            {/* Edge context menu */}
            {edgeMenu && (
              <div
                style={{
                  position: 'fixed',
                  left: edgeMenu.x,
                  top: edgeMenu.y,
                  zIndex: 1000,
                  background: 'white',
                  border: '1px solid #d1d5db',
                  borderRadius: 8,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                  minWidth: 120,
                  padding: 8,
                }}
                onClick={e => e.stopPropagation()}
              >
                <button
                  className="w-full text-left px-3 py-2 rounded hover:bg-red-50 text-red-600"
                  onClick={handleDeleteEdgeMenu}
                >
                  Delete Edge
                </button>
              </div>
            )}
          </div>
        )}
        {/* NodeMenu, Save, Add Node, and Info modals rendered at the end for accessibility */}
        {menuNode && menuPos && (
          <div
            id="node-menu-popup"
            style={{ position: 'fixed', left: menuPos.x, top: menuPos.y, zIndex: 50 }}
          >
            <NodeMenu
              node={nodes.find(n => n.id === menuNode)!}
              onExpand={() => handleExpand(menuNode)}
              onRename={label => handleRename(menuNode, label)}
              onDelete={() => handleDelete(menuNode)}
              onAddEdge={() => {
                setAddEdgeSource(menuNode);
                setMenuNode(null);
              }}
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
          <div
            className="bg-white rounded shadow-lg p-6 max-w-sm relative z-10"
            style={addNodePos ? { position: 'fixed', left: addNodePos.x, top: addNodePos.y, maxWidth: 320 } : {}}
          >
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