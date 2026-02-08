import type { MSCEvent, DeviceID, CommandFormatValue } from './mscTypes';
import { Command } from './mscTypes';

export type InputType =
  | { type: 'sequential'; count: number }
  | { type: 'specificList'; cues: string[] }
  | { type: 'singleCue'; cue: string };

export interface CueGeneratorConfig {
  cueList: string;
  cuesInput: string;
  singleCueMode: boolean;
  includeReleaseCue: boolean;
  delayBetweenCues: number;
  deviceID: DeviceID;
  commandFormat: CommandFormatValue;
}

export function detectInputType(input: string, singleCueMode: boolean): InputType | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  if (singleCueMode) {
    return { type: 'singleCue', cue: trimmed };
  }

  if (trimmed.includes(',')) {
    const cues = trimmed.split(',').map(s => s.trim()).filter(s => s.length > 0);
    if (cues.length > 0) {
      return { type: 'specificList', cues };
    }
    return null;
  }

  const asInt = parseInt(trimmed, 10);
  if (!isNaN(asInt) && asInt > 0 && String(asInt) === trimmed) {
    return { type: 'sequential', count: asInt };
  }

  return { type: 'singleCue', cue: trimmed };
}

export function parseCueNumbers(config: CueGeneratorConfig): string[] {
  const inputType = detectInputType(config.cuesInput, config.singleCueMode);
  if (!inputType) return [];

  switch (inputType.type) {
    case 'sequential':
      return Array.from({ length: inputType.count }, (_, i) => String(i + 1));
    case 'specificList':
      return inputType.cues;
    case 'singleCue':
      return [inputType.cue];
  }
}

export function totalEventCount(config: CueGeneratorConfig): number {
  const cues = parseCueNumbers(config);
  return cues.length + (config.includeReleaseCue ? 1 : 0);
}

export function inputHint(config: CueGeneratorConfig): string {
  const inputType = detectInputType(config.cuesInput, config.singleCueMode);
  if (!inputType) return '';

  switch (inputType.type) {
    case 'sequential':
      return `→ Sequential: cues 1 to ${inputType.count}`;
    case 'specificList':
      return `→ Specific: ${inputType.cues.length} cues (${inputType.cues.join(', ')})`;
    case 'singleCue':
      return `→ Single cue: Q${inputType.cue}`;
  }
}

export function previewDescription(config: CueGeneratorConfig): string {
  const cues = parseCueNumbers(config);
  if (cues.length === 0) return '';

  const cueLabel = cues.length === 1
    ? `1 GO cue (Q${cues[0]})`
    : `${cues.length} GO cues (Q${cues[0]}–Q${cues[cues.length - 1]})`;

  const listLabel = `in List ${config.cueList}`;
  const releaseLabel = config.includeReleaseCue ? ' + GO_OFF' : '';

  return `${cueLabel} ${listLabel}${releaseLabel}`;
}

export function validationError(config: CueGeneratorConfig): string | null {
  if (!config.cueList.trim()) return 'Cuelist number is required';
  const cues = parseCueNumbers(config);
  if (cues.length === 0) return 'At least one cue is required';
  return null;
}

export function generateEvents(config: CueGeneratorConfig): MSCEvent[] {
  const cues = parseCueNumbers(config);
  const events: MSCEvent[] = [];

  for (let i = 0; i < cues.length; i++) {
    events.push({
      timestamp: i * config.delayBetweenCues,
      deviceID: config.deviceID,
      commandFormat: config.commandFormat,
      command: Command.Go,
      cueNumber: cues[i],
      cueList: config.cueList,
      cuePath: '',
    });
  }

  if (config.includeReleaseCue) {
    events.push({
      timestamp: cues.length * config.delayBetweenCues,
      deviceID: config.deviceID,
      commandFormat: config.commandFormat,
      command: Command.GoOff,
      cueNumber: cues[cues.length - 1],
      cueList: config.cueList,
      cuePath: '',
    });
  }

  return events;
}
