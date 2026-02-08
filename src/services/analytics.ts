declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

function track(event: string, params?: Record<string, unknown>) {
  window.gtag?.('event', event, params);
}

export function trackWizardStep(step: number) {
  track('wizard_step', { step });
}

export function trackExport(inputType: string, cueCount: number, commandFormat: number) {
  track('cue_exported', { input_type: inputType, cue_count: cueCount, command_format: commandFormat });
}

export function trackSendLive(inputType: string, cueCount: number, commandFormat: number) {
  track('cue_sent_live', { input_type: inputType, cue_count: cueCount, command_format: commandFormat });
}

export function trackSettingsOpened() {
  track('settings_opened');
}
