// JustSnap - Ask UI flow hook (React/Vue/Flutter)
// Handles two-stage LLM interaction: prompt generation + code JSON generation

import { useCallback, useEffect, useState } from 'react';
import { askFrameworkGenerateCode, askFrameworkGeneratePrompt } from '../services/ai.service';
import { imageUrlToBase64 } from '../utils/image';
import type { AskFramework, AskFrameworkCodeResult, AskFrameworkPromptResult } from '../types';

export function useAskReact(screenshotUrl: string, framework: AskFramework) {
  const [generatedPrompt, setGeneratedPrompt] = useState<AskFrameworkPromptResult | null>(null);
  const [codeResult, setCodeResult] = useState<AskFrameworkCodeResult | null>(null);
  const [isPromptLoading, setIsPromptLoading] = useState(false);
  const [isCodeLoading, setIsCodeLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setGeneratedPrompt(null);
    setCodeResult(null);
    setError(null);
  }, []);

  // Reset when screenshot changes
  useEffect(() => {
    reset();
  }, [screenshotUrl, framework, reset]);

  const generatePrompt = async (userPrompt?: string) => {
    setError(null);
    setIsPromptLoading(true);
    setCodeResult(null); // clear previous code when regenerating prompt

    try {
      const base64 = await imageUrlToBase64(screenshotUrl);
      const result = await askFrameworkGeneratePrompt(base64, framework, userPrompt);
      setGeneratedPrompt(result);
      return result;
    } catch (err) {
      console.error('Ask UI prompt generation failed:', err);
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
      const result = await askFrameworkGenerateCode(base64, framework, preparedPrompt);
      setCodeResult(result);
      return result;
    } catch (err) {
      console.error('Ask UI code generation failed:', err);
      const message = err instanceof Error ? err.message : 'Unable to generate code. Please try again.';
      setError(message);
      return null;
    } finally {
      setIsCodeLoading(false);
    }
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
