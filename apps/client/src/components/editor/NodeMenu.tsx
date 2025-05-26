//
// NodeMenu.tsx
//
// This component shows a context menu for a node in the mind map.
// - Lets users rename, delete, add edges, or get AI suggestions for a node.
// - Appears when you right-click a node or click the menu icon.
//
// Learnings for beginners:
//   - How to use props to pass data and functions
//   - How to use local state for editing
//   - How to handle events (click, change, keydown)
//   - How to conditionally render UI (edit mode vs normal)
//

import React, { useState } from 'react';
import type { MindMapNode } from '../../hooks/useMindMapStore';

// Define the props (inputs) this component expects
interface NodeMenuProps {
  node: MindMapNode; // The node this menu is for
  onRename: (label: string) => void; // Function to call when renaming
  onDelete: () => void; // Function to call when deleting
  onAddEdge: () => void; // Function to call when adding an edge
  onSuggestChildren?: () => void; // Function to call for AI suggestions
  loading: boolean; // Is an action in progress?
  error: string | null; // Any error to show
}

// The main component function
export default function NodeMenu({ node, onRename, onDelete, onAddEdge, onSuggestChildren, loading, error }: NodeMenuProps) {
  // Local state: are we editing the label?
  const [editing, setEditing] = useState(false);
  // Local state: the current label value
  const [label, setLabel] = useState(node.label);

  // Handler: save the new label
  const handleRename = () => {
    onRename(label);
    setEditing(false);
  };

  return (
    <div className="absolute z-10 bg-white border rounded shadow p-2 flex flex-col gap-2 min-w-[140px]">
      {/* If editing, show an input box and save/cancel buttons */}
      {editing ? (
        <div className="flex gap-2">
          <input
            className="border rounded px-2 py-1 flex-1"
            value={label}
            onChange={e => setLabel(e.target.value)}
            disabled={loading}
            autoFocus
            onKeyDown={e => { if (e.key === 'Enter') handleRename(); }}
          />
          <button className="text-blue-600" onClick={handleRename} disabled={loading}>Save</button>
          <button className="text-gray-400" onClick={() => setEditing(false)} disabled={loading}>Cancel</button>
        </div>
      ) : (
        // Otherwise, show the menu options
        <>
          <button className="text-left hover:bg-gray-100 px-2 py-1 rounded" onClick={() => setEditing(true)} disabled={loading}>Rename</button>
          <button className="text-left hover:bg-gray-100 px-2 py-1 rounded" onClick={onAddEdge} disabled={loading}>Add Edge</button>
          <button className="text-left hover:bg-gray-100 px-2 py-1 rounded" onClick={onSuggestChildren} disabled={loading}>
            Suggest children
          </button>
          <button className="text-left hover:bg-gray-100 px-2 py-1 rounded text-red-600" onClick={onDelete} disabled={loading}>Delete</button>
        </>
      )}
      {/* Show error if there is one */}
      {error && <div className="text-xs text-red-600 mt-1">{error}</div>}
    </div>
  );
} 