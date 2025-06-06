//
// routes.ts
//
// This file defines the API endpoints for the mind map app.
// - Uses Express Router to organize endpoints
// - Uses Zod for input validation
// - Calls LLM (AI) service functions to process requests
//
// Learnings for beginners:
//   - How to define API endpoints in Express
//   - How to validate input
//   - How to handle async/await and errors
//   - How to structure RESTful APIs
//

import { Router } from 'express';
import { z } from 'zod';
import { getMindMapFromText, suggestChildren, getMapInsight, getSemanticClusters } from './services/llm.service';

const router = Router();

// --- Zod schema for validating the mind map response ---
const MindMapResponseSchema = z.object({
  nodes: z.array(z.object({
    id: z.string(),
    label: z.string(),
    summary: z.string().optional(),
  })),
  edges: z.array(z.object({
    source: z.string(),
    target: z.string(),
  })),
});

// --- POST /api/maps ---
// Generate a mind map from user text
router.post('/', async (req, res) => {
  const { text, detailLevel } = req.body;
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid text' });
  }
  try {
    const result = await getMindMapFromText(text, detailLevel ?? 3);
    const parsed = MindMapResponseSchema.safeParse(result);
    if (!parsed.success) {
      return res.status(500).json({ error: 'Invalid response from LLM', details: parsed.error });
    }
    res.json(parsed.data);
  } catch (err) {
    res.status(500).json({ error: 'LLM error', details: err instanceof Error ? err.message : err });
  }
});

// --- POST /api/maps/suggest-children ---
// Get AI suggestions for children of a node
router.post('/suggest-children', async (req, res) => {
  const { text, parentId, detailLevel } = req.body;
  if (!text || typeof text !== 'string' || !parentId || typeof parentId !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid text/parentId' });
  }
  try {
    const suggestions = await suggestChildren(text, detailLevel ?? 3);
    // suggestions: [{ label: string }]
    res.json({ suggestions });
  } catch (err) {
    res.status(500).json({ error: 'LLM error', details: err instanceof Error ? err.message : err });
  }
});

// --- POST /api/maps/insight ---
// Get AI-generated insight for a mind map
router.post('/insight', async (req, res) => {
  const { nodes, edges, summaries, detailLevel } = req.body;
  if (!Array.isArray(nodes) || !Array.isArray(edges)) {
    return res.status(400).json({ error: 'Missing or invalid nodes/edges' });
  }
  try {
    const insight = await getMapInsight(nodes, edges, summaries, detailLevel ?? 3);
    res.json({ insight });
  } catch (err) {
    res.status(500).json({ error: 'LLM error', details: err instanceof Error ? err.message : err });
  }
});

// --- POST /api/maps/semantic-clusters ---
// Get AI-generated semantic clusters for a mind map
router.post('/semantic-clusters', async (req, res) => {
  const { nodes, edges, detailLevel } = req.body;
  if (!Array.isArray(nodes) || !Array.isArray(edges)) {
    return res.status(400).json({ error: 'Missing or invalid nodes/edges' });
  }
  try {
    const clusters = await getSemanticClusters(nodes, edges, detailLevel ?? 3);
    res.json({ clusters });
  } catch (err) {
    res.status(500).json({ error: 'LLM error', details: err instanceof Error ? err.message : err });
  }
});

export default router; 