// src/components/common/Alert.jsx
import React from 'react';
import PropTypes from 'prop-types';
import './Alert.css';

/**
 * BamikaHub Alert Component
 * For success, error, warning, info messages
 * 
 * @param {string} variant - 'success', 'error', 'warning', 'info'
 * @param {string} title - Optional alert title
 * @param {ReactNode} children - Alert message content
 * @param {boolean} dismissible - Show close button
 * @param {function} onClose - Close handler
 */
const Alert = ({
  variant = 'info',
  title = null,
  children,
  dismissible = false,
  onClose,
  className = '',
  ...rest
}) => {
  const baseClass = 'alert-bamika';
  const variantClass = `alert-bamika--${variant}`;

  const icons = {
    success: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="2"/>
        <path d="M6 10l3 3 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    error: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="2"/>
        <path d="M7 7l6 6M13 7l-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    warning: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M10 2L2 17h16L10 2z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
        <path d="M10 8v4M10 14h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    info: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="2"/>
        <path d="M10 10v4M10 6h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  };

  return (
    <div className={`${baseClass} ${variantClass} ${className}`} role="alert" {...rest}>
      <div className="alert-bamika__icon">{icons[variant]}</div>
      <div className="alert-bamika__content">
        {title && <div className="alert-bamika__title">{title}</div>}
        <div className="alert-bamika__message">{children}</div>
      </div>
      {dismissible && (
        <button
          className="alert-bamika__close"
          onClick={onClose}
          aria-label="Close alert"
          type="button"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
      )}
    </div>
  );
};

Alert.propTypes = {
  variant: PropTypes.oneOf(['success', 'error', 'warning', 'info']),
  title: PropTypes.string,
  children: PropTypes.node.isRequired,
  dismissible: PropTypes.bool,
  onClose: PropTypes.func,
  className: PropTypes.string,
};

export default Alert;
