// JustSnap - Image Processing Utilities

import type { Region } from '../types';

/**
 * Convert Uint8Array to base64 string
 */
export function uint8ArrayToBase64(buffer: Uint8Array): string {
  let binary = '';
  const len = buffer.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(buffer[i]);
  }
  return window.btoa(binary);
}

/**
 * Convert base64 to data URL
 */
export function base64ToDataUrl(base64: string, mimeType: string = 'image/png'): string {
  return `data:${mimeType};base64,${base64}`;
}

/**
 * Crop image to region
 */
export async function cropImage(imageUrl: string, region: Region): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = region.width;
      canvas.height = region.height;
      const ctx = canvas.getContext('2d')!;

      ctx.drawImage(img, region.x, region.y, region.width, region.height, 0, 0, region.width, region.height);

      resolve(canvas.toDataURL());
    };
    img.src = imageUrl;
  });
}

/**
 * Resize image
 */
export async function resizeImage(
  imageUrl: string,
  maxWidth: number,
  maxHeight: number
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;

      // Calculate new dimensions
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;

      ctx.drawImage(img, 0, 0, width, height);

      resolve(canvas.toDataURL());
    };
    img.src = imageUrl;
  });
}

/**
 * Apply blur filter to region
 */
export async function applyBlur(
  imageUrl: string,
  region: Region,
  blurAmount: number = 10
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;

      // Draw original image
      ctx.drawImage(img, 0, 0);

      // Apply blur to region
      ctx.filter = `blur(${blurAmount}px)`;
      ctx.drawImage(
        canvas,
        region.x,
        region.y,
        region.width,
        region.height,
        region.x,
        region.y,
        region.width,
        region.height
      );

      resolve(canvas.toDataURL());
    };
    img.src = imageUrl;
  });
}

/**
 * Convert canvas to blob
 */
export async function canvasToBlob(canvas: HTMLCanvasElement, type: string = 'image/png'): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to convert canvas to blob'));
        }
      },
      type
    );
  });
}
