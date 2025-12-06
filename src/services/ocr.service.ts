// JustSnap - OCR Service (Tesseract.js)
// Reference: tech_stack.md lines 103-108, use_case.md SC-09

import { createWorker, type Worker } from 'tesseract.js';
import type { OCRResult, TextBlock } from '../types';

// Singleton worker instance
let worker: Worker | null = null;
let isInitializing = false;

/**
 * Initialize Tesseract.js worker (lazy loaded or pre-warmed)
 */
async function getWorker(): Promise<Worker> {
  if (worker) {
    return worker;
  }

  // If already initializing, wait for it
  if (isInitializing) {
    console.log('[OCR] Worker already initializing, waiting...');
    // Poll until worker is ready
    while (!worker && isInitializing) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    if (worker) return worker;
  }

  isInitializing = true;
  console.log('[OCR] Initializing Tesseract.js worker...');
  console.time('[OCR] Worker initialization');

  try {
    worker = await createWorker({
      logger: (m) => {
        // Only log important messages to reduce noise
        if (m.status === 'loading tesseract core' ||
            m.status === 'initializing tesseract' ||
            m.status === 'loading language traineddata' ||
            m.status === 'initializing api') {
          console.log(`[OCR] ${m.status}... ${Math.round((m.progress || 0) * 100)}%`);
        }
      },
    });

    console.log('[OCR] Loading English language data...');
    await worker.loadLanguage('eng');

    console.log('[OCR] Initializing English...');
    await worker.initialize('eng');

    console.timeEnd('[OCR] Worker initialization');
    console.log('[OCR] ✅ Worker ready!');
    isInitializing = false;
    return worker;
  } catch (error) {
    console.error('[OCR] ❌ Failed to initialize worker:', error);
    worker = null;
    isInitializing = false;
    throw error;
  }
}

/**
 * Warm up OCR worker in background (call on app start)
 * This downloads language files ahead of time
 */
export function warmupOCR(): void {
  console.log('[OCR] Starting warmup...');
  getWorker().catch(err => {
    console.warn('[OCR] Warmup failed (will retry on first use):', err);
  });
}

/**
 * Preprocess image for better OCR accuracy
 * Converts to canvas, applies filters, returns data URL
 */
async function preprocessImage(
  imageData: string,
  mode: 'default' | 'high_contrast' | 'denoise' = 'default'
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      // Set canvas size (only upscale if very small)
      const minWidth = 600;
      const scale = img.width < minWidth ? minWidth / img.width : 1;
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;

      // Draw image
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Apply preprocessing based on mode
      if (mode === 'high_contrast') {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Convert to grayscale and increase contrast
        for (let i = 0; i < data.length; i += 4) {
          const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          // Increase contrast via threshold
          const contrast = gray > 128 ? 255 : 0;
          data[i] = data[i + 1] = data[i + 2] = contrast;
        }

        ctx.putImageData(imageData, 0, 0);
      } else if (mode === 'denoise') {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Simple grayscale conversion
        for (let i = 0; i < data.length; i += 4) {
          const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          data[i] = data[i + 1] = data[i + 2] = gray;
        }

        ctx.putImageData(imageData, 0, 0);
      }

      resolve(canvas.toDataURL('image/png'));
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageData;
  });
}

/**
 * Calculate average confidence from OCR result
 */
function calculateConfidence(result: Awaited<ReturnType<Worker['recognize']>>): number {
  if (!result.data.words || result.data.words.length === 0) {
    return 0;
  }

  const totalConfidence = result.data.words.reduce(
    (sum, word) => sum + word.confidence,
    0
  );
  return totalConfidence / result.data.words.length;
}

/**
 * Extract text from image using Tesseract.js with auto-retry on low confidence
 *
 * Strategy:
 * 1. Try direct image (no preprocessing) - FASTEST
 * 2. If confidence < 70%, retry with high contrast
 * 3. If still < 70%, retry with denoise
 * 4. Return best result
 */
