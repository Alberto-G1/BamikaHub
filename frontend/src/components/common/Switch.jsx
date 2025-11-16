import React from 'react';
import './Switch.css';

const Switch = ({ checked, onChange, disabled = false, className = '' }) => {
    const handleClick = () => {
        if (!disabled && onChange) {
            onChange(!checked);
        }
    };

    return (
        <div
            className={`switch ${checked ? 'checked' : ''} ${disabled ? 'disabled' : ''} ${className}`}
            onClick={handleClick}
            role="switch"
            aria-checked={checked}
            tabIndex={disabled ? -1 : 0}
            onKeyDown={(e) => {
                if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    onChange(!checked);
                }
            }}
        >
            <div className="switch-slider">
                <div className="switch-knob"></div>
            </div>
        </div>
    );
};

export default Switch;