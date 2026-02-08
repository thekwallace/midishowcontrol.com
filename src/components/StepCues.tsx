import { useRef, useEffect } from 'react';
import { inputHint, detectInputType, type CueGeneratorConfig } from '../models/cueGenerator';

interface Props {
  config: CueGeneratorConfig;
  onCuesInputChange: (value: string) => void;
  onBack: () => void;
  onNext: () => void;
}

export function StepCues({ config, onCuesInputChange, onBack, onNext }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && detectInputType(config.cuesInput, config.singleCueMode)) {
      onNext();
    }
  };

  const hint = inputHint(config);
  const hasInput = !!detectInputType(config.cuesInput, config.singleCueMode);

  return (
    <div className="step">
      <div className="step-header">
        <button onClick={onBack} className="btn btn-back">← Cuelist {config.cueList}</button>
      </div>
      <h2>What cue numbers should be included?</h2>
      <p className="input-hint">Enter a number for a sequential range (e.g. 10 = cues 1–10), or list specific cues separated by commas.</p>
      <input
        ref={inputRef}
        type="text"
        placeholder="e.g. 10 or 1, 5, 10"
        value={config.cuesInput}
        onChange={(e) => onCuesInputChange(e.target.value)}
        onKeyDown={handleKeyDown}
        className="step-input"
      />
      {hint && <p className="input-hint">{hint}</p>}
      <div className="step-actions">
        <button
          onClick={onNext}
          disabled={!hasInput}
          className="btn btn-primary"
        >
          Next
        </button>
      </div>
    </div>
  );
}
