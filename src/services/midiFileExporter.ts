import type { MSCEvent } from '../models/mscTypes';
import { deviceIDByteValue } from '../models/mscTypes';

// MIDI file constants matching the Swift MSCNowFileExporter
const TICKS_PER_QUARTER = 9600; // 0x2580 - matches Pro Tools convention
const TEMPO_BPM = 120;
const MICROSECONDS_PER_BEAT = Math.round(60_000_000 / TEMPO_BPM); // 500,000
const END_OF_TRACK_DELAY_SECONDS = 5;

export function generateMIDIFile(
  events: MSCEvent[],
  midiOutputDeviceName: string = ''
): Uint8Array {
  const sorted = [...events].sort((a, b) => a.timestamp - b.timestamp);

  const headerChunk = buildHeaderChunk();
  const tempoTrack = buildTempoTrack();
  const mscTrack = buildMSCTrack(sorted, midiOutputDeviceName);

  const result = new Uint8Array(
    headerChunk.length + tempoTrack.length + mscTrack.length
  );
  let offset = 0;
  result.set(headerChunk, offset); offset += headerChunk.length;
  result.set(tempoTrack, offset); offset += tempoTrack.length;
  result.set(mscTrack, offset);

  return result;
}

export function generateFilename(cueList: string, cueCount: number): string {
  return `MSC_List${cueList}_${cueCount}Cues.mid`;
}

function buildHeaderChunk(): Uint8Array {
  // MThd chunk: format 1, 2 tracks, 9600 tpqn
  return new Uint8Array([
    0x4D, 0x54, 0x68, 0x64, // "MThd"
    0x00, 0x00, 0x00, 0x06, // chunk length: 6
    0x00, 0x01,             // format 1
    0x00, 0x02,             // 2 tracks
    0x25, 0x80,             // 9600 ticks per quarter
  ]);
}

function buildTempoTrack(): Uint8Array {
  const trackData: number[] = [];

  // SMPTE offset: FF 54 05 60 00 00 00 00
  trackData.push(0x00); // delta time
  trackData.push(0xFF, 0x54, 0x05, 0x60, 0x00, 0x00, 0x00, 0x00);

  // Tempo: FF 51 03 <3 bytes>
  trackData.push(0x00); // delta time
  trackData.push(0xFF, 0x51, 0x03);
  trackData.push(
    (MICROSECONDS_PER_BEAT >> 16) & 0xFF,
    (MICROSECONDS_PER_BEAT >> 8) & 0xFF,
    MICROSECONDS_PER_BEAT & 0xFF,
  );

  // End of track: FF 2F 00
  trackData.push(0x00);
  trackData.push(0xFF, 0x2F, 0x00);

  return wrapTrackChunk(new Uint8Array(trackData));
}

function buildMSCTrack(events: MSCEvent[], outputDeviceName: string): Uint8Array {
  const trackData: number[] = [];

  // Track name meta event: FF 03
  const trackName = 'MSC Events';
  trackData.push(0x00); // delta time
  trackData.push(0xFF, 0x03);
  pushVariableLength(trackData, trackName.length);
  for (let i = 0; i < trackName.length; i++) {
    trackData.push(trackName.charCodeAt(i));
  }

  // Instrument name meta event: FF 04 (Pro Tools routing)
  if (outputDeviceName) {
    trackData.push(0x00);
    trackData.push(0xFF, 0x04);
    pushVariableLength(trackData, outputDeviceName.length);
    for (let i = 0; i < outputDeviceName.length; i++) {
      trackData.push(outputDeviceName.charCodeAt(i));
    }
  }

  // MSC events with delta times
  let lastTick = 0;
  for (const event of events) {
    const currentTick = secondsToTicks(event.timestamp);
    const deltaTicks = currentTick - lastTick;

    pushVariableLength(trackData, deltaTicks);
    const sysex = encodeMSCEventForFile(event);
    for (const byte of sysex) {
      trackData.push(byte);
    }
    lastTick = currentTick;
  }

  // 5-second delay before end of track (Pro Tools compatibility)
  const endDelay = secondsToTicks(END_OF_TRACK_DELAY_SECONDS);
  pushVariableLength(trackData, endDelay);
  trackData.push(0xFF, 0x2F, 0x00);

  return wrapTrackChunk(new Uint8Array(trackData));
}

function encodeMSCEventForFile(event: MSCEvent): number[] {
  const bytes: number[] = [];

  // SysEx in MIDI file: F0 <length> <data without F0> F7
  const payload = encodeMSCPayload(event);

  bytes.push(0xF0);
  // Length includes everything after F0 up to and including F7
  pushVariableLength(bytes, payload.length + 1); // +1 for F7
  for (const b of payload) bytes.push(b);
  bytes.push(0xF7);

  return bytes;
}

export function encodeMSCPayload(event: MSCEvent): number[] {
  const bytes: number[] = [];

  bytes.push(0x7F); // Universal Real-Time SysEx
  bytes.push(deviceIDByteValue(event.deviceID));
  bytes.push(0x02); // MSC sub-ID
  bytes.push(event.commandFormat);
  bytes.push(event.command);

  // Cue data
  if (event.cueNumber) {
    for (let i = 0; i < event.cueNumber.length; i++) {
      bytes.push(event.cueNumber.charCodeAt(i));
    }
  }

  if (event.cueList) {
    bytes.push(0x00); // null separator
    for (let i = 0; i < event.cueList.length; i++) {
      bytes.push(event.cueList.charCodeAt(i));
    }
  }

  // Cue path (always add trailing null for Pro Tools compat)
  bytes.push(0x00);
  if (event.cuePath) {
    for (let i = 0; i < event.cuePath.length; i++) {
      bytes.push(event.cuePath.charCodeAt(i));
    }
  }

  return bytes;
}

function secondsToTicks(seconds: number): number {
  const beatsPerSecond = TEMPO_BPM / 60;
  return Math.round(seconds * beatsPerSecond * TICKS_PER_QUARTER);
}

function pushVariableLength(arr: number[], value: number): void {
  if (value < 0) value = 0;

  const bytes: number[] = [];
  bytes.push(value & 0x7F);
  let v = value >> 7;
  while (v > 0) {
    bytes.push((v & 0x7F) | 0x80);
    v >>= 7;
  }
  bytes.reverse();
  for (const b of bytes) arr.push(b);
}

function wrapTrackChunk(data: Uint8Array): Uint8Array {
  const header = new Uint8Array([
    0x4D, 0x54, 0x72, 0x6B, // "MTrk"
    (data.length >> 24) & 0xFF,
    (data.length >> 16) & 0xFF,
    (data.length >> 8) & 0xFF,
    data.length & 0xFF,
  ]);
  const result = new Uint8Array(header.length + data.length);
  result.set(header, 0);
  result.set(data, header.length);
  return result;
}

export function downloadMIDIFile(data: Uint8Array, filename: string): void {
  const blob = new Blob([new Uint8Array(data)], { type: 'audio/midi' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
