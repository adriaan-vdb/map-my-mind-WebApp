//
// Navbar.tsx
//
// This component shows the navigation bar at the top of the app.
// - It lets users switch between Home, Dashboard, and Mind Map Editor.
// - It is responsive: shows a hamburger menu on mobile.
// - Uses React Router's <Link> for navigation (no page reloads).
// - Uses Tailwind CSS for styling.
//

import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

// List of navigation links (add more here if you want more pages)
const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/editor', label: 'Mind Map Editor' },
];

const Navbar: React.FC = () => {
  // State for mobile menu open/close
  const [menuOpen, setMenuOpen] = useState(false);
  // Get the current URL path
  const location = useLocation();

  // Helper to check if a link is active (for highlighting)
  const isActive = (path: string) =>
    location.pathname === path || (path !== '/' && location.pathname.startsWith(path));

  return (
    // The nav bar is sticky (always at the top)
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm" aria-label="Main navigation">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and app name */}
          <div className="flex-shrink-0 flex items-center">
            <span className="text-2xl font-bold text-blue-600">🧠</span>
            <span className="ml-2 font-semibold text-lg">Synaptia</span>
          </div>
          {/* Desktop navigation links (hidden on mobile) */}
          <div className="hidden md:flex space-x-6">
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-3 py-2 rounded transition font-medium focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                  isActive(link.to)
                    ? 'text-blue-700 font-bold underline underline-offset-4'
                    : 'text-gray-700 hover:text-blue-600'
                }`}
                aria-current={isActive(link.to) ? 'page' : undefined}
              >
                {link.label}
              </Link>
            ))}
          </div>
          {/* Mobile hamburger menu button (shows on small screens) */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMenuOpen(m => !m)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-400"
              aria-controls="mobile-menu"
              aria-expanded={menuOpen}
              aria-label="Open main menu"
              type="button"
            >
              {/* Hamburger icon (changes to X when open) */}
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                {menuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>
      {/* Mobile dropdown menu (shows when hamburger is open) */}
      <div
        className={`md:hidden transition-all duration-200 bg-white border-b border-gray-200 shadow-sm ${
          menuOpen ? 'block' : 'hidden'
        }`}
        id="mobile-menu"
      >
        <div className="px-2 pt-2 pb-3 space-y-1">
          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={`block px-3 py-2 rounded font-medium transition focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                isActive(link.to)
                  ? 'text-blue-700 font-bold underline underline-offset-4'
                  : 'text-gray-700 hover:text-blue-600'
              }`}
              aria-current={isActive(link.to) ? 'page' : undefined}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 