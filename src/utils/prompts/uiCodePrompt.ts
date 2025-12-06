// JustSnap - UI Code Generation Prompt Template (Signature Feature)

export function buildCodeGenPrompt(framework: 'react' | 'vue' | 'flutter' | 'html' | 'nextjs'): string {
  const frameworkInstructions = {
    react: `Generate a React component using TypeScript and Tailwind CSS.
- Use functional components with hooks
- Use proper TypeScript types
- Include all necessary imports
- Make it responsive
- Use Tailwind utility classes for styling`,

    vue: `Generate a Vue 3 component using Composition API and TypeScript.
- Use <script setup> syntax
- Use proper TypeScript types
- Include all necessary imports
- Make it responsive
- Use scoped styles`,

    flutter: `Generate a Flutter widget using Dart.
- Use StatelessWidget or StatefulWidget as appropriate
- Follow Flutter best practices
- Include necessary imports
- Make it responsive
- Use Material Design components`,

    html: `Generate clean HTML with Tailwind CSS.
- Use semantic HTML5 elements
- Use Tailwind utility classes
- Make it responsive
- Include a <style> section if custom CSS is needed`,

    nextjs: `Generate a Next.js component using TypeScript and Tailwind CSS.
- Use Next.js 14+ App Router conventions if applicable
- Use 'use client' directive if needed
- Include proper TypeScript types
- Make it responsive
- Use Tailwind utility classes`,
  };

  return `You are an expert UI developer. Analyze the provided screenshot and generate production-ready code.

${frameworkInstructions[framework]}

IMPORTANT:
- Detect all UI elements: buttons, inputs, cards, layouts, typography
- Match colors, spacing, and layout as closely as possible
- Extract any text content visible in the screenshot
- Generate clean, maintainable, and well-structured code
- Include comments explaining key sections
- Make the component reusable with props where appropriate

Return the code in a JSON format:
{
  "code": "// Your generated code here",
  "styles": "/* Additional styles if needed */",
  "dependencies": ["package1", "package2"],
  "fileName": "ComponentName.tsx"
}`;
}
