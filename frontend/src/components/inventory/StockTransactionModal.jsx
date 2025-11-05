import React, { useEffect, useState } from 'react';
import { FaExchangeAlt, FaInfoCircle, FaTimes } from 'react-icons/fa';
import { toast } from 'react-toastify';
import api from '../../api/api.js';
import '../../pages/inventory/InventoryStyles.css';

const StockTransactionModal = ({ show, handleClose, item, onTransactionSuccess }) => {
    const [transactionType, setTransactionType] = useState('IN');
    const [quantity, setQuantity] = useState('');
    const [unitCost, setUnitCost] = useState('');
    const [reference, setReference] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (show && item) {
            setTransactionType('IN');
            setQuantity('');
            setUnitCost(item.unitPrice || '');
            setReference('');
        }
    }, [show, item]);

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!item) {
            toast.error('Item data missing.');
            return;
        }

        const qty = parseInt(quantity, 10);
        if (!qty || isNaN(qty) || qty <= 0) {
            toast.warn('Please enter a quantity greater than 0.');
            return;
        }

        if (transactionType === 'OUT' && qty > (item.quantity ?? 0)) {
            toast.warn('Insufficient stock for this operation.');
            return;
        }

        if (transactionType === 'IN') {
            const cost = parseFloat(unitCost);
            if (isNaN(cost) || cost < 0) {
                toast.warn('Unit cost must be zero or a positive number.');
                return;
            }
        }

        const payload = {
            itemId: item.id,
            type: transactionType,
            quantity: qty,
            unitCost: transactionType === 'IN' ? parseFloat(unitCost) : 0, // Cost only relevant for 'IN'
            reference: reference?.slice(0, 255),
        };

        try {
            setSubmitting(true);
            await api.post('/inventory/transactions', payload);
            toast.success('Stock transaction recorded successfully!');
            onTransactionSuccess(); // This will trigger a data refresh on the parent page
            handleClose(); // Close the modal
        } catch (error) {
            toast.error(error.response?.data?.message || 'Transaction failed.');
        } finally {
            setSubmitting(false);
        }
    };

    if (!item) return null;

    if (!show) return null;

    const showUnitCost = transactionType === 'IN';
    const quantityLabel = transactionType === 'ADJUSTMENT' ? 'New Total Quantity' : 'Quantity';

    return (
        <div className="inventory-modal inventory-modal--wide" role="dialog" aria-modal="true" aria-labelledby="stock-transaction-title">
            <div className="inventory-modal__overlay" onClick={handleClose} />
            <div className="inventory-modal__dialog">
                <header className="inventory-modal__header">
                    <div>
                        <p className="inventory-banner__eyebrow">Stock Transaction</p>
                        <h3 id="stock-transaction-title" className="inventory-modal__title">Manage Stock for {item.name}</h3>
                    </div>
                    <button type="button" className="inventory-modal__close" onClick={handleClose}>
                        <FaTimes aria-hidden="true" />
                        <span className="sr-only">Close</span>
                    </button>
                </header>

                <form className="inventory-modal__body" onSubmit={handleSubmit}>
                    <section className="inventory-modal__summary">
                        <div>
                            <span className="inventory-meta-label">Current Quantity</span>
                            <span className="inventory-meta-value inventory-meta-value--lg">{item.quantity.toLocaleString()}</span>
                        </div>
                        <div>
                            <span className="inventory-meta-label">Reorder Level</span>
                            <span className="inventory-meta-value">{item.reorderLevel}</span>
                        </div>
                        <div>
                            <span className="inventory-meta-label">Unit Price</span>
                            <span className="inventory-meta-value">{item.unitPrice?.toLocaleString() || '—'}</span>
                        </div>
                    </section>

                    <div className="inventory-form-grid inventory-form-grid--split">
                        <div className="inventory-form-group">
                            <label htmlFor="transactionType">Transaction Type</label>
                            <select
                                id="transactionType"
                                className="inventory-select"
                                value={transactionType}
                                onChange={(event) => setTransactionType(event.target.value)}
                                disabled={submitting}
                            >
                                <option value="IN">Stock In (Receive)</option>
                                <option value="OUT">Stock Out (Issue/Sell)</option>
                                <option value="ADJUSTMENT">Stock Adjustment</option>
                            </select>
                        </div>

                        <div className="inventory-form-group">
                            <label htmlFor="transactionQuantity">{quantityLabel}</label>
                            <input
                                id="transactionQuantity"
                                type="number"
                                min="1"
                                className="inventory-input"
                                value={quantity}
                                onChange={(event) => setQuantity(event.target.value)}
                                required
                                disabled={submitting}
                            />
                        </div>

                        {showUnitCost && (
                            <div className="inventory-form-group">
                                <label htmlFor="transactionUnitCost">Unit Cost (UGX)</label>
                                <input
                                    id="transactionUnitCost"
                                    type="number"
                                    min="0"
                                    className="inventory-input"
                                    value={unitCost}
                                    onChange={(event) => setUnitCost(event.target.value)}
                                    required
                                    disabled={submitting}
                                />
                            </div>
                        )}
                    </div>

                    <div className="inventory-alert inventory-alert--info">
                        <FaInfoCircle aria-hidden="true" />
                        <p>
                            {transactionType === 'ADJUSTMENT'
                                ? 'Use adjustments to correct inventory counts after audits or unexpected events.'
                                : 'Record inbound and outbound movements to maintain accurate stock balances.'}
                        </p>
                    </div>

                    <div className="inventory-form-group inventory-form-group--full">
                        <label htmlFor="transactionReference">Reference / Reason</label>
                        <textarea
                            id="transactionReference"
                            className="inventory-textarea"
                            rows={3}
                            value={reference}
                            onChange={(event) => setReference(event.target.value)}
                            maxLength={255}
                            required
                            disabled={submitting}
                        />
                    </div>

                    <footer className="inventory-modal__footer">
                        <button type="button" className="inventory-secondary-btn" onClick={handleClose} disabled={submitting}>
                            Cancel
                        </button>
                        <button type="submit" className="inventory-primary-btn" disabled={submitting}>
                            <FaExchangeAlt aria-hidden="true" />
                            <span>{submitting ? 'Recording...' : 'Record Transaction'}</span>
                        </button>
                    </footer>
                </form>
            </div>
        </div>
    );
};

export default StockTransactionModal;