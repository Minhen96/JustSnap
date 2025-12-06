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
    console.log('[OCR] Using existing worker');
    return worker;
  }

  console.log('[OCR] Creating new worker...');
  worker = await createWorker('eng', 1, {
    logger: (m) => console.log('[OCR]', m.status, m.progress)
  });
  console.log('[OCR] Worker ready!');
  return worker;
}

/**
 * Filter out likely symbols/icons and keep only meaningful text
 */
function filterMeaningfulText(text: string): string {
  if (!text) return '';

  // Split into words
  const words = text.split(/\s+/);

  console.log('[OCR Filter] Input words:', words);

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
      console.log('[OCR Filter] Removing icon pattern:', cleaned);
      return false;
    }

    // Remove single non-alphanumeric characters
    if (cleaned.length === 1 && !/[a-zA-Z0-9]/.test(cleaned)) {
      console.log('[OCR Filter] Removing single symbol:', cleaned);
      return false;
    }

    // Remove words that are ONLY symbols/punctuation (no letters/numbers)
    const alphanumCount = (cleaned.match(/[a-zA-Z0-9]/g) || []).length;
    if (alphanumCount === 0) {
      console.log('[OCR Filter] Removing pure symbols:', cleaned);
      return false;
    }

    console.log('[OCR Filter] Keeping:', cleaned);
    return true;
  });

  console.log('[OCR Filter] Output words:', meaningfulWords);
  return meaningfulWords.join(' ');
}

/**
 * Simple OCR - just extract text, no fancy preprocessing
 */
export async function extractText(
  imageData: string,
  onProgress?: (progress: number) => void
): Promise<OCRResult> {
  console.log('[OCR] Starting...');

  const w = await getWorker();
  onProgress?.(20);

  console.log('[OCR] Recognizing text...');
  const result = await w.recognize(imageData);
  onProgress?.(100);

  const rawText = result.data.text || '';
  const lines = result.data.lines || [];
  const paragraphs = result.data.paragraphs || [];

  console.log('[OCR] Raw text:', rawText);
  console.log('[OCR] Lines array length:', lines.length);
  console.log('[OCR] Paragraphs array length:', paragraphs.length);

  let finalText = '';

  // Try to preserve line breaks using paragraphs/lines
  if (lines.length > 0) {
    // If lines exist, process each line separately
    const processedLines = lines
      .map(line => filterMeaningfulText(line.text || ''))
      .filter(line => line.trim().length > 0);
    finalText = processedLines.join('\n');
    console.log('[OCR] Used lines structure, found', processedLines.length, 'lines');
  } else if (paragraphs.length > 0) {
    // If paragraphs exist, process each paragraph
    const processedParagraphs = paragraphs
      .map(para => filterMeaningfulText(para.text || ''))
      .filter(para => para.trim().length > 0);
    finalText = processedParagraphs.join('\n\n');
    console.log('[OCR] Used paragraphs structure, found', processedParagraphs.length, 'paragraphs');
  } else {
    // Fallback: use raw text (already has line breaks from Tesseract)
    finalText = filterMeaningfulText(rawText);
    console.log('[OCR] Used raw text (line breaks preserved from Tesseract)');
  }

  console.log('[OCR] Final text:', finalText);
  console.log('[OCR] Confidence:', result.data.confidence);

  return {
    text: finalText,
    confidence: (result.data.confidence || 0) / 100,
    language: 'eng',
    blocks: lines
      .map((line) => ({
        text: line.text || '',
        bbox: line.bbox,
        confidence: line.confidence / 100,
      }))
      .filter((block) => block.text.trim().length > 0),
  };
}
