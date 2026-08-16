import { useCallback } from 'react';

export function useFeedback(sound: boolean, speech: boolean) {
  const tone = useCallback(
    (correct: boolean) => {
      if (!sound) return;
      const AudioContextClass = window.AudioContext ?? window.webkitAudioContext;
      if (!AudioContextClass) return;
      const context = new AudioContextClass();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(correct ? 660 : 320, context.currentTime);
      if (correct)
        oscillator.frequency.exponentialRampToValueAtTime(880, context.currentTime + 0.12);
      gain.gain.setValueAtTime(0.09, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.2);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.2);
      oscillator.addEventListener('ended', () => void context.close());
    },
    [sound],
  );
  const speak = useCallback(
    (text: string) => {
      if (!sound || !speech || !('speechSynthesis' in window)) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.82;
      window.speechSynthesis.speak(utterance);
    },
    [sound, speech],
  );
  return { tone, speak };
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}
