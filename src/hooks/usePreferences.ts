import { useEffect, useState } from 'react';
import type { Preferences } from '../types/game';

const defaults: Preferences = {
  inputMode: 'hand',
  sound: true,
  backgroundVolume: 0.04,
  speech: true,
  cameraOpacity: 0.72,
  sensitivity: 1.15,
};
const soundDefaultMigrationKey = 'daily-routine-sound-default-v2';
const backgroundVolumeMigrationKey = 'daily-routine-background-volume-v3';

export function usePreferences() {
  const [preferences, setPreferences] = useState<Preferences>(() => {
    try {
      const stored = JSON.parse(
        localStorage.getItem('daily-routine-preferences') ?? '{}',
      ) as Partial<Preferences>;
      const needsSoundDefaultMigration =
        localStorage.getItem(soundDefaultMigrationKey) !== 'complete';
      const needsBackgroundVolumeMigration =
        localStorage.getItem(backgroundVolumeMigrationKey) !== 'complete';
      if (needsSoundDefaultMigration) {
        localStorage.setItem(soundDefaultMigrationKey, 'complete');
      }
      if (needsBackgroundVolumeMigration) {
        localStorage.setItem(backgroundVolumeMigrationKey, 'complete');
      }
      return {
        ...defaults,
        ...stored,
        sound: needsSoundDefaultMigration ? true : (stored.sound ?? defaults.sound),
        backgroundVolume:
          needsBackgroundVolumeMigration &&
          (stored.backgroundVolume === undefined || stored.backgroundVolume === 0.08)
            ? defaults.backgroundVolume
            : (stored.backgroundVolume ?? defaults.backgroundVolume),
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
