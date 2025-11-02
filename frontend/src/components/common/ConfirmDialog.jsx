import React from 'react';
import PropTypes from 'prop-types';
import './ConfirmDialog.css';

const ConfirmDialog = ({
    open,
    tone = 'neutral',
    title,
    message,
    detail,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    onConfirm,
    onCancel,
}) => {
    if (!open) {
        return null;
    }

    const toneClass = `confirm-dialog--${tone}`;

    return (
        <div className="confirm-dialog-backdrop" role="dialog" aria-modal="true">
            <div className={`confirm-dialog ${toneClass}`} data-animate="dialog">
                <button
                    type="button"
                    className="confirm-dialog__close"
                    onClick={onCancel}
                    aria-label="Close dialog"
                >
                    ×
                </button>

                <div className="confirm-dialog__header">
                    <span className="confirm-dialog__eyebrow">Action Required</span>
                    <h4>{title}</h4>
                </div>

                <div className="confirm-dialog__body">
                    <p className="confirm-dialog__message">{message}</p>
                    {detail && <p className="confirm-dialog__detail">{detail}</p>}
                </div>

                <div className="confirm-dialog__actions">
                    <button
                        type="button"
                        className="confirm-dialog__btn confirm-dialog__btn--ghost"
                        onClick={onCancel}
                    >
                        {cancelLabel}
                    </button>
                    <button
                        type="button"
                        className="confirm-dialog__btn confirm-dialog__btn--accent"
                        onClick={onConfirm}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};

ConfirmDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    tone: PropTypes.oneOf(['neutral', 'warn', 'danger', 'success']),
    title: PropTypes.string.isRequired,
    message: PropTypes.string.isRequired,
    detail: PropTypes.string,
    confirmLabel: PropTypes.string,
    cancelLabel: PropTypes.string,
    onConfirm: PropTypes.func,
    onCancel: PropTypes.func,
};

export default ConfirmDialog;
