import { useState } from 'react';
import { getConsent, setConsent } from '../services/analytics';

export function CookieBanner() {
  const [visible, setVisible] = useState(getConsent() === null);

  if (!visible) return null;

  const handleAccept = () => {
    setConsent('accepted');
    setVisible(false);
  };

  const handleDecline = () => {
    setConsent('declined');
    setVisible(false);
  };

  return (
    <div className="cookie-banner">
      <p>This site uses cookies for anonymous usage analytics.</p>
      <div className="cookie-actions">
        <button onClick={handleAccept} className="btn btn-primary btn-small">Accept</button>
        <button onClick={handleDecline} className="btn btn-small">Decline</button>
      </div>
    </div>
  );
}
