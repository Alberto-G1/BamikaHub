import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FaTimes, FaFileInvoiceDollar, FaTruck, FaWarehouse } from 'react-icons/fa';
import api from '../../api/api.js';
import Select from 'react-select';
import '../../pages/finance/FinanceStyles.css';

const FulfillmentModal = ({ show, handleClose, requisition, onFulfillmentSuccess }) => {
    const [fulfillmentItems, setFulfillmentItems] = useState([]);
    const [inventoryItemOptions, setInventoryItemOptions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [notes, setNotes] = useState('');

    useEffect(() => {
        if (show) {
            setLoading(true);
            const initialItems = requisition.items.map(reqItem => ({
                requisitionItemId: reqItem.id,
                requestedItemName: reqItem.itemName,
                inventoryItemId: null,
                quantityReceived: reqItem.quantity,
                actualUnitCost: reqItem.estimatedUnitCost || '',
            }));
            setFulfillmentItems(initialItems);
            setNotes('');

            const fetchInventoryItems = async () => {
                try {
                    const res = await api.get('/inventory/items');
                    const options = res.data.map(item => ({
                        value: item.id,
                        label: `${item.name} (SKU: ${item.sku})`
                    }));
                    setInventoryItemOptions(options);
                } catch (error) {
                    toast.error("Failed to load inventory items for mapping.");
                    handleClose();
                } finally {
                    setLoading(false);
                }
            };
            fetchInventoryItems();
        }
    }, [show, requisition, handleClose]);

    const handleItemChange = (index, field, value) => {
        const updatedItems = [...fulfillmentItems];
        updatedItems[index][field] = value;
        setFulfillmentItems(updatedItems);
    };

    const handleSubmit = async (fulfillmentType) => {
        if (fulfillmentItems.some(item => !item.inventoryItemId)) {
            toast.error("Please map each requested item to an inventory item.");
            return;
        }

        setSubmitting(true);

        const payload = {
            fulfillmentType,
            notes,
            items: fulfillmentItems.map(item => ({
                requisitionItemId: item.requisitionItemId,
                inventoryItemId: item.inventoryItemId.value,
                quantityReceived: parseInt(item.quantityReceived, 10),
                actualUnitCost: parseFloat(item.actualUnitCost)
            }))
        };

        try {
            await api.post(`/requisitions/${requisition.id}/fulfill`, payload);
            toast.success("Requisition fulfilled successfully!");
            onFulfillmentSuccess();
            handleClose();
        } catch (error) {
            toast.error(error.response?.data?.message || "Fulfillment failed.");
        } finally {
            setSubmitting(false);
        }
    };

    const onExit = () => {
        setFulfillmentItems([]);
        setNotes('');
        setSubmitting(false);
    };

    if (!show || !requisition) return null;

    const totalCost = fulfillmentItems.reduce((acc, item) => {
        const cost = parseFloat(item.actualUnitCost) || 0;
        const quantity = parseInt(item.quantityReceived, 10) || 0;
        return acc + (cost * quantity);
    }, 0);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-UG', {
            style: 'currency',
            currency: 'UGX',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    return (
        <div className="finance-modal" onClick={(e) => {
            if (e.target.className === 'finance-modal') handleClose();
        }}>
            <div className="finance-modal__dialog" style={{ maxWidth: '900px' }}>
                <div className="finance-modal__header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <FaFileInvoiceDollar style={{ fontSize: '1.5rem', color: 'var(--finance-gold)' }} />
                        <div>
                            <h2 className="finance-modal__title">Fulfill Requisition</h2>
                            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem', color: 'var(--finance-text-secondary)' }}>
                                REQ-{String(requisition.id).padStart(4, '0')}
                            </p>
                        </div>
                    </div>
                    <button 
                        type="button" 
                        className="finance-modal__close"
                        onClick={handleClose}
                        disabled={submitting}
                        aria-label="Close modal"
                    >
                        <FaTimes />
                    </button>
                </div>

                <div className="finance-modal__body">
                    {loading ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '3rem 1rem' }}>
                            <span className="finance-spinner" style={{ marginBottom: '1rem' }} />
                            <p style={{ color: 'var(--finance-text-muted)' }}>Loading inventory list...</p>
                        </div>
                    ) : (
                        <div className="finance-form">
                            {/* Items Mapping Section */}
                            <div className="finance-form-section">
                                <h3 className="finance-form-section__title">Item Mapping & Details</h3>
                                
                                <div style={{ overflowX: 'auto' }}>
                                    <table className="finance-table" style={{ minWidth: '800px' }}>
                                        <thead>
                                            <tr>
                                                <th style={{ width: '25%' }}>Requested Item</th>
                                                <th style={{ width: '35%' }}>Map to Inventory Item</th>
                                                <th style={{ width: '15%' }}>Qty Received</th>
                                                <th style={{ width: '25%' }}>Actual Cost (UGX)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {fulfillmentItems.map((item, index) => (
                                                <tr key={item.requisitionItemId}>
                                                    <td>
                                                        <div style={{ fontWeight: '600', color: 'var(--finance-text-primary)' }}>
                                                            {item.requestedItemName}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <Select
                                                            options={inventoryItemOptions}
                                                            value={item.inventoryItemId}
                                                            onChange={selectedOption => handleItemChange(index, 'inventoryItemId', selectedOption)}
                                                            placeholder="Select or search..."
                                                            styles={{ 
                                                                control: (base, state) => ({
                                                                    ...base,
                                                                    border: '1.5px solid var(--finance-border)',
                                                                    borderRadius: '10px',
                                                                    padding: '2px',
                                                                    '&:hover': {
                                                                        borderColor: 'var(--finance-border-strong)'
                                                                    },
                                                                    borderColor: state.isFocused ? 'var(--finance-blue)' : 'var(--finance-border)',
                                                                    boxShadow: state.isFocused ? '0 0 0 3px var(--finance-blue-glow)' : 'none',
                                                                }),
                                                                menu: (base) => ({
                                                                    ...base,
                                                                    zIndex: 9999,
                                                                })
                                                            }}
                                                        />
                                                    </td>
                                                    <td>
                                                        <input
                                                            type="number"
                                                            className="finance-input"
                                                            value={item.quantityReceived}
                                                            onChange={e => handleItemChange(index, 'quantityReceived', e.target.value)}
                                                            min="0"
                                                            style={{ width: '100%' }}
                                                        />
                                                    </td>
                                                    <td>
                                                        <input
                                                            type="number"
                                                            className="finance-input"
                                                            value={item.actualUnitCost}
                                                            onChange={e => handleItemChange(index, 'actualUnitCost', e.target.value)}
                                                            min="0"
                                                            step="100"
                                                            style={{ width: '100%' }}
                                                        />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Total Cost */}
                                <div style={{ 
                                    marginTop: '1.5rem',
                                    padding: '1rem 1.25rem', 
                                    background: 'var(--finance-gold-light)',
                                    border: '1px solid rgba(245, 158, 11, 0.3)',
                                    borderRadius: '12px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <span style={{ fontWeight: '600', color: 'var(--finance-text-primary)' }}>
                                        Total Actual Cost:
                                    </span>
                                    <span style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--finance-gold-hover)' }}>
                                        {formatCurrency(totalCost)}
                                    </span>
                                </div>
                            </div>

                            {/* Notes Section */}
                            <div className="finance-form-section">
                                <h3 className="finance-form-section__title">Additional Notes</h3>
                                <div className="finance-form-group">
                                    <label className="finance-label" htmlFor="fulfillmentNotes">
                                        Notes (e.g., PO Number, Invoice #, Supplier Details)
                                    </label>
                                    <textarea
                                        id="fulfillmentNotes"
                                        className="finance-textarea"
                                        value={notes}
                                        onChange={e => setNotes(e.target.value)}
                                        placeholder="Enter any relevant notes..."
                                        rows={3}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="finance-modal__footer">
                    <button 
                        type="button"
                        className="finance-btn finance-btn--blue"
                        onClick={handleClose}
                        disabled={submitting || loading}
                    >
                        Cancel
                    </button>
                    <button 
                        type="button"
                        className="finance-btn finance-btn--secondary"
                        onClick={() => handleSubmit('FULFILL_AND_ISSUE_TO_PROJECT')}
                        disabled={submitting || loading}
                    >
                        {submitting ? (
                            <>
                                <span className="finance-spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></span>
                                Processing...
                            </>
                        ) : (
                            <>
                                <FaTruck />
                                Fulfill & Issue to Project
                            </>
                        )}
                    </button>
                    <button 
                        type="button"
                        className="finance-btn finance-btn--gold"
                        onClick={() => handleSubmit('RECEIVE_INTO_STOCK')}
                        disabled={submitting || loading}
                    >
                        {submitting ? (
                            <>
                                <span className="finance-spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></span>
                                Processing...
                            </>
                        ) : (
                            <>
                                <FaWarehouse />
                                Receive into Stock
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FulfillmentModal;