// src/components/common/Input.jsx
import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';
import './Input.css';

/**
 * BamikaHub Input Component
 * Unified form input with validation states
 * 
 * @param {string} label - Input label
 * @param {string} type - HTML input type
 * @param {string} error - Error message
 * @param {string} helperText - Helper text below input
 * @param {boolean} required - Required field indicator
 * @param {boolean} disabled - Disabled state
 * @param {string} icon - Optional icon element
 */
const Input = forwardRef(({
  label,
  type = 'text',
  error = null,
  helperText = null,
  required = false,
  disabled = false,
  icon = null,
  className = '',
  ...rest
}, ref) => {
  const hasError = !!error;
  const inputClass = `input-bamika__field ${hasError ? 'input-bamika__field--error' : ''} ${icon ? 'input-bamika__field--with-icon' : ''}`;

  return (
    <div className={`input-bamika ${className}`}>
      {label && (
        <label className="input-bamika__label">
          {label}
          {required && <span className="input-bamika__required" aria-label="Required">*</span>}
        </label>
      )}
      <div className="input-bamika__wrapper">
        {icon && <div className="input-bamika__icon">{icon}</div>}
        <input
          ref={ref}
          type={type}
          className={inputClass}
          disabled={disabled}
          aria-invalid={hasError}
          aria-describedby={error ? 'input-error' : helperText ? 'input-helper' : undefined}
          {...rest}
        />
        {hasError && (
          <div className="input-bamika__error-icon" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M8 4v4M8 10h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
        )}
      </div>
      {error && (
        <div id="input-error" className="input-bamika__error" role="alert">
          {error}
        </div>
      )}
      {!error && helperText && (
        <div id="input-helper" className="input-bamika__helper">
          {helperText}
        </div>
      )}
    </div>
  );
});

Input.displayName = 'Input';

Input.propTypes = {
  label: PropTypes.string,
  type: PropTypes.string,
  error: PropTypes.string,
  helperText: PropTypes.string,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  icon: PropTypes.node,
  className: PropTypes.string,
};

export default Input;
