import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMindMapStore, MindMap } from '../../hooks/useMindMapStore';
import { PlusIcon, PencilIcon, TrashIcon, ArrowRightCircleIcon } from '@heroicons/react/24/outline';

export default function Dashboard() {
  const navigate = useNavigate();
  const {
    listMaps, loadMap, deleteMap, renameMap, setSelectedMapId, reset
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
  const handleNewMap = () => {
    reset();
    setSelectedMapId(null);
    navigate('/editor');
  };

  return (
    <div className="max-w-5xl mx-auto py-10 px-4 relative">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">Your Mind Maps</h1>
        <button
          className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition text-lg font-semibold"
          onClick={handleNewMap}
        >
          <PlusIcon className="w-6 h-6" /> New Map
        </button>
      </div>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {maps.map((map) => (
            <div key={map.id} className="bg-white rounded-xl shadow-md p-6 flex flex-col justify-between h-full group border border-gray-100 hover:border-blue-400 transition">
              <div className="flex-1">
                {renamingId === map.id ? (
                  <div className="flex gap-2 items-center mb-2">
                    <input
                      className="border rounded px-2 py-1 flex-1"
                      value={renameValue}
                      onChange={e => setRenameValue(e.target.value)}
                      autoFocus
                      onKeyDown={e => { if (e.key === 'Enter') handleRename(map.id, renameValue); }}
                    />
                    <button className="text-blue-600 font-semibold" onClick={() => handleRename(map.id, renameValue)}>Save</button>
                    <button className="text-gray-400 font-semibold" onClick={() => setRenamingId(null)}>Cancel</button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-bold text-lg truncate flex-1">{map.name}</span>
                    <button
                      className="p-1 rounded hover:bg-blue-50"
                      onClick={() => { setRenamingId(map.id); setRenameValue(map.name); }}
                      title="Rename"
                    >
                      <PencilIcon className="w-5 h-5 text-blue-500" />
                    </button>
                  </div>
                )}
                <div className="text-xs text-gray-400 mb-2">
                  Created: {new Date(map.created).toLocaleString()}<br />
                  Modified: {new Date(map.modified).toLocaleString()}
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg font-semibold shadow hover:bg-blue-700 transition"
                  onClick={() => handleLoad(map.id)}
                  title="Open in Editor"
                >
                  <ArrowRightCircleIcon className="w-5 h-5" /> Open
                </button>
                <button
                  className="flex items-center justify-center p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600"
                  onClick={() => handleDelete(map.id)}
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