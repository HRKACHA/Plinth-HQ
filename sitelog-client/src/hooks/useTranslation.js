import { useState, useCallback } from 'react';

// MyMemory API is a free translation API for demo purposes.
// For production, consider Google Cloud Translation or DeepL.
const TRANSLATE_API_URL = 'https://api.mymemory.translated.net/get';

export function useTranslation() {
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState(null);

  const translateText = useCallback(async (text, sourceLang = 'en', targetLang = 'hi') => {
    if (!text || !text.trim()) return '';
    
    // Convert language codes if needed (MyMemory uses standard 2-letter codes)
    const src = sourceLang.split('-')[0]; // e.g. en-IN -> en
    const tgt = targetLang.split('-')[0];

    if (src === tgt) return text; // No need to translate if languages match

    setIsTranslating(true);
    setError(null);

    try {
      const url = `${TRANSLATE_API_URL}?q=${encodeURIComponent(text)}&langpair=${src}|${tgt}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Translation request failed');
      }

      const data = await response.json();
      
      // MyMemory returns data.responseData.translatedText
      if (data && data.responseData && data.responseData.translatedText) {
        return data.responseData.translatedText;
      }
      
      throw new Error('Invalid translation response');
    } catch (err) {
      console.error('Translation error:', err);
      setError(err.message);
      return text; // Return original text as fallback
    } finally {
      setIsTranslating(false);
    }
  }, []);

  return { translateText, isTranslating, error };
}
