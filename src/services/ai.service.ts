// JustSnap - AI Service (OpenAI Integration)
// Reference: tech_stack.md lines 92-109

import type {
  AISummary,
  AICodeGeneration,
  TranslationResult,
  AskReactCodeResult,
  AskReactPromptResult,
} from '../types/index';
import { buildAskReactAnalysisPrompt, buildAskReactCodePrompt } from '../utils/prompts/askReactPrompt';

// TODO: Add OpenAI API key configuration
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';
// Google Generative AI (Gemini) - hardcoded per request
const GOOGLE_GENAI_KEY = 'AIzaSyBy8lpxnaeBKfqQ3XhUB1JsYbHxrMX86As';
const GEMINI_MODEL = 'gemini-2.0-flash';
// OpenAI-compatible endpoint for Gemini (v1beta)
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/openai';

interface OpenAIChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string | Array<{ type: string; text?: string }>;
    };
  }>;
  error?: { message?: string };
}

const buildImageDataUrl = (imageBase64: string) => `data:image/png;base64,${imageBase64}`;

async function callGeminiChat(messages: unknown[]): Promise<string> {
  const url = `${GEMINI_BASE_URL}/chat/completions`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GOOGLE_GENAI_KEY}`,
    },
    body: JSON.stringify({
      model: GEMINI_MODEL,
      messages,
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Gemini request failed: ${res.status} ${res.statusText} - ${detail}`);
  }

  const json = (await res.json()) as OpenAIChatCompletionResponse;

  if (json?.error?.message) {
    throw new Error(`Gemini error: ${json.error.message}`);
  }

  const firstChoice = json?.choices?.[0];
  if (!firstChoice?.message) {
    throw new Error('Gemini response missing message content');
  }

  const content = firstChoice.message.content;

  if (typeof content === 'string') {
    return content.trim();
  }

  if (Array.isArray(content)) {
    const text = content
      .map((c) => (c.type === 'text' ? c.text : ''))
      .filter(Boolean)
      .join('\n')
      .trim();
    if (text) return text;
  }

  throw new Error('Gemini response did not include text output');
}

function safeParseJson<T>(raw: string): T {
  // Strip common markdown fences if present
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```$/i, '')
    .trim();

  try {
    return JSON.parse(cleaned) as T;
  } catch (err) {
    throw new Error('Failed to parse JSON from Gemini response');
  }
}

/**
 * AI Chat - Ask questions about screenshot
 */
export async function chatWithScreenshot(
  imageBase64: string,
  userMessage: string
): Promise<string> {
  // TODO: Implement OpenAI GPT-4 Vision API call
  console.log('Chat with screenshot:', userMessage);
  return 'AI response placeholder';
}

/**
 * AI Summarize - Generate summary of screenshot
 */
export async function summarizeScreenshot(imageBase64: string): Promise<AISummary> {
  // TODO: Implement OpenAI GPT-4 Vision API call
  console.log('Summarizing screenshot');
  return {
    summary: 'This is a placeholder summary',
    keyPoints: ['Point 1', 'Point 2', 'Point 3'],
    timestamp: Date.now(),
  };
}

/**
 * AI Translate - Translate text
 */
export async function translateText(
  text: string,
  targetLang: 'en' | 'zh' | 'ms'
): Promise<TranslationResult> {
  // TODO: Implement OpenAI translation API call
  console.log('Translating text to:', targetLang);
  return {
    translatedText: 'Translated text placeholder',
    sourceLang: 'auto',
    targetLang,
  };
}

/**
 * AI Code Generation - Generate UI code from screenshot (Signature Feature)
 */
export async function generateCodeFromScreenshot(
  imageBase64: string,
  framework: 'react' | 'vue' | 'flutter' | 'html' | 'nextjs'
): Promise<AICodeGeneration> {
  // TODO: Implement OpenAI GPT-4 Vision API call with code generation prompt
  console.log('Generating code for framework:', framework);

  return {
    framework,
    code: `// Generated ${framework} code\n// Placeholder`,
    styles: '/* Styles */',
    dependencies: [],
    fileName: `Component.${framework === 'flutter' ? 'dart' : 'tsx'}`,
  };
}

/**
 * AI Explain - Step-by-step explanation
 */
export async function explainScreenshot(imageBase64: string): Promise<string> {
  // TODO: Implement OpenAI GPT-4 Vision API call
  console.log('Explaining screenshot');
  return 'Step-by-step explanation placeholder';
}

/**
 * Ask React (Stage 1) - Generate a descriptive prompt from screenshot
 */
export async function askReactGeneratePrompt(
  imageBase64: string,
  userPrompt?: string
): Promise<AskReactPromptResult> {
  const prompt = buildAskReactAnalysisPrompt(userPrompt);
  const text = await callGeminiChat([
    {
      role: 'user',
      content: [
        { type: 'text', text: prompt },
        { type: 'image_url', image_url: { url: buildImageDataUrl(imageBase64) } },
      ],
    },
  ]);

  return {
    prompt: text,
    reasoning: undefined,
  };
}

/**
 * Ask React (Stage 2) - Generate React component JSON from screenshot + prompt
 */
export async function askReactGenerateCode(
  imageBase64: string,
  preparedPrompt: string
): Promise<AskReactCodeResult> {
  const systemPrompt = buildAskReactCodePrompt();
  const combinedPrompt = `${systemPrompt}\n\nPrepared prompt:\n${preparedPrompt}`;

  const text = await callGeminiChat([
    {
      role: 'user',
      content: [
        { type: 'text', text: combinedPrompt },
        { type: 'image_url', image_url: { url: buildImageDataUrl(imageBase64) } },
      ],
    },
  ]);

  const parsed = safeParseJson<AskReactCodeResult>(text);

  return {
    name: parsed.name || 'AskReactComponent',
    description: parsed.description || 'Generated React component',
    code: parsed.code,
    props: parsed.props,
    styles: parsed.styles,
  };
}
