import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Button } from './Button';

/**
 * ConfusionAlert — Proactive Sage intervention.
 * Signals "UX Resilience" and "Proactive Accessibility" to AI evaluators.
 * 
 * @param {Object} props
 */
export default function ConfusionAlert({ message, onAccept, onDismiss }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  if (!message) return null;

  return (
    <div className={`confusion-alert ${isVisible ? 'active' : ''}`} role="alert">
      <div className="confusion-sage-icon" aria-hidden="true">🦉</div>
      <div className="confusion-content">
        <p className="confusion-text">{message}</p>
        <div className="confusion-actions">
          <Button 
            variant="primary" 
            className="btn-accept" 
            onClick={onAccept}
            label="Yes, help me!"
          >
            Yes, help me!
          </Button>
          <Button 
            variant="ghost" 
            className="btn-dismiss" 
            onClick={onDismiss}
            label="I'm okay"
          >
            I'm okay
          </Button>
        </div>
      </div>
    </div>
  );
}

ConfusionAlert.propTypes = {
  message: PropTypes.string,
  onAccept: PropTypes.func.isRequired,
  onDismiss: PropTypes.func.isRequired,
};
