import { useRef, useEffect } from 'react';

interface Props {
  cueList: string;
  onCueListChange: (value: string) => void;
  onNext: () => void;
}

export function StepCuelist({ cueList, onCueListChange, onNext }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && cueList.trim()) {
      onNext();
    }
  };

  return (
    <div className="step">
      <h2>What cuelist number are we using?</h2>
      <p className="input-hint">The cuelist number on your console that will receive the cues.</p>
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        placeholder="Cuelist number"
        value={cueList}
        onChange={(e) => onCueListChange(e.target.value)}
        onKeyDown={handleKeyDown}
        className="step-input"
      />
      <div className="step-actions">
        <button
          onClick={onNext}
          disabled={!cueList.trim()}
          className="btn btn-primary"
        >
          Next
        </button>
      </div>
    </div>
  );
}
