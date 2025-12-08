// JustSnap - AI Service (OpenAI Integration)
// Reference: tech_stack.md lines 92-109

import type {
  AISummary,
  AICodeGeneration,
  TranslationResult,
  AskFramework,
  AskFrameworkCodeResult,
  AskFrameworkPromptResult,
  AskReactCodeResult,
  AskReactPromptResult,
  OpenAIMessage,
} from '../types/index';
import {
  buildAskFrameworkAnalysisPrompt,
  buildAskFrameworkCodePrompt,
} from '../utils/prompts/askReactPrompt';

// OpenAI API Key from environment variable
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';
const OPENAI_MODEL = 'gpt-4o'; // Multi-modal model
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

const buildImageDataUrl = (imageBase64: string) =>
  imageBase64.startsWith('data:') ? imageBase64 : `data:image/png;base64,${imageBase64}`;

/**
 * Generic helper to call AI with image and text prompt
 * Reduces boilerplate for multimodal requests
 */
async function callAiWithImage<T = string>(
  imageBase64: string,
  promptText: string,
  parseResponse?: (raw: string) => T
): Promise<T> {
  const messages: OpenAIMessage[] = [
    {
      role: 'user',
      content: [
        { type: 'text', text: promptText },
        { type: 'image_url', image_url: { url: buildImageDataUrl(imageBase64) } },
      ],
    },
  ];

  const rawResponse = await callAiChat(messages);

  if (parseResponse) {
    return parseResponse(rawResponse);
  }

  return rawResponse as T;
}

/**
 * Call OpenAI API for chat completion
 */
export async function callAiChat(messages: OpenAIMessage[]): Promise<string> {
  // Ensure messages are in OpenAI format
  // The calling code already constructs OpenAI-compatible message arrays with text and image_url

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: messages,
        max_tokens: 4000
      })
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('[AI] OpenAI Error:', response.status, text);
      throw new Error(`OpenAI API Error: ${response.status} ${text}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('OpenAI returned empty response');
    }

    return content;
  } catch (error) {
    console.error('[AI] Call Failed:', error);
    throw error;
  }
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
    if (import.meta.env.DEV) {
      console.warn('[AI] JSON Parse failed on:', cleaned);
    }
    throw new Error('Failed to parse JSON from AI response');
  }
}

/**
 * AI Chat - Ask questions about screenshot
 */
export async function chatWithScreenshot(
  imageBase64: string,
  userMessage: string
): Promise<string> {
  return callAiWithImage(imageBase64, userMessage);
}

/**
 * Ask (Stage 1) - Generate a descriptive prompt from screenshot for the chosen framework
 */
export async function askFrameworkGeneratePrompt(
  imageBase64: string,
  framework: AskFramework,
  userPrompt?: string
): Promise<AskFrameworkPromptResult> {
  const prompt = buildAskFrameworkAnalysisPrompt(framework, userPrompt);
  const text = await callAiWithImage(imageBase64, prompt);

  return {
    framework,
    prompt: text,
    reasoning: undefined,
  };
}

/**
 * Ask (Stage 2) - Generate component/widget JSON from screenshot + prompt for the chosen framework
 */
export async function askFrameworkGenerateCode(
  imageBase64: string,
  framework: AskFramework,
  preparedPrompt: string
): Promise<AskFrameworkCodeResult> {
  const systemPrompt = buildAskFrameworkCodePrompt(framework);
  const combinedPrompt = `${systemPrompt}\n\nImage analysis:\n${preparedPrompt}`;

  // Use the generic helper with custom parsing
  const result = await callAiWithImage(
    imageBase64,
    combinedPrompt,
    (raw) => {
      const parsed = safeParseJson<AskFrameworkCodeResult>(raw);

      // Default values per framework
      const defaultName: Record<AskFramework, string> = {
        react: 'AskReactComponent',
        vue: 'AskVueComponent',
        flutter: 'AskFlutterWidget',
      };
      const defaultDescription: Record<AskFramework, string> = {
        react: 'Generated React component',
        vue: 'Generated Vue component',
        flutter: 'Generated Flutter widget',
      };

      return {
        framework,
        name: parsed.name || defaultName[framework],
        description: parsed.description || defaultDescription[framework],
        code: parsed.code,
        props: parsed.props,
        styles: parsed.styles,
      };
    }
  );

  return result;
}

// Backwards compatibility for existing Ask React callers
export const askReactGeneratePrompt = (
  imageBase64: string,
  userPrompt?: string
): Promise<AskReactPromptResult> => askFrameworkGeneratePrompt(imageBase64, 'react', userPrompt);

export const askReactGenerateCode = (
  imageBase64: string,
  preparedPrompt: string
): Promise<AskReactCodeResult> =>
  askFrameworkGenerateCode(imageBase64, 'react', preparedPrompt);
