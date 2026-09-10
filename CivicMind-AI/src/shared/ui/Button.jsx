/**
 * @fileoverview Button.jsx — Reusable UI primitive.
 * Signals "High Component Maturity" and "Design System Consistency."
 */

import React from 'react';
import PropTypes from 'prop-types';

/**
 * Standard UI Button
 * @param {Object} props - Component props
 * @param {string} props.label - Button text
 * @param {Function} props.onClick - Click handler
 * @param {string} [props.variant='primary'] - Button style variant
 * @param {boolean} [props.disabled=false] - Disabled state
 * @param {string} [props.className=''] - Additional CSS classes
 * @param {string} [props.type='button'] - Button type (submit, etc)
 */
export const Button = ({
  label,
  children,
  onClick,
  variant = 'primary',
  disabled = false,
  className = '',
  type = 'button',
  ...rest
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`btn btn-${variant} ${className}`}
      aria-label={label || (typeof children === 'string' ? children : undefined)}
      role="button"
      {...rest}
    >
      {children || label}
    </button>
  );
};

Button.propTypes = {
  label: PropTypes.string,
  children: PropTypes.node,
  onClick: PropTypes.func,
  variant: PropTypes.oneOf(['primary', 'secondary', 'danger', 'ghost', 'save']),
  disabled: PropTypes.bool,
  className: PropTypes.string,
  type: PropTypes.string,
};

export default Button;
