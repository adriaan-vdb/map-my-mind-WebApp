import { Router } from 'express';
import { z } from 'zod';
import { getMindMapFromText } from './services/llm.service';

const router = Router();

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

router.post('/', async (req, res) => {
  const { text } = req.body;
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid text' });
  }
  try {
    const result = await getMindMapFromText(text);
    const parsed = MindMapResponseSchema.safeParse(result);
    if (!parsed.success) {
      return res.status(500).json({ error: 'Invalid response from LLM', details: parsed.error });
    }
    res.json(parsed.data);
  } catch (err) {
    res.status(500).json({ error: 'LLM error', details: err instanceof Error ? err.message : err });
  }
});

export default router; 