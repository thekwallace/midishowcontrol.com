import { useState, useCallback } from 'react';
import type { DeviceID, CommandFormatValue } from '../models/mscTypes';
import { CommandFormat } from '../models/mscTypes';

export interface Settings {
  deviceID: DeviceID;
  commandFormat: CommandFormatValue;
  delayBetweenCues: number;
  autoGoOffSequential: boolean;
  autoGoOffList: boolean;
  autoGoOffSingle: boolean;
  midiOutputDeviceName: string;
  selectedMidiDestinationId: string | null;
}

const STORAGE_KEY = 'mscnow-settings';

const DEFAULT_SETTINGS: Settings = {
  deviceID: { type: 'specific', value: 1 },
  commandFormat: CommandFormat.Lighting,
  delayBetweenCues: 5.0,
  autoGoOffSequential: true,
  autoGoOffList: false,
  autoGoOffSingle: false,
  midiOutputDeviceName: '',
  selectedMidiDestinationId: null,
};

function loadSettings(): Settings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch {
    // ignore parse errors
  }
  return { ...DEFAULT_SETTINGS };
}

function saveSettings(settings: Settings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function useSettings() {
  const [settings, setSettingsState] = useState<Settings>(loadSettings);

  const updateSettings = useCallback((partial: Partial<Settings>) => {
    setSettingsState((prev) => {
      const next = { ...prev, ...partial };
      saveSettings(next);
      return next;
    });
  }, []);

  return { settings, updateSettings };
}
