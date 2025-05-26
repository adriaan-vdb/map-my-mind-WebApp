# Learning Roadmap & Implementation Tutorial

## Tutorial for future Self

---

## 1. **Project Overview**
- **What is Synaptia?**
  - An AI-powered web app that turns your notes into interactive mind maps.
  - Built with React (frontend), Node.js/Express (backend), OpenAI (AI), and Tailwind CSS (styling).
- **How does it work?**
  - You enter free-form text, the backend sends it to OpenAI, and the frontend visualizes the result as a mind map.

---

## 2. **Setting Up Your Environment**
- **Install Node.js** (v20+ recommended)
- **Install pnpm** (or npm/yarn)
- **Clone the repo and install dependencies:**
  ```bash
  git clone <repo-url>
  cd map-my-mind-WebApp
  pnpm install
  cp .env.template .env # Add your OpenAI API key
  ```
- **Run the app:**
  ```bash
  pnpm dev
  # Client: http://localhost:5173
  # Server: http://localhost:4000
  ```

---

## 3. **Frontend: React + TypeScript**

### a. **Entry Point & App Structure**
- **Files:** `src/index.html`, `src/main.tsx`, `src/App.tsx`
- **Learn:**
  - How React apps start from `index.html` and `main.tsx`.
  - How routing works with React Router in `App.tsx`.
  - How the Navbar and different pages (Dashboard, Editor) are composed.

### b. **Styling with Tailwind CSS**
- **File:** `src/styles/tailwind.css`
- **Learn:**
  - How utility-first CSS works.
  - How to use classes like `bg-blue-500`, `flex`, `p-4` in your components.

### c. **State Management with Zustand**
- **File:** `src/hooks/useMindMapStore.ts`
- **Learn:**
  - How to create a global store for nodes, edges, and UI state.
  - How to persist data in `localStorage`.
  - How to update state from any component.

### d. **Building Components**
- **Files:**
  - `src/components/Navbar.tsx` (navigation bar)
  - `src/components/dashboard/Dashboard.tsx` (list, rename, delete maps)
  - `src/components/editor/MindMap.tsx` (main mind map editor)
  - `src/components/editor/NodeMenu.tsx` (context menu for nodes)
  - `src/components/editor/TestEdgeHandles.tsx` (Cytoscape demo)
- **Learn:**
  - How to build interactive UIs with React components and props.
  - How to use hooks (`useState`, `useEffect`, `useRef`).
  - How to handle events (click, change, submit).
  - How to use Cytoscape.js for graph visualization.
  - How to connect UI actions to global state.

### e. **TypeScript & Type Declarations**
- **Files:** `src/types/*.d.ts`, `src/vite-env.d.ts`
- **Learn:**
  - Why type declarations are needed for some libraries/plugins.
  - How TypeScript helps catch errors and document your data structures.

---

## 4. **Backend: Node.js + Express + OpenAI**

### a. **Server Setup**
- **File:** `server/src/index.ts`
- **Learn:**
  - How to set up an Express server.
  - How to use middleware for CORS and JSON parsing.
  - How to connect routers for API endpoints.

### b. **API Routing & Validation**
- **File:** `server/src/routes.ts`
- **Learn:**
  - How to define RESTful API endpoints.
  - How to validate input with Zod.
  - How to handle errors and send responses.

### c. **Connecting to OpenAI**
- **File:** `server/src/services/llm.service.ts`
- **Learn:**
  - How to call the OpenAI API from Node.js.
  - How to build prompts and parse responses.
  - How to organize backend logic into services.

### d. **Prompt Engineering**
- **File:** `server/src/utils/prompt.ts`, `server/src/prompts/base.txt`
- **Learn:**
  - How to build prompt templates for the LLM.
  - How to control the detail level and response format.
  - How the system prompt guides the AI's behavior.

---

## 5. **How It All Fits Together**
- The **frontend** collects user input, displays the mind map, and lets users interact with it.
- The **backend** receives requests, builds prompts, calls OpenAI, and returns structured data.
- **State management** keeps everything in sync and persistent.
- **Styling** and **type safety** make the app robust and beautiful.

---

## 6. **Next Steps & Resources**
- **Experiment:** Try editing components, adding features, or changing the prompt.
- **Learn More:**
  - [React Docs](https://react.dev/)
  - [TypeScript Handbook](https://www.typescriptlang.org/docs/)
  - [Zustand Docs](https://docs.pmnd.rs/zustand/getting-started/introduction)
  - [Express Docs](https://expressjs.com/)
  - [OpenAI API Docs](https://platform.openai.com/docs/api-reference)
  - [Tailwind CSS Docs](https://tailwindcss.com/docs/installation)
- **Ask for Help:** Don't hesitate to reach out or search for tutorials on any topic above!

