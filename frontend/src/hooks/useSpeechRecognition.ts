import { useState, useEffect, useRef, useCallback } from 'react';

// Declaration for Web Speech API types
interface IWindow extends Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
}

export function useSpeechRecognition() {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [supported, setSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const win = window as unknown as IWindow;
    const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (SpeechRecognition) {
      setSupported(true);
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
      };

      rec.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setListening(false);
      };

      rec.onend = () => {
        setListening(false);
      };

      recognitionRef.current = rec;
    }
  }, []);

  const start = useCallback(() => {
    if (recognitionRef.current && !listening) {
      try {
        setTranscript('');
        recognitionRef.current.start();
        setListening(true);
      } catch (err) {
        console.warn('Failed to start speech recognition:', err);
      }
    }
  }, [listening]);

  const stop = useCallback(() => {
    if (recognitionRef.current && listening) {
      try {
        recognitionRef.current.stop();
        setListening(false);
      } catch (err) {
        console.warn('Failed to stop speech recognition:', err);
      }
    }
  }, [listening]);

  const reset = useCallback(() => {
    setTranscript('');
  }, []);

  return {
    supported,
    listening,
    transcript,
    setTranscript,
    start,
    stop,
    reset,
  };
}
