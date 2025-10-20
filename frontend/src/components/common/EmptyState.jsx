import React from 'react';
import PropTypes from 'prop-types';
import './EmptyState.css';
import Button from './Button';

/**
 * EmptyState Component - Display when no data is available
 * @param {string} icon - Emoji or icon to display
 * @param {string} title - Main heading
 * @param {string} message - Descriptive message
 * @param {string} actionLabel - CTA button text
 * @param {function} onAction - CTA button handler
 * @param {node} illustration - Custom illustration element
 */
const EmptyState = ({ 
  icon = '📭',
  title,
  message,
  actionLabel,
  onAction,
  illustration,
  className = ''
}) => {
  return (
    <div className={`empty-state ${className}`}>
      <div className="empty-state-content">
        {illustration ? (
          <div className="empty-state-illustration">{illustration}</div>
        ) : (
          <div className="empty-state-icon">{icon}</div>
        )}
        
        {title && <h3 className="empty-state-title">{title}</h3>}
        {message && <p className="empty-state-message">{message}</p>}
        
        {actionLabel && onAction && (
          <div className="empty-state-action">
            <Button variant="primary" onClick={onAction}>
              {actionLabel}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

EmptyState.propTypes = {
  icon: PropTypes.string,
  title: PropTypes.string,
  message: PropTypes.string,
  actionLabel: PropTypes.string,
  onAction: PropTypes.func,
  illustration: PropTypes.node,
  className: PropTypes.string
};

export default EmptyState;
