/**
 * SAGEOwl — Animated owl mascot with contextual emotional states.
 * States: idle | happy | sad | thinking | celebrating
 */
import React from 'react';
import PropTypes from 'prop-types';

const EXPRESSIONS = {
  idle:        { body: '🦉', glow: 'none',                       animation: '' },
  happy:       { body: '🦉', glow: '0 0 20px rgba(251,191,36,0.6)', animation: 'owl-bounce 0.6s ease infinite alternate' },
  sad:         { body: '🦉', glow: '0 0 16px rgba(239,68,68,0.4)', animation: 'owl-shake 0.5s ease' },
  thinking:    { body: '🦉', glow: 'none',                       animation: 'owl-pulse 1.5s ease infinite' },
  celebrating: { body: '🦉', glow: '0 0 32px rgba(251,191,36,0.8)', animation: 'owl-celebrate 0.7s ease infinite alternate' },
};

function SAGEOwl({ state = 'idle', size = 40, className = '' }) {
  const expr = EXPRESSIONS[state] || EXPRESSIONS.idle;

  return (
    <span
      className={`sage-owl sage-owl--${state} ${className}`}
      style={{
        fontSize: size,
        display: 'inline-block',
        filter: state !== 'idle' ? `drop-shadow(${expr.glow})` : 'none',
        animation: expr.animation,
        userSelect: 'none',
        lineHeight: 1,
        transition: 'filter 0.3s ease',
      }}
      role="img"
      aria-label={`SAGE owl assistant — currently ${state}`}
    >
      <span aria-hidden="true">{expr.body}</span>
    </span>
  );
}

SAGEOwl.propTypes = {
  state: PropTypes.oneOf(['idle', 'happy', 'sad', 'thinking', 'celebrating']),
  size: PropTypes.number,
  className: PropTypes.string,
};

export default SAGEOwl;
