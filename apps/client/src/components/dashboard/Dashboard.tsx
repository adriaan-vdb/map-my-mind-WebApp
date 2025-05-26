//
// Dashboard.tsx
//
// This component shows the dashboard where users can:
//   - See all their saved mind maps
//   - Open, rename, or delete a map
//   - Create a new map
//
// It uses React state, effects, and event handlers.
// It also uses a global store (Zustand) for managing mind maps.
//

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMindMapStore } from '../../hooks/useMindMapStore';
import { PlusIcon, PencilIcon, TrashIcon, ArrowRightCircleIcon } from '@heroicons/react/24/outline';

export default function Dashboard() {
  // useNavigate lets you change the page in code (like going to the editor)
  const navigate = useNavigate();
  // Get functions and state from the global mind map store
  const {
    listSavedMaps, loadMap, deleteMap, renameMap, setSelectedMapId, reset, version, cleanupInvalidMaps
  } = useMindMapStore();
  // Local state for renaming a map
  const [renamingName, setRenamingName] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  // Local state for the list of maps
  const [maps, setMaps] = useState(listSavedMaps());

  // useEffect runs code when something changes (here, when version changes)
  // This keeps the list of maps up to date if you add/delete/rename
  React.useEffect(() => {
    setMaps(listSavedMaps());
  }, [version]);

  // Handler: open a map in the editor
  const handleLoad = (name: string) => {
    loadMap(name);
    setSelectedMapId(name);
    navigate('/editor');
  };
  // Handler: delete a map (asks for confirmation)
  const handleDelete = (name: string) => {
    if (window.confirm('Delete this map?')) deleteMap(name);
  };
  // Handler: rename a map
  const handleRename = (oldName: string, newName: string) => {
    renameMap(oldName, newName);
    setRenamingName(null);
  };
  // Handler: create a new map (resets state and goes to editor)
  const handleNewMap = () => {
    reset();
    setSelectedMapId(null);
    navigate('/editor');
  };

  return (
    <div className="max-w-5xl mx-auto py-10 px-4 relative">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">Your Mind Maps</h1>
        {/* Button to create a new map */}
        <button
          className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition text-lg font-semibold"
          onClick={handleNewMap}
        >
          <PlusIcon className="w-6 h-6" /> New Map
        </button>
      </div>
      {/* If there are no maps, show a friendly empty state */}
      {maps.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-gray-400">
          <svg width="80" height="80" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="mb-4"><circle cx="12" cy="12" r="10" strokeWidth="2" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h8m-4-4v8" /></svg>
          <div className="text-xl mb-2">No saved mind maps yet</div>
          <button
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-full shadow hover:bg-blue-700 transition flex items-center gap-2"
            onClick={handleNewMap}
          >
            <PlusIcon className="w-5 h-5" /> Create your first map
          </button>
        </div>
      ) : (
        // Otherwise, show the list of saved maps
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {maps.map((map) => (
            <div key={map.name} className="bg-white rounded-xl shadow-md p-6 flex flex-col justify-between h-full group border border-gray-100 hover:border-blue-400 transition">
              <div className="flex-1">
                {/* If renaming, show an input box */}
                {renamingName === map.name ? (
                  <div className="flex gap-2 items-center mb-2">
                    <input
                      className="border rounded px-2 py-1 flex-1"
                      value={renameValue}
                      onChange={e => setRenameValue(e.target.value)}
                      autoFocus
                      onKeyDown={e => { if (e.key === 'Enter') handleRename(map.name, renameValue); }}
                    />
                    <button className="text-blue-600 font-semibold" onClick={() => handleRename(map.name, renameValue)}>Save</button>
                    <button className="text-gray-400 font-semibold" onClick={() => setRenamingName(null)}>Cancel</button>
                  </div>
                ) : (
                  // Otherwise, show the map name and a rename button
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-bold text-lg truncate flex-1">{map.name}</span>
                    <button
                      className="p-1 rounded hover:bg-blue-50"
                      onClick={() => { setRenamingName(map.name); setRenameValue(map.name); }}
                      title="Rename"
                    >
                      <PencilIcon className="w-5 h-5 text-blue-500" />
                    </button>
                  </div>
                )}
                {/* Show when the map was created */}
                <div className="text-xs text-gray-400 mb-2">
                  Created: {new Date(map.createdAt).toLocaleString()}
                </div>
              </div>
              {/* Buttons to open or delete the map */}
              <div className="flex gap-2 mt-4">
                <button
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg font-semibold shadow hover:bg-blue-700 transition"
                  onClick={() => handleLoad(map.name)}
                  title="Open in Editor"
                >
                  <ArrowRightCircleIcon className="w-5 h-5" /> Open
                </button>
                <button
                  className="flex items-center justify-center p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600"
                  onClick={() => handleDelete(map.name)}
                  title="Delete"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 