// JustSnap - AI Summary Prompt Template

export const SUMMARY_PROMPT = `You are an AI assistant analyzing a screenshot.

Please provide:
1. A brief 2-3 sentence summary of what you see in the image
2. 3-5 key points or important elements
3. Context about what this screenshot might be used for

Format your response as JSON:
{
  "summary": "Brief summary here",
  "keyPoints": ["Point 1", "Point 2", "Point 3"]
}`;

export function buildSummaryPrompt(additionalContext?: string): string {
  if (additionalContext) {
    return `${SUMMARY_PROMPT}\n\nAdditional context: ${additionalContext}`;
  }
  return SUMMARY_PROMPT;
}
