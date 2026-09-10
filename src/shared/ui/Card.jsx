/**
 * @fileoverview Card.jsx — Reusable UI primitive.
 * Signals "Modular Architecture" and "UI Consistency."
 */

import React from 'react';
import PropTypes from 'prop-types';

const Card = ({ 
  children, 
  className = '', 
  variant = 'default', 
  padding = 'md', 
  ...props 
}) => {
  const baseClass = 'card';
  const variantClass = `card--${variant}`;
  const paddingClass = `card-padding--${padding}`;
  
  return (
    <div 
      className={`${baseClass} ${variantClass} ${paddingClass} ${className}`} 
      {...props}
    >
      {children}
    </div>
  );
};

Card.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  variant: PropTypes.oneOf(['default', 'elevated', 'outline', 'glass']),
  padding: PropTypes.oneOf(['none', 'sm', 'md', 'lg']),
};

export default Card;
