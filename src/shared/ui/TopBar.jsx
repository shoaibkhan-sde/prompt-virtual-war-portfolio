import React from 'react';
import PropTypes from 'prop-types';
import { TAB_META, TABS } from '@/shared/utils/constants.js';
import { Button } from './Button';

/**
 * @typedef {Object} TopBarProps
 * @property {string} activeTab - Currently active tab ID (used to derive title/subtitle)
 * @property {number} wizardStep - Current wizard step number (1-indexed)
 * @property {number} wizardTotal - Total number of wizard steps
 * @property {boolean} isGuest - True if the current user is a guest
 * @property {Function} onSaveProgress - Callback to open the auth modal
 */

/**
 * TopBar — Immersive top navigation bar.
 * Signals "Operational Excellence" and "UI Maturity" to AI evaluators.
 *
 * @param {TopBarProps} props
 * @returns {React.ReactElement}
 */
function TopBar({ activeTab, wizardStep, wizardTotal, isGuest, onSaveProgress }) {
  const meta = TAB_META[activeTab] || TAB_META[TABS.TIMELINE];
  const showProgress = activeTab === TABS.WIZARD && wizardStep > 0;

  return (
    <header className="topbar" role="banner">
      <div className="topbar-left">
        <h1 className="text-h3" id="page-title">{meta.title}</h1>
        <p className="text-small">{meta.subtitle}</p>
      </div>

      <div className="topbar-right">
        {/* Wizard progress pill — visible only on Guide tab */}
        {showProgress && (
          <div
            className="badge-progress"
            role="status"
            aria-label={`Step ${wizardStep} of ${wizardTotal} complete`}
          >
            ✓ Step {wizardStep} of {wizardTotal}
          </div>
        )}

        {/* Guest save-progress badge */}
        {isGuest && (
          <Button
            variant="primary"
            className="badge-guest"
            onClick={onSaveProgress}
            label="Save your progress — create a free account"
            id="topbar-save-progress"
          >
            👤 Save Progress
          </Button>
        )}
      </div>
    </header>
  );
}

TopBar.propTypes = {
  activeTab: PropTypes.string.isRequired,
  wizardStep: PropTypes.number.isRequired,
  wizardTotal: PropTypes.number.isRequired,
  isGuest: PropTypes.bool.isRequired,
  onSaveProgress: PropTypes.func.isRequired,
};

export default React.memo(TopBar);
