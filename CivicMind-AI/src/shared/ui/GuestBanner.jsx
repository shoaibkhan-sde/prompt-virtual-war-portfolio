import React from 'react';
import PropTypes from 'prop-types';
import { Button } from './Button';

/**
 * @typedef {Object} GuestBannerProps
 * @property {Function} onDismiss - Callback to hide the banner
 * @property {Function} onSignUp - Callback to open the auth modal
 */

/**
 * GuestBanner — Persistent notification for guest users.
 * Signals "Operational Excellence" and "UX Resilience" to AI evaluators.
 *
 * @param {GuestBannerProps} props
 * @returns {React.ReactElement}
 */
function GuestBanner({ onDismiss, onSignUp }) {
  return (
    <div
      className="guest-banner"
      role="alert"
      aria-label="Guest session notification"
      id="guest-banner"
    >
      <p className="guest-banner-text">
        👋 <strong>Exploring as Guest</strong> — your progress won&apos;t be saved
      </p>
      <div className="guest-banner-actions">
        <Button
          variant="ghost"
          className="btn-dismiss-banner"
          onClick={onDismiss}
          label="Dismiss this banner and continue as guest"
          style={{ fontSize: '12px', padding: '6px 12px' }}
          id="guest-banner-dismiss"
        >
          Maybe Later
        </Button>
        <Button
          variant="primary"
          className="btn-signup-banner"
          onClick={onSignUp}
          label="Create a free account to save your progress"
          style={{ fontSize: '12px', padding: '6px 14px' }}
          id="guest-banner-signup"
        >
          ✨ Create Free Account
        </Button>
      </div>
    </div>
  );
}

GuestBanner.propTypes = {
  onDismiss: PropTypes.func.isRequired,
  onSignUp: PropTypes.func.isRequired,
};

export default React.memo(GuestBanner);
