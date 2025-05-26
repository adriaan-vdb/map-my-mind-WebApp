//
// llm.service.ts
//
// This file handles all communication with the OpenAI API (GPT-4o).
// - Builds prompts for the LLM (AI)
// - Sends requests and parses responses
// - Exposes functions for the API routes to use
//
// Learnings for beginners:
//   - How to call an external API from Node.js
//   - How to build prompts for an LLM
//   - How to parse and validate JSON responses
//   - How to organize backend logic into services
//

import { buildPrompt, buildSuggestChildrenPrompt, buildInsightPrompt, buildSemanticClusteringPrompt } from '../utils/prompt';
import OpenAI from 'openai';

// Create an OpenAI client using your API key from the environment
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// --- Generate a mind map from user text ---
export async function getMindMapFromText(text: string, detailLevel: number = 3) {
  const prompt = buildPrompt(text, detailLevel); // Build the prompt for the LLM
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: 'You are an assistant that transforms user notes into a coherent mind map.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.2,
    max_tokens: 1024,
  });
  const content = response.choices[0].message?.content || '';
  // Try to extract JSON from code block if present
  const match = content.match(/```(?:json)?\n?([\s\S]*?)```/);
  const json = match ? match[1] : content;
  return JSON.parse(json);
}

// --- Suggest children (subtopics) for a node ---
export async function suggestChildren(label: string, detailLevel: number = 3) {
  const prompt = buildSuggestChildrenPrompt(label, detailLevel);
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: 'You are an assistant that suggests subtopics for mind map nodes.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.4,
    max_tokens: 512,
  });
  const content = response.choices[0].message?.content || '';
  // Try to extract JSON from code block if present
  const match = content.match(/```(?:json)?\n?([\s\S]*?)```/);
  const json = match ? match[1] : content;
  return JSON.parse(json);
}

// --- Get AI-generated insight for a mind map ---
export async function getMapInsight(nodes: any[], edges: any[], summaries?: any[], detailLevel: number = 3) {
  const prompt = buildInsightPrompt(nodes, edges, summaries, detailLevel);
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: 'You are an expert mind map analyst.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.3,
    max_tokens: 512,
  });
  const content = response.choices[0].message?.content || '';
  // Try to extract JSON from code block if present
  const match = content.match(/```(?:json)?\n?([\s\S]*?)```/);
  const json = match ? match[1] : content;
  return JSON.parse(json);
}

// --- Get AI-generated semantic clusters for a mind map ---
export async function getSemanticClusters(nodes: any[], edges: any[], detailLevel: number = 3) {
  const prompt = buildSemanticClusteringPrompt(nodes, edges, detailLevel);
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: 'You are an expert in concept mapping and clustering.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.3,
    max_tokens: 512,
  });
  const content = response.choices[0].message?.content || '';
  // Try to extract JSON from code block if present
  const match = content.match(/```(?:json)?\n?([\s\S]*?)```/);
  const json = match ? match[1] : content;
  return JSON.parse(json);
} 