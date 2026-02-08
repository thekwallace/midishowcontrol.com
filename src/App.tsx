import { useState, useEffect, useCallback, useRef } from 'react';
import { StepCuelist } from './components/StepCuelist';
import { StepCues } from './components/StepCues';
import { StepConfirm } from './components/StepConfirm';
import { SettingsPanel } from './components/SettingsPanel';
import { useSettings } from './services/useSettings';
import { detectInputType, type CueGeneratorConfig } from './models/cueGenerator';
import {
  requestMIDIAccess,
  getDestinations,
  type MIDIDestination,
} from './services/webMidiManager';
import { trackWizardStep, trackSettingsOpened, initAnalytics } from './services/analytics';
import { CookieBanner } from './components/CookieBanner';
import './App.css';

type Step = 0 | 1 | 2;

function App() {
  const { settings, updateSettings } = useSettings();
  const [step, setStep] = useState<Step>(0);
  const [cueList, setCueList] = useState('');
  const [cuesInput, setCuesInput] = useState('');
  const [singleCueMode, setSingleCueMode] = useState(false);
  const [includeReleaseCue, setIncludeReleaseCue] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // MIDI state
  const [midiAccess, setMidiAccess] = useState<MIDIAccess | null>(null);
  const [midiDestinations, setMidiDestinations] = useState<MIDIDestination[]>([]);
  const [midiError, setMidiError] = useState<string | null>(null);
  const lastInputTypeRef = useRef<string | null>(null);

  // Initialize Web MIDI
  const initMidi = useCallback(async () => {
    const { access, error } = await requestMIDIAccess();
    if (access) {
      setMidiAccess(access);
      setMidiDestinations(getDestinations(access));
      access.onstatechange = () => {
        setMidiDestinations(getDestinations(access));
      };
    }
    setMidiError(error);
  }, []);

  useEffect(() => {
    initMidi();
    initAnalytics();
  }, [initMidi]);

  // Auto GO_OFF logic: update includeReleaseCue when input type changes
  useEffect(() => {
    const inputType = detectInputType(cuesInput, singleCueMode);
    const typeKey = inputType?.type ?? null;

    if (typeKey && typeKey !== lastInputTypeRef.current) {
      lastInputTypeRef.current = typeKey;
      switch (typeKey) {
        case 'sequential':
          setIncludeReleaseCue(settings.autoGoOffSequential);
          break;
        case 'specificList':
          setIncludeReleaseCue(settings.autoGoOffList);
          break;
        case 'singleCue':
          setIncludeReleaseCue(settings.autoGoOffSingle);
          break;
      }
    }
  }, [cuesInput, singleCueMode, settings]);

  const config: CueGeneratorConfig = {
    cueList,
    cuesInput,
    singleCueMode,
    includeReleaseCue,
    delayBetweenCues: settings.delayBetweenCues,
    deviceID: settings.deviceID,
    commandFormat: settings.commandFormat,
  };

  const selectedDestination: MIDIDestination | null =
    midiDestinations.find(
      (d) => d.id === settings.selectedMidiDestinationId
    ) ?? null;

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-title">
          <img src="/logo-128.png" alt="MSCNow" className="app-logo" />
          <h1>midishowcontrol.com</h1>
        </div>
        <button
          className="btn btn-icon"
          onClick={() => { if (!showSettings) trackSettingsOpened(); setShowSettings(!showSettings); }}
          title="Settings"
        >
          &#9881;
        </button>
      </header>

      {showSettings ? (
        <SettingsPanel
          settings={settings}
          onUpdate={updateSettings}
          destinations={midiDestinations}
          midiError={midiError}
          onRefreshMidi={initMidi}
        />
      ) : (
        <main className="wizard">
          <div className="step-indicator">
            {[0, 1, 2].map((s) => (
              <div
                key={s}
                className={`dot ${s === step ? 'active' : ''} ${s < step ? 'done' : ''}`}
              />
            ))}
          </div>

          {step === 0 && (
            <StepCuelist
              cueList={cueList}
              onCueListChange={setCueList}
              onNext={() => { trackWizardStep(1); setStep(1); }}
            />
          )}

          {step === 1 && (
            <StepCues
              config={config}
              onCuesInputChange={setCuesInput}
              onBack={() => setStep(0)}
              onNext={() => { trackWizardStep(2); setStep(2); }}
            />
          )}

          {step === 2 && (
            <StepConfirm
              config={config}
              onBack={() => setStep(1)}
              onSingleCueModeChange={setSingleCueMode}
              onIncludeReleaseCueChange={setIncludeReleaseCue}
              midiAccess={midiAccess}
              selectedDestination={selectedDestination}
              midiOutputDeviceName={settings.midiOutputDeviceName}
            />
          )}
        </main>
      )}
      <footer className="app-footer">
        <div className="footer-banner">
          <p>midishowcontrol.com is now free and open for everyone. No account or download required.</p>
        </div>

        <div className="footer-links">
          <p>Prefer a native app?</p>
          <a
            href="https://www.kwallace.com/mscnow"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary"
          >
            MSCNow for macOS
          </a>
          <p>Need to bridge MSC to OSC?</p>
          <a
            href="https://www.kwallace.com/msc2osc"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary"
          >
            MSC2OSC Bridge
          </a>
        </div>

      </footer>
      <CookieBanner />
    </div>
  );
}

export default App;
