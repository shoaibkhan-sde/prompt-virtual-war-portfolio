import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

/**
 * Renders a small, non-obtrusive toast for XP gains.
 */
export default function XPToast({ amount, onComplete }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onComplete, 300);
    }, 2500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className={`xp-toast ${visible ? 'show' : ''} ${amount < 0 ? 'negative' : ''}`}>
      <span className="xp-toast-icon">⚡</span>
      <span className="xp-toast-amount">{amount > 0 ? `+${amount}` : amount} XP</span>
    </div>
  );
}

XPToast.propTypes = {
  amount: PropTypes.number.isRequired,
  onComplete: PropTypes.func.isRequired,
};
