// src/components/common/Spinner.jsx
import React from 'react';
import PropTypes from 'prop-types';
import './Spinner.css';

/**
 * BamikaHub Spinner Component
 * Loading indicator
 * 
 * @param {string} size - 'sm', 'md', 'lg'
 * @param {string} color - 'primary', 'secondary', 'white'
 * @param {string} text - Optional loading text
 */
const Spinner = ({
  size = 'md',
  color = 'primary',
  text = null,
  className = '',
  ...rest
}) => {
  const baseClass = 'spinner-bamika';
  const sizeClass = `spinner-bamika--${size}`;
  const colorClass = `spinner-bamika--${color}`;

  return (
    <div className={`spinner-bamika-wrapper ${className}`} {...rest}>
      <div className={`${baseClass} ${sizeClass} ${colorClass}`} role="status" aria-label="Loading">
        <svg viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
          <circle
            cx="25"
            cy="25"
            r="20"
            fill="none"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </svg>
      </div>
      {text && <div className="spinner-bamika__text">{text}</div>}
    </div>
  );
};

Spinner.propTypes = {
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  color: PropTypes.oneOf(['primary', 'secondary', 'white']),
  text: PropTypes.string,
  className: PropTypes.string,
};

export default Spinner;
