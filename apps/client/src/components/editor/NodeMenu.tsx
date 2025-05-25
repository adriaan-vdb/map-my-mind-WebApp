import React, { useState } from 'react';
import type { MindMapNode } from '../../hooks/useMindMapStore';

interface NodeMenuProps {
  node: MindMapNode;
  onExpand: () => void;
  onRename: (label: string) => void;
  onDelete: () => void;
  onAddEdge: () => void;
  onSuggestChildren?: () => void;
  loading: boolean;
  error: string | null;
}

export default function NodeMenu({ node, onExpand, onRename, onDelete, onAddEdge, onSuggestChildren, loading, error }: NodeMenuProps) {
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(node.label);

  const handleRename = () => {
    onRename(label);
    setEditing(false);
  };

  return (
    <div className="absolute z-10 bg-white border rounded shadow p-2 flex flex-col gap-2 min-w-[140px]">
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
        <>
          <button className="text-left hover:bg-gray-100 px-2 py-1 rounded" onClick={onExpand} disabled={loading}>Expand</button>
          <button className="text-left hover:bg-gray-100 px-2 py-1 rounded" onClick={() => setEditing(true)} disabled={loading}>Rename</button>
          <button className="text-left hover:bg-gray-100 px-2 py-1 rounded" onClick={onAddEdge} disabled={loading}>Add Edge</button>
          <button className="text-left hover:bg-gray-100 px-2 py-1 rounded" onClick={onSuggestChildren} disabled={loading}>
            Suggest children
          </button>
          <button className="text-left hover:bg-gray-100 px-2 py-1 rounded text-red-600" onClick={onDelete} disabled={loading}>Delete</button>
        </>
      )}
      {error && <div className="text-xs text-red-600 mt-1">{error}</div>}
    </div>
  );
} 