//
// MindMap.tsx
//
// This is the main mind map editor component.
//
// Features:
//   - Lets users enter free-form text and generate a mind map using AI (OpenAI GPT-4o)
//   - Visualizes the mind map as a graph using Cytoscape.js
//   - Lets users add, rename, delete, and connect nodes (ideas)
//   - Supports AI-powered suggestions, insights, and clustering
//   - Saves and loads maps from localStorage
//
// This file is large! We'll use section comments and inline comments to help you learn React step by step.
//

import React, { useState, useRef, useEffect } from 'react';
import CytoscapeComponent from 'react-cytoscapejs';
import { useMindMapStore } from '../../hooks/useMindMapStore';
import NodeMenu from './NodeMenu';
import { InformationCircleIcon, EllipsisVerticalIcon, PlusIcon, BookmarkIcon, SparklesIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';
import { Dialog } from '@headlessui/react';
import Cytoscape from 'cytoscape';
import edgehandles from 'cytoscape-edgehandles';
// @ts-ignore
import fcose from 'cytoscape-fcose';

// Fix TypeScript error for missing cytoscape-fcose types
declare module 'cytoscape-fcose';

// The API URL for talking to the backend (set in .env or defaults to localhost)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

// Example prompts to help users get started
const SAMPLE_PROMPTS = [
  {
    label: 'Suggestion',
    value: `okay so like I keep thinking about how I should really get back to reading more, not just scrolling on my phone but like actual books, and maybe I could pair that with some journaling again, like morning pages or something, because it helped me feel more grounded before and also coffee ☕ obviously has to be part of the routine — and oh I should try that new Colombian roast I saw last week, also the gym is still something I want to go back to, but only if I find a schedule that doesn't feel forced, maybe evenings after work? or is morning better? probably depends on if I sleep early which I don't, lol, but sleep — yeah that's a whole other problem, need to cut screen time at night, maybe use a proper alarm clock again instead of my phone, and I still haven't called my dentist back about that thing`,
  }
];

// Utility: debounce a function (waits before running, useful for performance)
function debounce<T extends (...args: any[]) => void>(fn: T, ms: number) {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), ms);
  };
}

// Register Cytoscape plugins (only once)
if (!(Cytoscape as any).registeredEh) {
  Cytoscape.use(edgehandles);
  Cytoscape.use(fcose);
  (Cytoscape as any).registeredEh = true;
}

// TypeScript: extend Cytoscape with our custom property
// (not required for beginners, but helps with plugins)
declare global {
  interface CytoscapeCore {
    ehInstance?: any;
  }
}

const greenDotSVG = true

