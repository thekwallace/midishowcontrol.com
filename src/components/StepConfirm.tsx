import { useState, useRef, useCallback } from 'react';
import {
  previewDescription,
  generateEvents,
  parseCueNumbers,
  type CueGeneratorConfig,
} from '../models/cueGenerator';
import {
  generateMIDIFile,
  generateFilename,
  downloadMIDIFile,
} from '../services/midiFileExporter';
import {
  sendCueSequence,
  type MIDIDestination,
} from '../services/webMidiManager';
import { trackExport, trackSendLive } from '../services/analytics';
import { detectInputType } from '../models/cueGenerator';

interface Props {
  config: CueGeneratorConfig;
  onBack: () => void;
  onSingleCueModeChange: (value: boolean) => void;
  onIncludeReleaseCueChange: (value: boolean) => void;
  midiAccess: MIDIAccess | null;
  selectedDestination: MIDIDestination | null;
  midiOutputDeviceName: string;
}

export function StepConfirm({
  config,
  onBack,
  onSingleCueModeChange,
  onIncludeReleaseCueChange,
  midiAccess,
  selectedDestination,
  midiOutputDeviceName,
}: Props) {
  const [isSending, setIsSending] = useState(false);
  const [sendProgress, setSendProgress] = useState({ current: 0, total: 0 });
  const cancelRef = useRef(false);

  const preview = previewDescription(config);
  const cueCount = parseCueNumbers(config).length;

  const handleExport = useCallback(() => {
    const events = generateEvents(config);
    const data = generateMIDIFile(events, midiOutputDeviceName);
    const filename = generateFilename(config.cueList, cueCount);
    downloadMIDIFile(data, filename);
    const inputType = detectInputType(config.cuesInput, config.singleCueMode);
    trackExport(inputType?.type ?? 'unknown', cueCount, config.commandFormat);
  }, [config, midiOutputDeviceName, cueCount]);

  const handleSendLive = useCallback(async () => {
    if (!midiAccess || !selectedDestination) return;

    cancelRef.current = false;
    setIsSending(true);

    const inputType = detectInputType(config.cuesInput, config.singleCueMode);
    trackSendLive(inputType?.type ?? 'unknown', cueCount, config.commandFormat);

    const events = generateEvents(config);
    const delayMs = config.delayBetweenCues * 1000;

    await sendCueSequence(
      midiAccess,
      selectedDestination.id,
      events,
      delayMs,
      (current, total) => setSendProgress({ current, total }),
      () => cancelRef.current
    );

    setIsSending(false);
  }, [config, midiAccess, selectedDestination]);

  const handleCancel = () => {
    cancelRef.current = true;
  };

  return (
    <div className="step">
      <div className="step-header">
        <button onClick={onBack} className="btn btn-back" disabled={isSending}>
          ← Cues
        </button>
      </div>

      <h2>Does this look right?</h2>

      <div className="preview-box">
        <p>{preview}</p>
        <p className="preview-delay">
          {config.delayBetweenCues}s between cues
        </p>
      </div>

      <div className="toggle-group">
        <label className="toggle">
          <input
            type="checkbox"
            checked={config.singleCueMode}
            onChange={(e) => onSingleCueModeChange(e.target.checked)}
            disabled={isSending}
          />
          <span>Single cue mode</span>
        </label>
        <label className="toggle">
          <input
            type="checkbox"
            checked={config.includeReleaseCue}
            onChange={(e) => onIncludeReleaseCueChange(e.target.checked)}
            disabled={isSending}
          />
          <span>Include GO_OFF at end</span>
        </label>
      </div>

      {isSending ? (
        <div className="send-progress">
          <p>
            Sending {sendProgress.current}/{sendProgress.total}
          </p>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width: `${
                  sendProgress.total > 0
                    ? (sendProgress.current / sendProgress.total) * 100
                    : 0
                }%`,
              }}
            />
          </div>
          <button onClick={handleCancel} className="btn btn-danger">
            Stop
          </button>
        </div>
      ) : (
        <div className="step-actions confirm-actions">
          {midiAccess && selectedDestination && (
            <button onClick={handleSendLive} className="btn btn-primary">
              Send Live
            </button>
          )}
          <button onClick={handleExport} className="btn btn-secondary">
            Export MIDI File
          </button>
        </div>
      )}
    </div>
  );
}
