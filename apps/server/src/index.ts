//
// index.ts
//
// This is the main entry point for the backend server.
// - Uses Express (a popular Node.js web framework)
// - Sets up middleware for CORS and JSON parsing
// - Connects the API routes for mind maps
//
// Learnings for beginners:
//   - How to set up an Express server
//   - How to use middleware (cors, express.json)
//   - How to connect routers for different API endpoints
//

import 'dotenv/config'; // Loads environment variables from .env
import express from 'express'; // Import Express
import cors from 'cors'; // Import CORS middleware
import mapsRouter from './routes'; // Import the mind map API routes

const app = express();
app.use(cors()); // Allow requests from any origin (for development)
app.use(express.json()); // Parse incoming JSON requests

// All routes starting with /api/maps go to mapsRouter
app.use('/api/maps', mapsRouter);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
}); 