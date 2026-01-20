// JustSnap - Confidence Score Utilities
// Shared utilities for displaying AI confidence scores (OCR, Translation, etc.)

/**
 * Get Tailwind CSS color classes based on confidence score
 * @param confidence - Confidence score between 0 and 1
 * @returns Tailwind CSS classes for text and background colors
 */
export function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.8) return 'text-green-600 bg-green-50';
  if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-50';
  return 'text-red-600 bg-red-50';
}

/**
 * Get human-readable confidence label
 * @param confidence - Confidence score between 0 and 1
 * @returns Label: "High", "Medium", or "Low"
 */
export function getConfidenceLabel(confidence: number): string {
  if (confidence >= 0.8) return 'High';
  if (confidence >= 0.6) return 'Medium';
  return 'Low';
}

/**
 * Format confidence as percentage string
 * @param confidence - Confidence score between 0 and 1
 * @returns Formatted percentage (e.g., "85%")
 */
export function formatConfidencePercent(confidence: number): string {
  return `${(confidence * 100).toFixed(0)}%`;
}
