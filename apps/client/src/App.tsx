import { Routes, Route, Link } from 'react-router-dom';
import MindMap from './components/editor/MindMap';
import Dashboard from './components/dashboard/Dashboard';

function Landing() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <h1 className="text-4xl font-bold mb-4">Map My Mind</h1>
      <p className="mb-8 text-lg text-gray-700">AI‑Powered Visual Thought Organizer</p>
      <Link to="/editor" className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">Go to Editor</Link>
      <Link to="/dashboard" className="mt-4 text-blue-600 underline">View Saved Maps</Link>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/editor" element={<MindMap />} />
      <Route path="/dashboard" element={<Dashboard />} />
    </Routes>
  );
} 