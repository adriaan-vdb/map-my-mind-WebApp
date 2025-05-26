//
// This is the main entry point for the React app (after index.html loads).
//
// - React is a library for building user interfaces.
// - ReactDOM is used to render React components into the real browser DOM.
// - BrowserRouter enables client-side routing (switching pages without reloading).
// - App is your main component (see App.tsx).
// - Tailwind CSS is imported for styling.
//

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles/tailwind.css';

// This is where the React app is attached to the HTML (see index.html <div id="root"></div>)
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/*
      BrowserRouter lets you use <Route> and <Link> in your app.
      It keeps the UI in sync with the URL (so you can have multiple pages).
    */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
); 