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