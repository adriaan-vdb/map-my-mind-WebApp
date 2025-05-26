//
// prompt.ts
//
// This file builds the prompts sent to the LLM (AI) for different tasks.
// - Reads the base system prompt from a file
// - Adds user notes, detail instructions, and response format
// - Exports functions to build prompts for map generation, suggestions, insights, and clustering
//
// Learnings for beginners:
//   - How to build prompt templates for LLMs
//   - How to use string interpolation and JSON.stringify
//   - How to read files in Node.js
//   - How to structure prompt engineering code
//

import fs from 'fs';
import path from 'path';

// Read the base system prompt from a text file
const basePromptPath = path.resolve(__dirname, '../prompts/base.txt');
const base = fs.readFileSync(basePromptPath, 'utf8');

// Helper: get a detail instruction string based on the level (1-5)
function getDetailInstruction(detailLevel: number = 3): string {
  switch (detailLevel) {
    case 1:
      return 'Be extremely brief. Use one-word or short-phrase labels.';
    case 2:
      return 'Be brief. Use short phrases or words per label.';
    case 3:
      return 'Give a brief sentence for each node or concept.';
    case 4:
      return 'Provide a full sentence for each node or concept.';
    case 5:
      return 'Be highly detailed and reflective. Give in-depth insight, multiple examples, related subtopics, and optional philosophical or abstract reasoning.';
    default:
      return '';
  }
}

// --- Build the main prompt for generating a mind map ---
export function buildPrompt(userText: string, detailLevel: number = 3) {
  const formatBlock = `
interface MindMapResponse {
  nodes: { id: string; label: string; summary?: string }[];
  edges: { source: string; target: string }[];
}
`;
  const detailInstruction = getDetailInstruction(detailLevel);
  return `${base}\n\nUSER_NOTES:\n${userText}\n\nDETAIL_INSTRUCTION:\n${detailInstruction}\n\nRESPONSE_FORMAT:\n${formatBlock}`;
}

// --- Build a prompt for suggesting children (subtopics) for a node ---
export function buildSuggestChildrenPrompt(label: string, detailLevel: number = 3) {
  const detailInstruction = getDetailInstruction(detailLevel);
  return `Suggest 5-8 subtopics or branches that could be children of the following mind map node.\n\nNODE_LABEL: ${label}\n\nDETAIL_INSTRUCTION:\n${detailInstruction}\n\nRESPONSE_FORMAT:\n[\n  {\n    \"label\": \"string\"\n  }, ...\n]`;
}

// --- Build a prompt for generating insight for a mind map ---
export function buildInsightPrompt(nodes: any[], edges: any[], summaries?: any[], detailLevel: number = 3) {
  const detailInstruction = getDetailInstruction(detailLevel);
  return `You are an expert mind map analyst. Given the following mind map structure, provide:\n1. A high-level insight about how the user's thoughts are organized\n2. A potential blind spot or area to explore deeper\n3. A summary of key clusters or patterns in the map\n\nNODES:\n${JSON.stringify(nodes, null, 2)}\nEDGES:\n${JSON.stringify(edges, null, 2)}\n${summaries ? `SUMMARIES:\n${JSON.stringify(summaries, null, 2)}` : ''}\n\nDETAIL_INSTRUCTION:\n${detailInstruction}\n\nRESPONSE_FORMAT:\n{\n  "insight": "string",\n  "blindSpot": "string",\n  "clusters": "string"\n}`;
}

// --- Build a prompt for semantic clustering of nodes ---
export function buildSemanticClusteringPrompt(nodes: any[], edges: any[], detailLevel: number = 3) {
  const detailInstruction = getDetailInstruction(detailLevel);
  return `You are an expert in concept mapping and clustering. Given the following mind map structure, group the nodes into clusters based on conceptual similarity. For each cluster, provide a short descriptive name and a list of node IDs that belong to it. Do not create overlapping clusters. If a node does not fit any cluster, put it in a cluster called 'Other'.

NODES:
${JSON.stringify(nodes, null, 2)}
EDGES:
${JSON.stringify(edges, null, 2)}

DETAIL_INSTRUCTION:
${detailInstruction}

RESPONSE_FORMAT:
[
  {
    "name": "string (cluster name)",
    "nodeIds": ["string", ...]
  }, ...
]`;
} 