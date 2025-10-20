// src/components/common/Button.jsx
import React from 'react';
import PropTypes from 'prop-types';
import './Button.css';

/**
 * BamikaHub Button Component
 * Unified button with variants and theme support
 * 
 * @param {string} variant - 'primary', 'secondary', 'outline', 'danger'
 * @param {string} size - 'sm', 'md', 'lg'
 * @param {boolean} disabled - Disabled state
 * @param {boolean} loading - Show loading spinner
 * @param {boolean} fullWidth - Make button full width
 * @param {ReactNode} icon - Optional icon element
 * @param {ReactNode} children - Button text/content
 * @param {function} onClick - Click handler
 * @param {string} type - HTML button type ('button', 'submit', 'reset')
 * @param {string|React.Component} as - Render as different element (e.g., Link)
 */
const Button = ({
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  icon = null,
  children,
  onClick,
  type = 'button',
  className = '',
  as: Component = 'button',
  ...rest
}) => {
  const baseClass = 'btn-bamika';
  const variantClass = `btn-bamika--${variant}`;
  const sizeClass = `btn-bamika--${size}`;
  const loadingClass = loading ? 'btn-bamika--loading' : '';
  const fullWidthClass = fullWidth ? 'btn-bamika--full-width' : '';

  return (
    <Component
      type={Component === 'button' ? type : undefined}
      className={`${baseClass} ${variantClass} ${sizeClass} ${loadingClass} ${fullWidthClass} ${className}`.trim()}
      disabled={disabled || loading}
      onClick={onClick}
      aria-busy={loading}
      {...rest}
    >
      {loading && (
        <span className="btn-bamika__spinner" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="60" strokeDashoffset="15">
              <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.8s" repeatCount="indefinite" />
            </circle>
          </svg>
        </span>
      )}
      {icon && <span className="btn-bamika__icon">{icon}</span>}
      <span className="btn-bamika__text">{children}</span>
    </Component>
  );
};

Button.propTypes = {
  variant: PropTypes.oneOf(['primary', 'secondary', 'outline', 'danger']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  fullWidth: PropTypes.bool,
  icon: PropTypes.node,
  children: PropTypes.node.isRequired,
  onClick: PropTypes.func,
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  className: PropTypes.string,
};

export default Button;
