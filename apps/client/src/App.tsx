//
// App.tsx is the main component for your React app.
//
// - It sets up the navigation bar and the different pages (routes).
// - Uses React Router to switch between the landing page, editor, and dashboard.
// - Each <Route> shows a different component based on the URL.
//

import { Routes, Route, Link } from 'react-router-dom';
import MindMap from './components/editor/MindMap';
import Dashboard from './components/dashboard/Dashboard';
import Navbar from './components/Navbar';

// This is the landing page (shown at "/")
function Landing() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <h1 className="text-4xl font-bold mb-4">Synaptia</h1>
      <p className="mb-8 text-lg text-gray-700">AI‑Powered Visual Thought Organizer</p>
      {/* Link to the mind map editor */}
      <Link to="/editor" className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">Go to Editor</Link>
      {/* Link to the dashboard */}
      <Link to="/dashboard" className="mt-4 text-blue-600 underline">View Saved Maps</Link>
    </div>
  );
}

// This is the main app component.
// It always shows the Navbar, and switches pages below it.
export default function App() {
  return (
    <>
      {/* The navigation bar at the top */}
      <Navbar />
      {/*
        Routes define which component to show for each URL path.
        - "/" shows the Landing page.
        - "/editor" shows the MindMap editor.
        - "/dashboard" shows the Dashboard.
      */}
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/editor" element={<MindMap />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </>
  );
} 