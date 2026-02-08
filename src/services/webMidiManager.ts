import type { MSCEvent } from '../models/mscTypes';
import { encodeMSCPayload } from './midiFileExporter';

export interface MIDIDestination {
  id: string;
  name: string;
}

export interface WebMidiState {
  supported: boolean;
  access: MIDIAccess | null;
  destinations: MIDIDestination[];
  selectedDestinationId: string | null;
  error: string | null;
}

export async function requestMIDIAccess(): Promise<{
  access: MIDIAccess | null;
  error: string | null;
}> {
  if (!navigator.requestMIDIAccess) {
    return {
      access: null,
      error: 'Web MIDI API not supported. Use Chrome or Edge.',
    };
  }

  try {
    const access = await navigator.requestMIDIAccess({ sysex: true } as MIDIOptions);
    return { access, error: null };
  } catch (e) {
    return {
      access: null,
      error: `MIDI access denied: ${e instanceof Error ? e.message : String(e)}`,
    };
  }
}

export function getDestinations(access: MIDIAccess): MIDIDestination[] {
  const destinations: MIDIDestination[] = [];
  access.outputs.forEach((output) => {
    destinations.push({ id: output.id, name: output.name || `Output ${output.id}` });
  });
  return destinations;
}

export function sendMSCEvent(
  access: MIDIAccess,
  destinationId: string,
  event: MSCEvent
): void {
  const output = access.outputs.get(destinationId);
  if (!output) return;

  const payload = encodeMSCPayload(event);
  // Full SysEx message: F0 <payload> F7
  const message = new Uint8Array(payload.length + 2);
  message[0] = 0xF0;
  for (let i = 0; i < payload.length; i++) {
    message[i + 1] = payload[i];
  }
  message[message.length - 1] = 0xF7;

  output.send(Array.from(message));
}

export async function sendCueSequence(
  access: MIDIAccess,
  destinationId: string,
  events: MSCEvent[],
  delayMs: number,
  onProgress: (current: number, total: number) => void,
  shouldCancel: () => boolean
): Promise<void> {
  const total = events.length;

  for (let i = 0; i < events.length; i++) {
    if (shouldCancel()) return;

    onProgress(i + 1, total);
    sendMSCEvent(access, destinationId, events[i]);

    if (i < events.length - 1) {
      await sleep(delayMs);
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