// --- Main MindMap Component ---
export default function MindMap() {
  // --- State variables ---
  // These hold the current input, nodes, edges, UI state, etc.
  const [input, setInput] = useState('');
  // Get state and actions from the global mind map store
  const {
    nodes, edges, loading, error, setNodes, setEdges, setLoading, setError, reset, addNodes, addEdges, renameNode, deleteNode, saveMap, selectedMapId
  } = useMindMapStore();
  // More local state for UI features
  const [submitted, setSubmitted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [graphHeight, setGraphHeight] = useState(400);
  const [menuNode, setMenuNode] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [showSave, setShowSave] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [showAddNode, setShowAddNode] = useState(false);
  const [newNodeLabel, setNewNodeLabel] = useState('');
  const cyRef = useRef<any>(null);
  const [nodeIconPositions, setNodeIconPositions] = useState<{ [id: string]: { x: number; y: number } }>({});
  const [edgeMenu, setEdgeMenu] = useState<{
    id: string;
    source: string;
    target: string;
    x: number;
    y: number;
  } | null>(null);
  const [addEdgeSource, setAddEdgeSource] = useState<string | null>(null);
  const [addNodePos, setAddNodePos] = useState<{ x: number; y: number } | null>(null);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [suggestError, setSuggestError] = useState<string | null>(null);
  const [suggestedNodes, setSuggestedNodes] = useState<{ parentId: string, nodes: any[], edges: any[] } | null>(null);
  const [insight, setInsight] = useState<any>(null);
  const [insightOpen, setInsightOpen] = useState(false);
  const [insightLoading, setInsightLoading] = useState(false);
  const [insightError, setInsightError] = useState<string | null>(null);
  const [clusterLoading, setClusterLoading] = useState(false);
  const [clusters, setClusters] = useState<any>(null);
  const [clusterError, setClusterError] = useState<string | null>(null);
  const [clusterOpen, setClusterOpen] = useState(false);
  const [detailLevel, setDetailLevel] = useState(5); // Default to Highly Detailed

  // --- Typing animation for heading (just for fun/UI polish) ---
  const TYPING_TEXT = "enter streams of consciousness...";
  const [typedText, setTypedText] = useState("");
  const [typingForward, setTypingForward] = useState(true);

  // Animate the heading text (shows how to use useEffect for timers)
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    if (typingForward) {
      if (typedText.length < TYPING_TEXT.length) {
        timeout = setTimeout(() => setTypedText(TYPING_TEXT.slice(0, typedText.length + 1)), 80);
      } else {
        timeout = setTimeout(() => setTypingForward(false), 1200);
      }
    } else {
      if (typedText.length > 0) {
        timeout = setTimeout(() => setTypedText(TYPING_TEXT.slice(0, typedText.length - 1)), 40);
      } else {
        timeout = setTimeout(() => setTypingForward(true), 600);
      }
    }
    return () => clearTimeout(timeout);
  }, [typedText, typingForward]);

  // --- Responsive graph height ---
  // This effect updates the graph height when the window resizes
  useEffect(() => {
    function handleResize() {
      if (containerRef.current) {
        setGraphHeight(containerRef.current.offsetHeight);
      }
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- Node menu icon overlay logic ---
  // This effect updates the position of the node menu icon when the graph changes
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

  // --- Node menu icon click handler ---
  const handleMenuIconClick = (nodeId: string, evt: React.MouseEvent) => {
    setMenuNode(nodeId);
    setMenuPos(nodeIconPositions[nodeId]);
    evt.stopPropagation();
  };

  // --- Right-click on node to open NodeMenu at correct position ---
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
        body: JSON.stringify({ text: input, detailLevel }),
      });
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      setNodes(data.nodes);
      setEdges(data.edges);
      // Automatically reformat the graph after generating
      setTimeout(() => {
        handleReformat();
      }, 0);
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
          edges.some(e => e.source === source && e.target === target)
        ) {
          addedEles.remove();
          return;
        }
        const id = `${source}__${target}__${crypto.randomUUID()}`;
        setEdges([...edges, { id, source, target }]);
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
  }, [edges]);

  // Delete edge from context menu
  const handleDeleteEdgeMenu = () => {
    if (!edgeMenu) return;
    setEdges(edges.filter(e => {
      if (e.id) {
        return e.id !== edgeMenu.id;
      } else {
        // fallback: match by source/target if id is missing
        return !(e.source === edgeMenu.source && e.target === edgeMenu.target);
      }
    }));
    setEdgeMenu(null);
  };

  // Handler for AI children suggestion
  const handleSuggestChildren = async (nodeId: string) => {
    setSuggestLoading(true);
    setSuggestError(null);
    setSuggestedNodes(null);
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    try {
      const res = await fetch(`${API_URL}/api/maps/suggest-children`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: node.label, parentId: node.id, detailLevel }),
      });
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      // data.suggestions: [{ label }]
      // Generate new node IDs and edges
      const newNodes = data.suggestions.map((s: any) => ({
        id: `${nodeId}__ai__${crypto.randomUUID()}`,
        label: s.label,
        aiSuggested: true,
      }));
      const newEdges = newNodes.map((n: any) => ({ source: nodeId, target: n.id }));
      setSuggestedNodes({ parentId: nodeId, nodes: newNodes, edges: newEdges });
    } catch (err: any) {
      setSuggestError(err.message || 'Unknown error');
    } finally {
      setSuggestLoading(false);
    }
  };

  // Accept AI suggestions
  const handleAcceptSuggestions = () => {
    if (!suggestedNodes) return;
    addNodes(suggestedNodes.nodes);
    addEdges(suggestedNodes.edges);
    setSuggestedNodes(null);
  };

  // Remove AI suggestions
  const handleRemoveSuggestions = () => {
    setSuggestedNodes(null);
  };

  const elements = [
    ...nodes.map((n) => ({ data: { id: n.id, label: n.label } })),
    ...edges.map((e) => ({ data: { id: e.id || `${e.source}__${e.target}`, source: e.source, target: e.target }, classes: e.source === e.target ? 'circular' : '' })),
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
          edges.some(e => e.source === addEdgeSource && e.target === targetId)
        ) {
          setAddEdgeSource(null);
          return;
        }
        const id = `${addEdgeSource}__${targetId}__${crypto.randomUUID()}`;
        setEdges([...edges, { id, source: addEdgeSource, target: targetId }]);
        setAddEdgeSource(null);
      } else {
        // Clicked elsewhere, exit mode
        setAddEdgeSource(null);
      }
    };
    cy.on('tap', handler);
    return () => cy.removeListener('tap', handler);
  }, [addEdgeSource, edges]);

  // Show overlay message when in addEdgeSource mode
  {addEdgeSource && (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div className="bg-blue-600 text-white px-6 py-3 rounded shadow-lg text-lg font-semibold pointer-events-auto">
        Click a node to connect from <b>{nodes.find(n => n.id === addEdgeSource)?.label}</b>
      </div>
    </div>
  )}

  // Handler for generating insight
  const handleGenerateInsight = async () => {
    if (insight) {
      setInsightOpen(true);
      return;
    }
    setInsightLoading(true);
    setInsightError(null);
    setInsightOpen(true);
    try {
      const res = await fetch(`${API_URL}/api/maps/insight`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodes, edges, detailLevel }),
      });
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      setInsight(data.insight);
    } catch (err: any) {
      setInsightError(err.message || 'Unknown error');
    } finally {
      setInsightLoading(false);
    }
  };

  // Handler to reformat (spread out) the map
  const handleReformat = () => {
    const cy = cyRef.current;
    if (cy) {
      cy.layout({
        name: 'fcose',
        quality: 'proof', // maximize quality
        randomize: true,
        animate: true,
        animationDuration: 1000,
        fit: true,
        padding: 80,
        nodeRepulsion: 100000,
        idealEdgeLength: 200,
        edgeElasticity: 0.1,
        gravity: 0.25,
        gravityRange: 3.8,
        nodeSeparation: 200,
        packComponents: true,
        tilingPaddingVertical: 40,
        tilingPaddingHorizontal: 40,
        nodeDimensionsIncludeLabels: true,
      }).run();
    }
  };

  // Reformat the map when a map is loaded from the dashboard
  useEffect(() => {
    // Only reformat if a map is loaded (not on initial empty state)
    if (selectedMapId && nodes.length > 0) {
      // Debounce to avoid running too often
      const timeout = setTimeout(() => {
        handleReformat();
      }, 200);
      return () => clearTimeout(timeout);
    }
  }, [selectedMapId]);

  const handleSemanticClustering = async () => {
    setClusterLoading(true);
    setClusterError(null);
    setClusters(null);
    try {
      const res = await fetch(`${API_URL}/api/maps/semantic-clusters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodes, edges, detailLevel })
      });
      if (!res.ok) throw new Error('Failed to get clusters');
      const data = await res.json();
      setClusters(data.clusters);
      setClusterOpen(true);
    } catch (err: any) {
      setClusterError(err.message || 'Unknown error');
    } finally {
      setClusterLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-pink-50 to-yellow-50 font-sans flex flex-col md:flex-row">
      {/* Left: Sidebar */}
      <div className="md:w-[500px] w-full flex-shrink-0 bg-blue-50/60 border-r border-blue-100 flex flex-col gap-6 p-6 min-h-screen">
        <div className="flex items-center gap-2 mb-1">
          <button type="button" onClick={() => setShowInfo(true)} className="mr-2 text-blue-600 hover:text-blue-700 transition">
            <InformationCircleIcon className="w-6 h-6" />
          </button>
          <span className="font-extrabold text-2xl text-gray-900">
            <span className="whitespace-nowrap">{typedText}<span className="border-r-2 border-pink-400 animate-pulse ml-0.5" style={{display:'inline-block',width:2,height:'1.2em',verticalAlign:'middle'}}></span></span>
          </span>
        </div>
        <div className="mb-2">
          <label htmlFor="detail-slider" className="block text-sm font-medium text-gray-700 mb-1">
            Detail Level: <b>{detailLevel}</b> ({['Very Brief','Brief','Moderate','Detailed','Highly Detailed'][detailLevel-1]})
          </label>
          <input
            id="detail-slider"
            type="range"
            min={1}
            max={5}
            value={detailLevel}
            onChange={e => setDetailLevel(Number(e.target.value))}
            className="w-full"
          />
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <textarea
            className="w-full min-h-[400px] p-4 border-2 border-blue-100 rounded-2xl bg-blue-50 focus:border-pink-300 focus:ring-2 focus:ring-pink-100 text-lg transition"
            placeholder="Try 'Planning a creative project', 'Understanding climate anxiety', or 'Exploring childhood memories'"
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={loading}
          />
          <div className="flex flex-col gap-2">
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 text-white rounded-full font-semibold shadow hover:bg-blue-700 transition disabled:opacity-50"
              disabled={loading || !input.trim()}
            >
              <span className="text-white">{loading ? 'Generating...' : 'Generate Mind Map'}</span>
            </button>
            <div className="flex gap-2 flex-row mt-0 w-full">
              {SAMPLE_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  type="button"
                  className="px-5 py-2 bg-gray-100 text-gray-700 rounded-full font-semibold shadow hover:bg-gray-200 transition flex-1"
                  onClick={() => setInput(prompt.value)}
                  disabled={loading}
                >
                  {prompt.label}
                </button>
              ))}
              <button
                type="button"
                className="px-5 py-2 bg-gray-100 text-gray-700 rounded-full font-semibold shadow hover:bg-gray-200 transition flex-1"
                onClick={handleReformat}
                disabled={nodes.length === 0}
              >
                Reformat
              </button>
              <button
                type="button"
                className="px-5 py-2 bg-gray-100 text-gray-700 rounded-full font-semibold shadow hover:bg-gray-200 transition flex-1"
                onClick={handleReset}
                disabled={loading}
              >
                Reset
              </button>
              <button
                type="button"
                className="px-5 py-2 bg-gray-100 text-gray-700 rounded-full font-semibold shadow hover:bg-gray-200 transition flex-1 flex items-center justify-center"
                onClick={() => setShowSave(true)}
                disabled={nodes.length === 0}
                title="Save Map"
              >
                <BookmarkIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </form>
        {/* Sample prompts below textarea */}
        {error && <div className="text-red-600 bg-white rounded shadow p-2 mt-2">{error}</div>}
        {/* Generate Insight and Semantic Clustering buttons */}
        <div className="flex gap-2 mt-2">
          <button
            className="px-5 py-2 bg-purple-500 text-white rounded-full font-semibold shadow hover:bg-purple-600 w-fit transition flex items-center gap-2"
            onClick={handleGenerateInsight}
            disabled={insightLoading || nodes.length === 0}
            title="Analyze your mind map with AI"
          >
            <SparklesIcon className="w-5 h-5" />
            {insight ? 'Show Insight' : 'Generate Insight'}
          </button>
          <button
            className="px-5 py-2 bg-blue-500 text-white rounded-full font-semibold shadow hover:bg-blue-600 w-fit transition flex items-center gap-2"
            onClick={handleSemanticClustering}
            disabled={clusterLoading || nodes.length === 0}
            title="Group nodes into semantic clusters with AI"
          >
            <SparklesIcon className="w-5 h-5" />
            {clusterLoading ? 'Clustering...' : 'Semantic Clustering'}
          </button>
        </div>
        {/* Insight panel below the button */}
        {insightOpen && (
          <div className="mt-2 bg-white border-2 border-purple-200 rounded-2xl shadow-lg p-4 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <SparklesIcon className="w-6 h-6 text-purple-500" />
              <span className="text-lg font-bold">Mind Map Insight</span>
              <button type="button" className="ml-auto text-gray-400 hover:text-gray-600" onClick={() => setInsightOpen(false)}>&times;</button>
            </div>
            {insightLoading && <div className="text-gray-600">Analyzing your mind map...</div>}
            {insightError && <div className="text-red-600">{insightError}</div>}
            {insight && !insightLoading && !insightError && (
              <div className="space-y-4">
                <div>
                  <div className="font-semibold text-gray-700 mb-1">High-level Insight</div>
                  <div className="text-gray-800">{insight.insight}</div>
                </div>
                <div>
                  <div className="font-semibold text-gray-700 mb-1">Potential Blind Spot</div>
                  <div className="text-gray-800">{insight.blindSpot}</div>
                </div>
                <div>
                  <div className="font-semibold text-gray-700 mb-1">Key Clusters / Patterns</div>
                  <div className="text-gray-800">{insight.clusters}</div>
                </div>
              </div>
            )}
          </div>
        )}
        {/* Semantic Clustering dialog */}
        {clusterOpen && (
          <div className="mt-2 bg-white border-2 border-blue-200 rounded-2xl shadow-lg p-4 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <SparklesIcon className="w-6 h-6 text-blue-500" />
              <span className="text-lg font-bold">Semantic Clusters</span>
              <button type="button" className="ml-auto text-gray-400 hover:text-gray-600" onClick={() => setClusterOpen(false)}>&times;</button>
            </div>
            {clusterLoading && <div className="text-gray-600">Clustering your mind map...</div>}
            {clusterError && <div className="text-red-600">{clusterError}</div>}
            {clusters && !clusterLoading && !clusterError && (
              <div className="space-y-4">
                {clusters.length === 0 && <div>No clusters found.</div>}
                {clusters.map((cluster: any, idx: number) => (
                  <div key={idx} className="mb-4 p-3 rounded border border-blue-100 bg-blue-50/50">
                    <div className="font-semibold text-blue-700 mb-1">
                      {cluster.name} <span className="text-xs text-gray-500">({cluster.nodeIds.length} item{cluster.nodeIds.length !== 1 ? 's' : ''})</span>
                    </div>
                    <ul className="list-disc pl-5 text-gray-800 text-sm">
                      {cluster.nodeIds.map((id: string) => {
                        const node = nodes.find(n => n.id === id);
                        return <li key={id}>{node ? node.label : <span className="italic text-gray-400">Unknown node</span>}</li>;
                      })}
                    </ul>
                    {cluster.name === 'Other' && (
                      <div className="text-xs text-gray-500 mt-1">These nodes didn't fit into any main group.</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      {/* Right: Main Map Area */}
      <div className="flex-1 flex flex-col bg-white min-h-0">
        <div className="flex-1 w-full h-full flex items-center justify-center relative min-h-0">
          {nodes.length === 0 && !loading && !error ? (
            <div className="flex flex-col items-center justify-center h-full text-black-200 select-none">
              <div className="mb-4 text-7xl">➕</div>
              <div className="text-2xl font-bold">Your mind map will appear here</div>
              <div className="text-base text-black-300 mt-2">Start by entering your notes and clicking <span className='font-semibold text-blue-600'>Generate Mind Map</span>!</div>
            </div>
          ) : (
            <div ref={containerRef} className="relative w-full h-full flex-1 min-h-0">
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
                style={{ width: '100%', height: graphHeight }}
                layout={{ name: 'preset' }}
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
                      'font-style': 'data(aiSuggested)',
                      'text-decoration': 'data(aiSuggested)',
                    },
                  },
                  {
                    selector: 'node[aiSuggested]',
                    style: {
                      'background-color': '#a5b4fc',
                      'font-style': 'italic',
                      'text-decoration': 'underline dotted',
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
              {suggestedNodes && (
                <div className="absolute top-8 right-8 z-50 bg-white border border-blue-200 rounded shadow-lg p-4 flex flex-col gap-2 min-w-[260px]">
                  <div className="flex items-center gap-2 mb-2">
                    <SparklesIcon className="w-5 h-5 text-blue-500" />
                    <span className="italic text-blue-700">AI-suggested children</span>
                  </div>
                  <ul className="mb-2">
                    {suggestedNodes.nodes.map(n => (
                      <li key={n.id} className="flex items-center gap-2 italic text-gray-700">
                        <SparklesIcon className="w-4 h-4 text-blue-400" />
                        <span>{n.label}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="flex gap-2">
                    <button className="flex-1 flex items-center justify-center gap-1 px-3 py-1 bg-blue-600 text-white rounded shadow hover:bg-blue-700" onClick={handleAcceptSuggestions}>
                      <CheckIcon className="w-4 h-4" /> Accept
                    </button>
                    <button className="flex-1 flex items-center justify-center gap-1 px-3 py-1 bg-gray-200 text-gray-700 rounded shadow hover:bg-gray-300" onClick={handleRemoveSuggestions}>
                      <XMarkIcon className="w-4 h-4" /> Remove
                    </button>
                  </div>
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
                onRename={label => handleRename(menuNode, label)}
                onDelete={() => handleDelete(menuNode)}
                onAddEdge={() => {
                  setAddEdgeSource(menuNode);
                  setMenuNode(null);
                }}
                onSuggestChildren={() => handleSuggestChildren(menuNode)}
                loading={suggestLoading}
                error={suggestError}
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
              <ul className="list-disc pl-5 space-y-2 text-gray-700 mb-2">
                <li><b>Enter or paste your thoughts</b> in the large text area on the left. This can be a stream of consciousness, notes, or any ideas you want to map out.</li>
                <li><b>Generate Mind Map</b>: Click this button to turn your text into a visual mind map. The AI will analyze your input and create nodes and connections based on your ideas.</li>
                <li><b>Sample Prompts</b>: Use these for inspiration or to quickly see how the mind map works. Clicking a sample will fill the text area for you.</li>
                <li><b>Reformat</b>: If your map looks cluttered or you want to spread out the nodes, click this to automatically rearrange everything for maximum clarity and minimal edge overlap.</li>
                <li><b>Reset</b>: Clears the current mind map and text area so you can start fresh.</li>
                <li><b>Save Map</b> (<BookmarkIcon className="inline w-4 h-4 align-text-bottom" />): Save your current mind map for later. You can load saved maps from the dashboard.</li>
                <li><b>Insight</b> (<SparklesIcon className="inline w-4 h-4 align-text-bottom" />): Get an AI-generated analysis of your mind map, including high-level insights, potential blind spots, and key patterns.</li>
                <li><b>Nodes</b>: Each box in the map is a node representing an idea or topic. <b>Right-click</b> a node to:
                  <ul className="list-disc pl-5 mt-1 space-y-1">
                    <li><b>Rename</b>: Edit the label of the node.</li>
                    <li><b>Delete</b>: Remove the node and its connections.</li>
                    <li><b>Add Edge</b>: Manually connect this node to another by clicking it, then clicking the target node.</li>
                    <li><b>Suggest Children</b>: Get AI suggestions for possible subtopics or related ideas.</li>
                  </ul>
                </li>
                <li><b>Add Node</b>: Right-click the background or use the Add Node button to manually add a new idea to your map.</li>
                <li><b>Edges</b>: Lines between nodes show relationships. Right-click an edge to delete it. You can also select and press <kbd>Delete</kbd> or <kbd>Backspace</kbd>.</li>
              </ul>
              <div className="text-sm text-gray-500 mt-2">Tip: Try the sample prompts or use the AI features to get the most out of your mind mapping experience!</div>
            </div>
          </Dialog>
        </div>
      </div>
    </div>
  );
} 