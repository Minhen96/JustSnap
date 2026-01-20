// JustSnap - Image Processing Utilities

/**
 * Convert an image/object URL into a base64 string (no data: prefix).
 */
export async function imageUrlToBase64(imageUrl: string): Promise<string> {
  const response = await fetch(imageUrl);
  const blob = await response.blob();

  const dataUrl: string = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

  const [, base64 = ''] = dataUrl.split(',');
  return base64;
}