// MIDI Show Control Types - ported from MSCEditor Swift

export type DeviceID =
  | { type: 'specific'; value: number }   // 0-111
  | { type: 'group'; value: number }      // 112-126 (0x70-0x7E)
  | { type: 'all' };                      // 127 (0x7F)

export function deviceIDByteValue(id: DeviceID): number {
  switch (id.type) {
    case 'specific': return id.value;
    case 'group': return id.value;
    case 'all': return 0x7F;
  }
}

export function deviceIDDisplayName(id: DeviceID): string {
  switch (id.type) {
    case 'all': return 'All Devices (127)';
    case 'group': return `Group ${id.value - 0x70 + 1} (${id.value})`;
    case 'specific': return `Device ${id.value}`;
  }
}

export function deviceIDFromByte(byte: number): DeviceID {
  if (byte === 0x7F) return { type: 'all' };
  if (byte >= 0x70 && byte <= 0x7E) return { type: 'group', value: byte };
  return { type: 'specific', value: byte };
}

// Command Format constants (const object instead of enum for erasableSyntaxOnly)
export const CommandFormat = {
  Lighting: 0x01,
  MovingLights: 0x02,
  ColorChangers: 0x03,
  Strobes: 0x04,
  Lasers: 0x05,
  Chasers: 0x06,
  Sound: 0x10,
  Music: 0x11,
  CDPlayers: 0x12,
  EPROMPlayback: 0x13,
  AudioTapeMachines: 0x14,
  Intercoms: 0x15,
  Amplifiers: 0x16,
  AudioEffects: 0x17,
  Equalizers: 0x18,
  Machinery: 0x20,
  Rigging: 0x21,
  Flys: 0x22,
  Lifts: 0x23,
  Turntables: 0x24,
  TrussSpots: 0x25,
  RobotTrusses: 0x26,
  Robotics: 0x27,
  Video: 0x30,
  VideoTapeMachines: 0x31,
  VideoCassetteMachines: 0x32,
  VideoDiscPlayers: 0x33,
  VideoSwitchers: 0x34,
  VideoEffects: 0x35,
  VideoCharGenerators: 0x36,
  VideoStillStores: 0x37,
  VideoMonitors: 0x38,
  Projection: 0x40,
  FilmProjectors: 0x41,
  SlideProjectors: 0x42,
  VideoProjectors: 0x43,
  Dissolvers: 0x44,
  ShutterControls: 0x45,
  ProcessControl: 0x50,
  HydraulicOil: 0x51,
  H2O: 0x52,
  CO2: 0x53,
  CompressedAir: 0x54,
  NaturalGas: 0x55,
  Fog: 0x56,
  Smoke: 0x57,
  CrackerHaze: 0x58,
  Pyro: 0x60,
  Fireworks: 0x61,
  Explosions: 0x62,
  Flame: 0x63,
  SmokePots: 0x64,
  AllTypes: 0x7F,
} as const;

export type CommandFormatValue = (typeof CommandFormat)[keyof typeof CommandFormat];

export const commandFormatDisplayNames: Record<number, string> = {
  [CommandFormat.Lighting]: 'Lighting (General)',
  [CommandFormat.MovingLights]: 'Moving Lights',
  [CommandFormat.ColorChangers]: 'Color Changers',
  [CommandFormat.Strobes]: 'Strobes',
  [CommandFormat.Lasers]: 'Lasers',
  [CommandFormat.Chasers]: 'Chasers',
  [CommandFormat.Sound]: 'Sound (General)',
  [CommandFormat.Music]: 'Music',
  [CommandFormat.CDPlayers]: 'CD Players',
  [CommandFormat.EPROMPlayback]: 'EPROM Playback',
  [CommandFormat.AudioTapeMachines]: 'Audio Tape Machines',
  [CommandFormat.Intercoms]: 'Intercoms',
  [CommandFormat.Amplifiers]: 'Amplifiers',
  [CommandFormat.AudioEffects]: 'Audio Effects',
  [CommandFormat.Equalizers]: 'Equalizers',
  [CommandFormat.Machinery]: 'Machinery (General)',
  [CommandFormat.Rigging]: 'Rigging',
  [CommandFormat.Flys]: 'Flys',
  [CommandFormat.Lifts]: 'Lifts',
  [CommandFormat.Turntables]: 'Turntables',
  [CommandFormat.TrussSpots]: 'Truss Spots',
  [CommandFormat.RobotTrusses]: 'Robot Trusses',
  [CommandFormat.Robotics]: 'Robotics',
  [CommandFormat.Video]: 'Video (General)',
  [CommandFormat.VideoTapeMachines]: 'Video Tape Machines',
  [CommandFormat.VideoCassetteMachines]: 'Video Cassette Machines',
  [CommandFormat.VideoDiscPlayers]: 'Video Disc Players',
  [CommandFormat.VideoSwitchers]: 'Video Switchers',
  [CommandFormat.VideoEffects]: 'Video Effects',
  [CommandFormat.VideoCharGenerators]: 'Video Character Generators',
  [CommandFormat.VideoStillStores]: 'Video Still Stores',
  [CommandFormat.VideoMonitors]: 'Video Monitors',
  [CommandFormat.Projection]: 'Projection (General)',
  [CommandFormat.FilmProjectors]: 'Film Projectors',
  [CommandFormat.SlideProjectors]: 'Slide Projectors',
  [CommandFormat.VideoProjectors]: 'Video Projectors',
  [CommandFormat.Dissolvers]: 'Dissolvers',
  [CommandFormat.ShutterControls]: 'Shutter Controls',
  [CommandFormat.ProcessControl]: 'Process Control (General)',
  [CommandFormat.HydraulicOil]: 'Hydraulic Oil',
  [CommandFormat.H2O]: 'H2O',
  [CommandFormat.CO2]: 'CO2',
  [CommandFormat.CompressedAir]: 'Compressed Air',
  [CommandFormat.NaturalGas]: 'Natural Gas',
  [CommandFormat.Fog]: 'Fog',
  [CommandFormat.Smoke]: 'Smoke',
  [CommandFormat.CrackerHaze]: 'Cracker/Haze',
  [CommandFormat.Pyro]: 'Pyro (General)',
  [CommandFormat.Fireworks]: 'Fireworks',
  [CommandFormat.Explosions]: 'Explosions',
  [CommandFormat.Flame]: 'Flame',
  [CommandFormat.SmokePots]: 'Smoke Pots',
  [CommandFormat.AllTypes]: 'All Types',
};

// Command constants
export const Command = {
  Go: 0x01,
  Stop: 0x02,
  Resume: 0x03,
  TimedGo: 0x04,
  Load: 0x05,
  Set: 0x06,
  Fire: 0x07,
  AllOff: 0x08,
  Restore: 0x09,
  Reset: 0x0A,
  GoOff: 0x0B,
  GoPause: 0x0E,
  GoPauseOff: 0x0F,
  StartClock: 0x11,
  StopClock: 0x12,
  ZeroClock: 0x13,
  SetClock: 0x14,
  MTCChaseOn: 0x15,
  MTCChaseOff: 0x16,
  OpenCueList: 0x17,
  CloseCueList: 0x18,
  OpenCuePath: 0x19,
  CloseCuePath: 0x1A,
} as const;

export type CommandValue = (typeof Command)[keyof typeof Command];

export interface MSCEvent {
  timestamp: number;       // seconds from start
  deviceID: DeviceID;
  commandFormat: CommandFormatValue;
  command: CommandValue;
  cueNumber: string;
  cueList: string;
  cuePath: string;
}
