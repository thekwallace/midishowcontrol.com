const GA_ID = 'G-G05F636W14';
const CONSENT_KEY = 'mscnow-analytics-consent';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export type ConsentStatus = 'accepted' | 'declined' | null;

export function getConsent(): ConsentStatus {
  return localStorage.getItem(CONSENT_KEY) as ConsentStatus;
}

export function setConsent(status: 'accepted' | 'declined') {
  localStorage.setItem(CONSENT_KEY, status);
  if (status === 'accepted') {
    loadGA();
  }
}

function loadGA() {
  if (window.gtag) return; // already loaded

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer!.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', GA_ID);
}

// Load GA on startup if previously accepted
export function initAnalytics() {
  if (getConsent() === 'accepted') {
    loadGA();
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
