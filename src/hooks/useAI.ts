// JustSnap - AI Features Hook

import { useState } from 'react';
import * as aiService from '../services/ai.service';
import * as ocrService from '../services/ocr.service';
import type { AISummary, OCRResult, AICodeGeneration } from '../types';

export function useAI() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [summary, setSummary] = useState<AISummary | null>(null);
  const [codeGeneration, setCodeGeneration] = useState<AICodeGeneration | null>(null);

  const performOCR = async (imageData: string) => {
    setIsProcessing(true);
    try {
      const result = await ocrService.extractText(imageData);
      setOcrResult(result);
      return result;
    } catch (error) {
      console.error('OCR failed:', error);
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  const generateSummary = async (imageData: string) => {
    setIsProcessing(true);
    try {
      const result = await aiService.summarizeScreenshot(imageData);
      setSummary(result);
      return result;
    } catch (error) {
      console.error('Summary generation failed:', error);
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  const generateCode = async (
    imageData: string,
    framework: 'react' | 'vue' | 'flutter' | 'html' | 'nextjs'
  ) => {
    setIsProcessing(true);
    try {
      const result = await aiService.generateCodeFromScreenshot(imageData, framework);
      setCodeGeneration(result);
      return result;
    } catch (error) {
      console.error('Code generation failed:', error);
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  const translateText = async (text: string, targetLang: 'en' | 'zh' | 'ms') => {
    setIsProcessing(true);
    try {
      const result = await aiService.translateText(text, targetLang);
      return result;
    } catch (error) {
      console.error('Translation failed:', error);
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    isProcessing,
    ocrResult,
    summary,
    codeGeneration,
    performOCR,
    generateSummary,
    generateCode,
    translateText,
  };
}
