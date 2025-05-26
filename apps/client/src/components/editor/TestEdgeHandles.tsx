//
// TestEdgeHandles.tsx
//
// This is a minimal demo for testing Cytoscape edgehandles in React.
// - Shows two nodes. You can drag from one to another to create an edge.
// - Useful for learning how Cytoscape plugins work with React.
//
// Learnings for beginners:
//   - How to use useRef to access Cytoscape instance
//   - How to use useEffect for setup/cleanup
//   - How to use CytoscapeComponent in React
//   - How to style graphs and nodes
//

import React, { useEffect, useRef } from 'react';
import CytoscapeComponent from 'react-cytoscapejs';
import Cytoscape from 'cytoscape';
import edgehandles from 'cytoscape-edgehandles';

// Register plugin (safe to call multiple times)
if (!(Cytoscape as any).registeredEh) {
  Cytoscape.use(edgehandles);
  (Cytoscape as any).registeredEh = true;
}

export default function TestEdgeHandles() {
  // useRef lets you keep a reference to the Cytoscape instance
  const cyRef = useRef<any>(null);

  // Define the nodes and edges for the graph
  const elements = [
    { data: { id: 'a', label: 'Node A' } },
    { data: { id: 'b', label: 'Node B' } },
  ];

  // useEffect runs after the component mounts
  // Here, we set up the edgehandles plugin
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    const eh = (cy as any).edgehandles({
      handleNodes: 'node',
      handlePosition: 'right middle',
      handleColor: '#22c55e',
      handleIcon: 'https://upload.wikimedia.org/wikipedia/commons/8/83/Green_dot.svg',
      handleSize: 16,
      loopAllowed: () => true,
      edgeType: () => 'flat',
      complete: (sourceNode: any, targetNode: any, addedEles: any) => {
        // This runs when an edge is created
        console.log('✔️ Edge created:', sourceNode.id(), '→', targetNode.id());
      },
    });
    // Cleanup: destroy the plugin when the component unmounts
    return () => eh.destroy();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <h2 className="text-2xl font-bold mb-4">Minimal EdgeHandles Test</h2>
      <CytoscapeComponent
        cy={(cy: Cytoscape.Core) => (cyRef.current = cy)}
        elements={elements}
        style={{ width: '600px', height: '400px', background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
        layout={{ name: 'grid' }}
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
              'width': 80,
              'height': 40,
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
        wheelSensitivity={1}
      />
      <p className="mt-4 text-gray-600">Open the browser console and drag from one node to another to test edgehandles.</p>
    </div>
  );
} 