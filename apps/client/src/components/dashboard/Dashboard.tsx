import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMindMapStore, MindMap } from '../../hooks/useMindMapStore';

export default function Dashboard() {
  const navigate = useNavigate();
  const {
    listMaps, loadMap, deleteMap, renameMap, setSelectedMapId
  } = useMindMapStore();
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const maps = listMaps();

  const handleLoad = (id: string) => {
    loadMap(id);
    setSelectedMapId(id);
    navigate('/editor');
  };
  const handleDelete = (id: string) => {
    if (window.confirm('Delete this map?')) deleteMap(id);
  };
  const handleRename = (id: string, name: string) => {
    renameMap(id, name);
    setRenamingId(null);
  };

  return (
    <div className="max-w-3xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Your Mind Maps</h1>
      {maps.length === 0 ? (
        <div className="text-gray-500">No saved maps yet.</div>
      ) : (
        <div className="bg-white rounded shadow divide-y">
          {maps.map((map) => (
            <div key={map.id} className="flex items-center justify-between px-4 py-3">
              <div className="flex flex-col">
                {renamingId === map.id ? (
                  <div className="flex gap-2 items-center">
                    <input
                      className="border rounded px-2 py-1"
                      value={renameValue}
                      onChange={e => setRenameValue(e.target.value)}
                      autoFocus
                      onKeyDown={e => { if (e.key === 'Enter') handleRename(map.id, renameValue); }}
                    />
                    <button className="text-blue-600" onClick={() => handleRename(map.id, renameValue)}>Save</button>
                    <button className="text-gray-400" onClick={() => setRenamingId(null)}>Cancel</button>
                  </div>
                ) : (
                  <span className="font-semibold text-lg">{map.name}</span>
                )}
                <span className="text-xs text-gray-400 mt-1">
                  Created: {new Date(map.created).toLocaleString()}<br />
                  Modified: {new Date(map.modified).toLocaleString()}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  className="px-3 py-1 bg-blue-600 text-white rounded"
                  onClick={() => handleLoad(map.id)}
                >Load</button>
                <button
                  className="px-3 py-1 bg-gray-200 rounded"
                  onClick={() => { setRenamingId(map.id); setRenameValue(map.name); }}
                >Rename</button>
                <button
                  className="px-3 py-1 bg-red-600 text-white rounded"
                  onClick={() => handleDelete(map.id)}
                >Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 