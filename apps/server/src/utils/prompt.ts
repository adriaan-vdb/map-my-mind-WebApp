import fs from 'fs';
import path from 'path';

const basePromptPath = path.resolve(__dirname, '../prompts/base.txt');
const base = fs.readFileSync(basePromptPath, 'utf8');

export function buildPrompt(userText: string) {
  const formatBlock = `
interface MindMapResponse {
  nodes: { id: string; label: string; summary?: string }[];
  edges: { source: string; target: string }[];
}
`;
  return `${base}\n\nUSER_NOTES:\n${userText}\n\nRESPONSE_FORMAT:\n${formatBlock}`;
}

export function buildSuggestChildrenPrompt(label: string) {
  return `Suggest 5-8 subtopics or branches that could be children of the following mind map node.\n\nNODE_LABEL: ${label}\n\nRESPONSE_FORMAT:\n[\n  {\n    \"label\": \"string\"\n  }, ...\n]`;
}

export function buildInsightPrompt(nodes: any[], edges: any[], summaries?: any[]) {
  return `You are an expert mind map analyst. Given the following mind map structure, provide:\n1. A high-level insight about how the user's thoughts are organized\n2. A potential blind spot or area to explore deeper\n3. A summary of key clusters or patterns in the map\n\nNODES:\n${JSON.stringify(nodes, null, 2)}\nEDGES:\n${JSON.stringify(edges, null, 2)}\n${summaries ? `SUMMARIES:\n${JSON.stringify(summaries, null, 2)}` : ''}\n\nRESPONSE_FORMAT:\n{\n  "insight": "string",\n  "blindSpot": "string",\n  "clusters": "string"\n}`;
} 