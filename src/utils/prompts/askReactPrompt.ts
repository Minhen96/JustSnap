// JustSnap - Ask UI Prompt Templates (React, Vue, Flutter)
// Reference: feature.md (multi-framework flow), use_case.md SC-13

import type { AskFramework } from '../../types';

const analysisIntros: Record<AskFramework, string> = {
  react:
    "Hey LLM, I have uploaded a snipped image. Analyze the contents and generate a detailed description of the UI elements so I can build a React component from it.",
  vue:
    "Hey LLM, I have uploaded a snipped image. Analyze the contents and generate a detailed description of the UI elements so I can build a Vue component from it.",
  flutter:
    "Hey LLM, I have uploaded a snipped image. Analyze the contents and generate a detailed description of the UI elements so I can build a Flutter widget from it.",
};

const codeHints: Record<AskFramework, string> = {
  react: 'React + TypeScript component code (Tailwind classes if styling is needed)',
  vue: 'Vue 3 Single File Component code (template + script setup, style if needed)',
  flutter: 'Flutter widget code in Dart (use proper widget tree and layout)',
};

const styleHints: Record<AskFramework, string> = {
  react: 'Optional additional styles if not inline with Tailwind',
  vue: 'Optional style block or notes; omit if covered in the SFC',
  flutter: 'Optional theme/style notes; omit if handled in the widget tree',
};

const codeGuidance: Record<AskFramework, string> = {
  react:
    '- Use React + TypeScript with functional components and sensible props.\n- Prefer flex/grid for layout; keep it responsive.\n- Include basic event handlers if visible (click, submit, hover states).',
  vue:
    '- Use Vue 3 with <template> and <script setup> (TypeScript if needed).\n- Include props, emits, and v-model bindings when appropriate.\n- Keep template semantic and add scoped styles when styling is required.',
  flutter:
    '- Use Flutter with proper widget hierarchy (Scaffold, Column/Row, etc.).\n- Include stateful widgets only when needed; wire callbacks for visible interactions.\n- Respect padding, spacing, typography, and color hints from the UI.',
};

function buildJsonSchema(framework: AskFramework): string {
  return `{
  "name": "ComponentName",
  "description": "What the component renders and key UX details",
  "code": "${codeHints[framework]}",
  "props": {
    "propName": "Describe purpose/type (e.g., string: CTA label)"
  },
  "styles": "${styleHints[framework]}"
}`;
}

/**
 * Stage 1: Ask LLM to describe the snip and produce a concise, code-ready prompt.
 */
export function buildAskFrameworkAnalysisPrompt(
  framework: AskFramework,
  userPrompt?: string
): string {
  const intro = analysisIntros[framework];
  const userSection = userPrompt ? `\n\nAdditional guidance from user:\n${userPrompt}` : '';

  return `${intro}

Be specific and structured. Return plain text only (no JSON, no code).

Format:
1) Layout overview: page/surface structure, columns/rows, alignment.
2) Component stack (top-to-bottom, left-to-right): for each element state its type, label/text, count, and approximate sizes/spacing if visible.
3) Styles: colors (hex or closest name), typography (size/weight/line-height), borders/radius/shadows/backgrounds.
4) Interactions and states: visible hover/active/disabled/error/success, focus rings, validation hints, buttons/links/toggles/form states.
5) Data/behavior hints: what actions are implied (submit, filter, navigate), any dynamic content assumptions.

Be concise but cover every visible element.
${userSection || '\nNo extra user guidance was provided.'}`;
}

/**
 * Stage 2: Generate component/widget code JSON from the image and the derived prompt.
 */
export function buildAskFrameworkCodePrompt(framework: AskFramework): string {
  return `Generate a ${framework} UI implementation from the screenshot and the prepared analysis.
${codeGuidance[framework]}

Return ONLY JSON that matches this minimal schema:
${buildJsonSchema(framework)}

Rules:
- Populate "name", "description", and "code" at minimum.
- Keep "props" keys concise; omit if none.
- Keep "styles" concise; omit if not needed.
- Ground everything in the provided analysis/image; do not invent copy, data, icons, or flows that are not visible.
- If text or data is unreadable, use clear placeholders (e.g., "TODO Label", "TODO Description") and add a short inline comment.
- Only include interactions that are visually implied; otherwise, leave TODO stubs instead of guessing behavior.
- Keep styling faithful to the analysis; if a value is missing, use neutral defaults (text #111, border #e5e5e5, background #f8f8f8).
- Do not add external dependencies beyond what is typical for the framework.
- Do not wrap JSON in markdown fences.`;
}

// Backwards compatibility exports for earlier Ask React-only usage
export const buildAskReactAnalysisPrompt = (
  userPrompt?: string
): string => buildAskFrameworkAnalysisPrompt('react', userPrompt);

export const buildAskReactCodePrompt = (): string => buildAskFrameworkCodePrompt('react');
