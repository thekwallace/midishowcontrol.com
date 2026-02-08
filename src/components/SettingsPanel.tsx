import type { CommandFormatValue } from '../models/mscTypes';
import {
  CommandFormat,
  commandFormatDisplayNames,
  deviceIDFromByte,
  deviceIDByteValue,
  deviceIDDisplayName,
} from '../models/mscTypes';
import type { Settings } from '../services/useSettings';
import type { MIDIDestination } from '../services/webMidiManager';

interface Props {
  settings: Settings;
  onUpdate: (partial: Partial<Settings>) => void;
  destinations: MIDIDestination[];
  midiError: string | null;
  onRefreshMidi: () => void;
}

const FORMAT_OPTIONS = Object.values(CommandFormat) as CommandFormatValue[];

export function SettingsPanel({
  settings,
  onUpdate,
  destinations,
  midiError,
  onRefreshMidi,
}: Props) {
  return (
    <div className="settings-panel">
      <h3>Settings</h3>

      <div className="setting-group">
        <label>Delay between cues (seconds)</label>
        <input
          type="number"
          min={0}
          max={60}
          step={0.5}
          value={settings.delayBetweenCues}
          onChange={(e) =>
            onUpdate({ delayBetweenCues: parseFloat(e.target.value) || 1 })
          }
        />
      </div>

      <div className="setting-group">
        <label>Device ID</label>
        <select
          value={deviceIDByteValue(settings.deviceID)}
          onChange={(e) =>
            onUpdate({ deviceID: deviceIDFromByte(parseInt(e.target.value, 10)) })
          }
        >
          <option value={127}>All Devices (127)</option>
          {Array.from({ length: 112 }, (_, i) => (
            <option key={i} value={i}>
              Device {i}
            </option>
          ))}
          {Array.from({ length: 15 }, (_, i) => {
            const val = 0x70 + i;
            return (
              <option key={val} value={val}>
                {deviceIDDisplayName(deviceIDFromByte(val))}
              </option>
            );
          })}
        </select>
      </div>

      <div className="setting-group">
        <label>Command Format</label>
        <select
          value={settings.commandFormat}
          onChange={(e) =>
            onUpdate({ commandFormat: parseInt(e.target.value, 10) as CommandFormatValue })
          }
        >
          {FORMAT_OPTIONS.map((fmt) => (
            <option key={fmt} value={fmt}>
              {commandFormatDisplayNames[fmt]}
            </option>
          ))}
        </select>
      </div>

      <div className="setting-group">
        <label>Auto GO_OFF behavior</label>
        <label className="toggle">
          <input
            type="checkbox"
            checked={settings.autoGoOffSequential}
            onChange={(e) => onUpdate({ autoGoOffSequential: e.target.checked })}
          />
          <span>Sequential cues</span>
        </label>
        <label className="toggle">
          <input
            type="checkbox"
            checked={settings.autoGoOffList}
            onChange={(e) => onUpdate({ autoGoOffList: e.target.checked })}
          />
          <span>Comma-separated list</span>
        </label>
        <label className="toggle">
          <input
            type="checkbox"
            checked={settings.autoGoOffSingle}
            onChange={(e) => onUpdate({ autoGoOffSingle: e.target.checked })}
          />
          <span>Single cue</span>
        </label>
      </div>

      <div className="setting-group">
        <label>MIDI file output device name</label>
        <input
          type="text"
          placeholder="e.g. Network, Protools"
          value={settings.midiOutputDeviceName}
          onChange={(e) => onUpdate({ midiOutputDeviceName: e.target.value })}
        />
        <span className="setting-hint">
          Embedded as instrument name in exported MIDI files (for Pro Tools routing)
        </span>
      </div>

      <div className="setting-group">
        <label>
          MIDI Live Output
          {midiError && <span className="midi-error"> — {midiError}</span>}
        </label>
        <div className="midi-destination-row">
          <select
            value={settings.selectedMidiDestinationId || ''}
            onChange={(e) =>
              onUpdate({
                selectedMidiDestinationId: e.target.value || null,
              })
            }
          >
            <option value="">None</option>
            {destinations.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
          <button onClick={onRefreshMidi} className="btn btn-small" title="Refresh MIDI devices">
            ↻
          </button>
        </div>
        {settings.selectedMidiDestinationId && (
          <span className="midi-status connected">● Connected</span>
        )}
      </div>
    </div>
  );
}
