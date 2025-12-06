// JustSnap - OCR Service (Tesseract.js)
// Reference: tech_stack.md lines 103-108, use_case.md SC-09

import { createWorker, type Worker } from 'tesseract.js';
import type { OCRResult, TextBlock } from '../types';

// Singleton worker instance
let worker: Worker | null = null;

/**
 * Initialize Tesseract.js worker (lazy loaded)
 */
async function getWorker(): Promise<Worker> {
  if (worker) {
    return worker;
  }

  console.log('[OCR] Initializing Tesseract.js worker...');
  try {
    worker = await createWorker({
      logger: (m) => {
        console.log('[OCR]', m);
      },
    });

    // Load languages - start with just English for reliability
    await worker.loadLanguage('eng');
    await worker.initialize('eng');

    console.log('[OCR] Worker initialized successfully');
    return worker;
  } catch (error) {
    console.error('[OCR] Failed to initialize worker:', error);
    worker = null;
    throw error;
  }
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

      // Set canvas size (upscale if too small for better accuracy)
      const minWidth = 1000;
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
 * 1. Try default preprocessing
 * 2. If confidence < 70%, retry with high contrast
 * 3. If still < 70%, retry with denoise
 * 4. Return best result
 */
export async function extractText(
  imageData: string,
  onProgress?: (progress: number) => void
): Promise<OCRResult> {
  console.log('[OCR] Starting text extraction...');

  const tesseractWorker = await getWorker();
  let bestResult: OCRResult | null = null;
  let bestConfidence = 0;

  // Attempt 1: Default preprocessing
  console.log('[OCR] Attempt 1: Default preprocessing');
  try {
    const preprocessed = await preprocessImage(imageData, 'default');
    const result = await tesseractWorker.recognize(preprocessed);
    const confidence = calculateConfidence(result);

    console.log(`[OCR] Attempt 1 confidence: ${confidence.toFixed(2)}%`);

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

    onProgress?.(33);

    // If good enough, return immediately
    if (confidence >= 70) {
      console.log('[OCR] Good confidence, returning result');
      return bestResult;
    }
  } catch (error) {
    console.error('[OCR] Attempt 1 failed:', error);
  }

  // Attempt 2: High contrast preprocessing
  console.log('[OCR] Attempt 2: High contrast preprocessing');
  try {
    const preprocessed = await preprocessImage(imageData, 'high_contrast');
    const result = await tesseractWorker.recognize(preprocessed);
    const confidence = calculateConfidence(result);

    console.log(`[OCR] Attempt 2 confidence: ${confidence.toFixed(2)}%`);

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

    onProgress?.(66);

    // If good enough, return
    if (confidence >= 70) {
      console.log('[OCR] Good confidence after retry, returning result');
      return bestResult!;
    }
  } catch (error) {
    console.error('[OCR] Attempt 2 failed:', error);
  }

  // Attempt 3: Denoise preprocessing
  console.log('[OCR] Attempt 3: Denoise preprocessing');
  try {
    const preprocessed = await preprocessImage(imageData, 'denoise');
    const result = await tesseractWorker.recognize(preprocessed);
    const confidence = calculateConfidence(result);

    console.log(`[OCR] Attempt 3 confidence: ${confidence.toFixed(2)}%`);

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