export async function extractText(
  imageData: string,
  onProgress?: (progress: number) => void
): Promise<OCRResult> {
  console.log('[OCR] Starting text extraction...');
  console.log('[OCR] Image URL:', imageData.substring(0, 50) + '...');

  const tesseractWorker = await getWorker();
  let bestResult: OCRResult | null = null;
  let bestConfidence = 0;

  // Attempt 1: Direct image (no preprocessing) - FASTEST
  console.log('[OCR] Attempt 1: Direct image (no preprocessing)');
  try {
    const startTime = Date.now();
    const result = await tesseractWorker.recognize(imageData);
    const confidence = calculateConfidence(result);
    const duration = Date.now() - startTime;

    console.log(`[OCR] Attempt 1 completed in ${duration}ms, confidence: ${confidence.toFixed(2)}%`);

    bestResult = {
      text: result.data.text,
      confidence: confidence / 100,
      language: 'eng',
      blocks: result.data.lines.map((line): TextBlock => ({
        text: line.text,
        bbox: line.bbox,
        confidence: line.confidence / 100,
      })),
    };
    bestConfidence = confidence;

    onProgress?.(50);

    // If good enough, return immediately (skip preprocessing overhead)
    if (confidence >= 70) {
      console.log('[OCR] Good confidence, returning result');
      return bestResult;
    }

    console.log('[OCR] Low confidence, will retry with preprocessing...');
  } catch (error) {
    console.error('[OCR] Attempt 1 failed:', error);
  }

  // Only retry with preprocessing if confidence was low
  if (bestConfidence < 70) {
    // Attempt 2: High contrast preprocessing
    console.log('[OCR] Attempt 2: High contrast preprocessing');
    try {
      const startTime = Date.now();
      const preprocessed = await preprocessImage(imageData, 'high_contrast');
      const result = await tesseractWorker.recognize(preprocessed);
      const confidence = calculateConfidence(result);
      const duration = Date.now() - startTime;

      console.log(`[OCR] Attempt 2 completed in ${duration}ms, confidence: ${confidence.toFixed(2)}%`);

      if (confidence > bestConfidence) {
        bestResult = {
          text: result.data.text,
          confidence: confidence / 100,
          language: 'eng',
          blocks: result.data.lines.map((line): TextBlock => ({
            text: line.text,
            bbox: line.bbox,
            confidence: line.confidence / 100,
          })),
        };
        bestConfidence = confidence;
      }

      onProgress?.(75);

      // If good enough, return
      if (confidence >= 70) {
        console.log('[OCR] Good confidence after retry, returning result');
        return bestResult!;
      }
    } catch (error) {
      console.error('[OCR] Attempt 2 failed:', error);
    }

    // Attempt 3: Denoise preprocessing (last resort)
    console.log('[OCR] Attempt 3: Denoise preprocessing');
    try {
      const startTime = Date.now();
      const preprocessed = await preprocessImage(imageData, 'denoise');
      const result = await tesseractWorker.recognize(preprocessed);
      const confidence = calculateConfidence(result);
      const duration = Date.now() - startTime;

      console.log(`[OCR] Attempt 3 completed in ${duration}ms, confidence: ${confidence.toFixed(2)}%`);

      if (confidence > bestConfidence) {
        bestResult = {
          text: result.data.text,
          confidence: confidence / 100,
          language: 'eng',
          blocks: result.data.lines.map((line): TextBlock => ({
            text: line.text,
            bbox: line.bbox,
            confidence: line.confidence / 100,
          })),
        };
        bestConfidence = confidence;
      }

      onProgress?.(100);
    } catch (error) {
      console.error('[OCR] Attempt 3 failed:', error);
    }
  } else {
    // Good confidence on first try, skip preprocessing
    onProgress?.(100);
  }

  if (!bestResult) {
    throw new Error('All OCR attempts failed');
  }

  console.log(
    `[OCR] Completed with best confidence: ${(bestResult.confidence * 100).toFixed(2)}%`
  );
  return bestResult;
}

/**
 * Detect language of text
 */
export async function detectLanguage(text: string): Promise<string> {
  // Simple language detection based on character sets
  if (/[\u4e00-\u9fa5]/.test(text)) {
    return 'zh'; // Chinese
  }
  if (/[\u0600-\u06FF]/.test(text)) {
    return 'ar'; // Arabic
  }
  if (/[\u0E00-\u0E7F]/.test(text)) {
    return 'th'; // Thai
  }
  return 'en'; // Default to English
}

/**
 * Cleanup worker when no longer needed
 */
export async function terminateWorker(): Promise<void> {
  if (worker) {
    console.log('[OCR] Terminating worker');
    await worker.terminate();
    worker = null;
  }
}
