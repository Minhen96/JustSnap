// JustSnap - AI Translation Prompt Template

export function buildTranslationPrompt(text: string, targetLang: 'en' | 'zh' | 'ms'): string {
  const langMap = {
    en: 'English',
    zh: 'Chinese (Simplified)',
    ms: 'Malay',
  };

  return `Translate the following text to ${langMap[targetLang]}.
Only return the translated text without any additional explanation.

Text to translate:
${text}`;
}
