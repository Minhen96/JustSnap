// JustSnap - Ask React flow hook
// Handles two-stage LLM interaction: prompt generation + code JSON generation

import { useEffect, useState } from 'react';
import { askReactGenerateCode, askReactGeneratePrompt } from '../services/ai.service';
import { imageUrlToBase64 } from '../utils/image';
import type { AskReactCodeResult, AskReactPromptResult } from '../types';

export function useAskReact(screenshotUrl: string) {
  const [generatedPrompt, setGeneratedPrompt] = useState<AskReactPromptResult | null>(null);
  const [codeResult, setCodeResult] = useState<AskReactCodeResult | null>(null);
  const [isPromptLoading, setIsPromptLoading] = useState(false);
  const [isCodeLoading, setIsCodeLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset when screenshot changes
  useEffect(() => {
    setGeneratedPrompt(null);
    setCodeResult(null);
    setError(null);
  }, [screenshotUrl]);

  const generatePrompt = async (userPrompt?: string) => {
    setError(null);
    setIsPromptLoading(true);
    setCodeResult(null); // clear previous code when regenerating prompt

    try {
      const base64 = await imageUrlToBase64(screenshotUrl);
      const result = await askReactGeneratePrompt(base64, userPrompt);
      setGeneratedPrompt(result);
      return result;
    } catch (err) {
      console.error('Ask React prompt generation failed:', err);
      const message = err instanceof Error ? err.message : 'Unable to generate prompt. Please try again.';
      setError(message);
      return null;
    } finally {
      setIsPromptLoading(false);
    }
  };

  const generateCode = async (preparedPrompt: string) => {
    setError(null);
    setIsCodeLoading(true);

    try {
      const base64 = await imageUrlToBase64(screenshotUrl);
      const result = await askReactGenerateCode(base64, preparedPrompt);
      setCodeResult(result);
      return result;
    } catch (err) {
      console.error('Ask React code generation failed:', err);
      const message = err instanceof Error ? err.message : 'Unable to generate code. Please try again.';
      setError(message);
      return null;
    } finally {
      setIsCodeLoading(false);
    }
  };

  const reset = () => {
    setGeneratedPrompt(null);
    setCodeResult(null);
    setError(null);
  };

  return {
    generatedPrompt,
    codeResult,
    isPromptLoading,
    isCodeLoading,
    error,
    generatePrompt,
    generateCode,
    reset,
  };
}
