// src/components/common/Badge.jsx
import React from 'react';
import PropTypes from 'prop-types';
import './Badge.css';

/**
 * BamikaHub Badge Component
 * Status indicators, notification counts, labels
 * 
 * @param {string} variant - 'primary', 'secondary', 'success', 'danger', 'warning', 'info'
 * @param {string} size - 'sm', 'md', 'lg'
 * @param {ReactNode} children - Badge content
 */
const Badge = ({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  ...rest
}) => {
  const baseClass = 'badge-bamika';
  const variantClass = `badge-bamika--${variant}`;
  const sizeClass = `badge-bamika--${size}`;

  return (
    <span
      className={`${baseClass} ${variantClass} ${sizeClass} ${className}`}
      {...rest}
    >
      {children}
    </span>
  );
};

Badge.propTypes = {
  variant: PropTypes.oneOf(['primary', 'secondary', 'success', 'danger', 'warning', 'info']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

export default Badge;
