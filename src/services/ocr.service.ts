// JustSnap - OCR Service (Tesseract.js) - SIMPLIFIED VERSION
// Reference: tech_stack.md lines 103-108, use_case.md SC-09

import { createWorker, type Worker } from 'tesseract.js';
import type { OCRResult } from '../types';

// Singleton worker instance
let worker: Worker | null = null;

/**
 * Get or create Tesseract worker
 */
async function getWorker(): Promise<Worker> {
  if (worker) {
    return worker;
  }

  if (import.meta.env.DEV) {
    console.log('[OCR] Creating new worker...');
  }

  worker = await createWorker('eng', 1, {
    logger: import.meta.env.DEV ? (m) => console.log('[OCR]', m.status, m.progress) : undefined
  });

  return worker;
}

/**
 * Terminate the OCR worker and free resources
 * Call this on app cleanup or when OCR is no longer needed
 */
export async function terminateWorker(): Promise<void> {
  if (worker) {
    await worker.terminate();
    worker = null;
    if (import.meta.env.DEV) {
      console.log('[OCR] Worker terminated');
    }
  }
}

/**
 * Reset the worker (terminate and recreate on next use)
 * Useful for error recovery
 */
export async function resetWorker(): Promise<void> {
  await terminateWorker();
  if (import.meta.env.DEV) {
    console.log('[OCR] Worker reset');
  }
}

/**
 * Filter out likely symbols/icons and keep only meaningful text
 */
function filterMeaningfulText(text: string): string {
  if (!text) return '';

  // Split into words
  const words = text.split(/\s+/);

  // Filter rules - remove symbols that OCR misreads from icons
  const meaningfulWords = words.filter(word => {
    const cleaned = word.trim();

    // Skip empty
    if (!cleaned) return false;

    // Remove common symbol patterns that come from icons:
    // v/, •/, */, -/, x/, etc. (tick marks, bullets, checkboxes)
    // Pattern: single character (letter or symbol) followed by /
    const isIconPattern = /^.\/$/i.test(cleaned); // Matches: v/, x/, •/, */, -/, etc.
    if (isIconPattern) {
      return false;
    }

    // Remove single non-alphanumeric characters
    if (cleaned.length === 1 && !/[a-zA-Z0-9]/.test(cleaned)) {
      return false;
    }

    // Remove words that are ONLY symbols/punctuation (no letters/numbers)
    const alphanumCount = (cleaned.match(/[a-zA-Z0-9]/g) || []).length;
    if (alphanumCount === 0) {
      return false;
    }

    return true;
  });

  return meaningfulWords.join(' ');
}

/**
 * Simple OCR - just extract text, no fancy preprocessing
 */
export async function extractText(
  imageData: string,
  onProgress?: (progress: number) => void
): Promise<OCRResult> {
  const w = await getWorker();
  onProgress?.(20);

  const result = await w.recognize(imageData);
  onProgress?.(100);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = result.data;
  const rawText = data.text || '';
  const lines = data.lines || [];
  const paragraphs = data.paragraphs || [];

  let finalText = '';

  // Try to preserve line breaks using paragraphs/lines
  if (lines.length > 0) {
    // If lines exist, process each line separately
    const processedLines = lines
      .map((line: any) => filterMeaningfulText(line.text || ''))
      .filter((line: string) => line.trim().length > 0);
    finalText = processedLines.join('\n');
  } else if (paragraphs.length > 0) {
    // If paragraphs exist, process each paragraph
    const processedParagraphs = paragraphs
      .map((para: any) => filterMeaningfulText(para.text || ''))
      .filter((para: string) => para.trim().length > 0);
    finalText = processedParagraphs.join('\n\n');
  } else {
    // Fallback: use raw text (already has line breaks from Tesseract)
    finalText = filterMeaningfulText(rawText);
  }

  if (import.meta.env.DEV) {
    console.log('[OCR] Extracted text:', finalText.substring(0, 100) + (finalText.length > 100 ? '...' : ''));
    console.log('[OCR] Confidence:', result.data.confidence);
  }

  return {
    text: finalText,
    confidence: (result.data.confidence || 0) / 100,
    language: 'eng',
    blocks: lines
      .map((line: any) => ({
        text: line.text || '',
        bbox: line.bbox,
        confidence: line.confidence / 100,
      }))
      .filter((block: any) => block.text.trim().length > 0),
  };
}
