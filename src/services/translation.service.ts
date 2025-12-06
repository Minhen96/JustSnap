// JustSnap - Translation Service (OpenAI)
// Reference: tech_stack.md lines 96, use_case.md line 80

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';

export type TranslationLanguage = 'en' | 'zh' | 'ms'; // English, Chinese, Malay

export interface TranslationResult {
  translatedText: string;
  detectedSourceLanguage: string; // e.g., "English", "Chinese", "Malay"
  targetLanguage: TranslationLanguage;
  sourceText: string;
}

/**
 * Translate text using OpenAI with auto-detection of source language
 */
export async function translateText(
  text: string,
  targetLanguage: TranslationLanguage
): Promise<TranslationResult> {
  console.log('[Translation] Starting translation...');
  console.log('[Translation] Target language:', targetLanguage);
  console.log('[Translation] Source text:', text.substring(0, 100) + '...');

  if (!text || text.trim().length === 0) {
    throw new Error('No text to translate');
  }

  // Map language codes to full names
  const languageNames: Record<TranslationLanguage, string> = {
    en: 'English',
    zh: 'Chinese',
    ms: 'Malay',
  };

  const targetLanguageName = languageNames[targetLanguage];

  // Construct prompt with auto-detection
  const prompt = `You are a professional translator.

Task:
1. Detect the source language of the text below
2. Translate it to ${targetLanguageName}

Important rules:
- Only respond with a JSON object, no markdown code blocks
- Format: {"detectedLanguage": "language name", "translation": "translated text"}
- Preserve formatting (line breaks, punctuation)
- If text is already in ${targetLanguageName}, just return it as-is

Text to translate:
${text}`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'OpenAI API request failed');
    }

    const data = await response.json();
    const responseText = data.choices[0]?.message?.content || '';

    console.log('[Translation] OpenAI response:', responseText);

    // Parse JSON response (remove markdown code blocks if present)
    const cleanedText = responseText.replace(/```json\n?|\n?```/g, '').trim();
    const parsed = JSON.parse(cleanedText);

    return {
      translatedText: parsed.translation,
      detectedSourceLanguage: parsed.detectedLanguage,
      targetLanguage,
      sourceText: text,
    };
  } catch (error) {
    console.error('[Translation] Failed:', error);
    throw new Error(
      error instanceof Error ? error.message : 'Translation failed'
    );
  }
}
