// JustSnap - File Export Utilities

import type { ExportFormat, ExportOptions } from '../types';

/**
 * Download file to user's system
 */
export function downloadFile(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Convert data URL to Blob
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)![1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

/**
 * Export screenshot with annotations
 */
export async function exportScreenshot(
  imageDataUrl: string,
  fileName: string,
  options: ExportOptions
) {
  const blob = dataUrlToBlob(imageDataUrl);

  // Determine file extension
  let extension = options.format;
  if (options.format === 'jpg') extension = 'jpeg';

  const fullFileName = `${fileName}.${extension}`;

  downloadFile(blob, fullFileName);
}

/**
 * Export text content
 */
export function exportText(content: string, fileName: string, format: 'txt' | 'md' = 'txt') {
  const blob = new Blob([content], { type: 'text/plain' });
  downloadFile(blob, `${fileName}.${format}`);
}

/**
 * Generate filename with timestamp
 */
export function generateFileName(prefix: string = 'justsnap'): string {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, -5);
  return `${prefix}_${timestamp}`;
}
