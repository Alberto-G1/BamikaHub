// src/components/common/Modal.jsx
import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import './Modal.css';

/**
 * BamikaHub Modal Component
 * Accessible modal dialog
 * 
 * @param {boolean} isOpen - Control modal visibility
 * @param {function} onClose - Close handler
 * @param {string} title - Modal title
 * @param {string} size - 'sm', 'md', 'lg', 'xl'
 * @param {ReactNode} children - Modal body content
 * @param {ReactNode} footer - Optional footer with actions
 */
const Modal = ({
  isOpen = false,
  onClose,
  title,
  size = 'md',
  children,
  footer = null,
  className = '',
  ...rest
}) => {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClass = `modal-bamika__dialog--${size}`;

  return (
    <div className="modal-bamika" role="dialog" aria-modal="true" aria-labelledby="modal-title" {...rest}>
      <div className="modal-bamika__backdrop" onClick={onClose} />
      <div className={`modal-bamika__dialog ${sizeClass} ${className}`}>
        <div className="modal-bamika__header">
          <h2 id="modal-title" className="modal-bamika__title">{title}</h2>
          <button
            className="modal-bamika__close"
            onClick={onClose}
            aria-label="Close modal"
            type="button"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
        <div className="modal-bamika__body">{children}</div>
        {footer && <div className="modal-bamika__footer">{footer}</div>}
      </div>
    </div>
  );
};

Modal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl']),
  children: PropTypes.node.isRequired,
  footer: PropTypes.node,
  className: PropTypes.string,
};

export default Modal;
