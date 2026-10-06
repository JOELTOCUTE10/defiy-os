import { useState, useEffect, useCallback } from 'react';

export function useSpeech() {
  const [speaking, setSpeaking] = useState(false);
  const [currentText, setCurrentText] = useState<string | null>(null);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setSupported(true);
    }
  }, []);

  const speak = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel(); // Stop any ongoing speech

    const cleanText = text
      .replace(/[*_#`-]/g, ' ') // Strip basic markdown symbols
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      setSpeaking(true);
      setCurrentText(text);
    };

    utterance.onend = () => {
      setSpeaking(false);
      setCurrentText(null);
    };

    utterance.onerror = (e) => {
      console.warn('Speech synthesis error:', e);
      setSpeaking(false);
      setCurrentText(null);
    };

    window.speechSynthesis.speak(utterance);
  }, []);

  const stop = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      setCurrentText(null);
    }
  }, []);

  return {
    supported,
    speaking,
    currentText,
    speak,
    stop,
  };
}
