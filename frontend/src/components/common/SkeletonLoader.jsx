import React from 'react';
import PropTypes from 'prop-types';
import './SkeletonLoader.css';

/**
 * SkeletonLoader Component - Loading placeholder with shimmer effect
 * @param {string} variant - 'text', 'circle', 'rect', 'card', 'table'
 * @param {number} count - Number of skeleton items
 * @param {string} height - Custom height
 * @param {string} width - Custom width
 */
const SkeletonLoader = ({ 
  variant = 'text',
  count = 1,
  height,
  width,
  className = ''
}) => {
  const renderSkeleton = () => {
    switch (variant) {
      case 'circle':
        return (
          <div 
            className={`skeleton skeleton-circle ${className}`}
            style={{ width: width || '48px', height: height || '48px' }}
          />
        );
      
      case 'rect':
        return (
          <div 
            className={`skeleton skeleton-rect ${className}`}
            style={{ width: width || '100%', height: height || '120px' }}
          />
        );
      
      case 'card':
        return (
          <div className={`skeleton-card ${className}`}>
            <div className="skeleton skeleton-rect" style={{ height: '180px' }} />
            <div className="skeleton-card-body">
              <div className="skeleton skeleton-text" style={{ width: '60%' }} />
              <div className="skeleton skeleton-text" style={{ width: '100%' }} />
              <div className="skeleton skeleton-text" style={{ width: '80%' }} />
            </div>
          </div>
        );
      
      case 'table':
        return (
          <div className={`skeleton-table ${className}`}>
            <div className="skeleton-table-header">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="skeleton skeleton-text" />
              ))}
            </div>
            {[...Array(5)].map((_, rowIndex) => (
              <div key={rowIndex} className="skeleton-table-row">
                {[...Array(4)].map((_, colIndex) => (
                  <div key={colIndex} className="skeleton skeleton-text" />
                ))}
              </div>
            ))}
          </div>
        );
      
      case 'text':
      default:
        return (
          <div 
            className={`skeleton skeleton-text ${className}`}
            style={{ width: width || '100%', height: height || '16px' }}
          />
        );
    }
  };

  if (variant === 'card' || variant === 'table') {
    return renderSkeleton();
  }

  return (
    <>
      {[...Array(count)].map((_, index) => (
        <React.Fragment key={index}>
          {renderSkeleton()}
        </React.Fragment>
      ))}
    </>
  );
};

SkeletonLoader.propTypes = {
  variant: PropTypes.oneOf(['text', 'circle', 'rect', 'card', 'table']),
  count: PropTypes.number,
  height: PropTypes.string,
  width: PropTypes.string,
  className: PropTypes.string
};

export default SkeletonLoader;
