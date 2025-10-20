// src/components/common/Card.jsx
import React from 'react';
import PropTypes from 'prop-types';
import './Card.css';

/**
 * BamikaHub Card Component
 * Unified card container with optional header and footer
 * 
 * @param {string} variant - 'default', 'bordered', 'elevated'
 * @param {ReactNode} header - Optional header content
 * @param {ReactNode} footer - Optional footer content
 * @param {ReactNode} children - Card body content
 * @param {string} className - Additional CSS classes
 */
const Card = ({
  variant = 'default',
  header = null,
  footer = null,
  children,
  className = '',
  ...rest
}) => {
  const baseClass = 'card-bamika';
  const variantClass = `card-bamika--${variant}`;

  return (
    <div className={`${baseClass} ${variantClass} ${className}`} {...rest}>
      {header && <div className="card-bamika__header">{header}</div>}
      <div className="card-bamika__body">{children}</div>
      {footer && <div className="card-bamika__footer">{footer}</div>}
    </div>
  );
};

Card.propTypes = {
  variant: PropTypes.oneOf(['default', 'bordered', 'elevated']),
  header: PropTypes.node,
  footer: PropTypes.node,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

export default Card;
