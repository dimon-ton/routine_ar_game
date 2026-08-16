import { useEffect, useState } from 'react';
import type { Preferences } from '../types/game';

const defaults: Preferences = {
  inputMode: 'hand',
  gestureMode: 'pinch',
  sound: true,
  speech: true,
  cameraOpacity: 0.72,
  sensitivity: 1.15,
  dwellDuration: 900,
};
const soundDefaultMigrationKey = 'daily-routine-sound-default-v2';

export function usePreferences() {
  const [preferences, setPreferences] = useState<Preferences>(() => {
    try {
      const stored = JSON.parse(
        localStorage.getItem('daily-routine-preferences') ?? '{}',
      ) as Partial<Preferences>;
      const needsSoundDefaultMigration =
        localStorage.getItem(soundDefaultMigrationKey) !== 'complete';
      if (needsSoundDefaultMigration) {
        localStorage.setItem(soundDefaultMigrationKey, 'complete');
      }
      return {
        ...defaults,
        ...stored,
        sound: needsSoundDefaultMigration ? true : (stored.sound ?? defaults.sound),
      };
    } catch {
      return defaults;
    }
  });
  useEffect(() => {
    localStorage.setItem('daily-routine-preferences', JSON.stringify(preferences));
  }, [preferences]);
  return [preferences, setPreferences] as const;
}
