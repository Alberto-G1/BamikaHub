import React, { useState } from 'react';
import { Modal, Button, Form, Row, Col } from 'react-bootstrap';
import { toast } from 'react-toastify';
import api from '../../api/api.js';

const StockTransactionModal = ({ show, handleClose, item, onTransactionSuccess }) => {
    const [transactionType, setTransactionType] = useState('IN');
    const [quantity, setQuantity] = useState('');
    const [unitCost, setUnitCost] = useState('');
    const [reference, setReference] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        const payload = {
            itemId: item.id,
            type: transactionType,
            quantity: parseInt(quantity, 10),
            unitCost: transactionType === 'IN' ? parseFloat(unitCost) : 0, // Cost only relevant for 'IN'
            reference: reference,
        };

        try {
            await api.post('/inventory/transactions', payload);
            toast.success('Stock transaction recorded successfully!');
            onTransactionSuccess(); // This will trigger a data refresh on the parent page
            handleClose(); // Close the modal
        } catch (error) {
            toast.error(error.response?.data?.message || 'Transaction failed.');
        }
    };
    
    // Reset form when modal is closed/reopened
    const handleEnter = () => {
        setTransactionType('IN');
        setQuantity('');
        setUnitCost(item.unitPrice || '');
        setReference('');
    };

    if (!item) return null;

    return (
        <Modal show={show} onHide={handleClose} onEnter={handleEnter} centered>
            <Modal.Header closeButton>
                <Modal.Title>Manage Stock for: {item.name}</Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleSubmit}>
                <Modal.Body>
                    <div className="mb-3">
                        <strong>Current Quantity:</strong> {item.quantity.toLocaleString()}
                    </div>
                    <Form.Group className="mb-3">
                        <Form.Label>Transaction Type</Form.Label>
                        <Form.Select value={transactionType} onChange={e => setTransactionType(e.target.value)}>
                            <option value="IN">Stock In (Receive)</option>
                            <option value="OUT">Stock Out (Issue/Sell)</option>
                            <option value="ADJUSTMENT">Stock Adjustment</option>
                        </Form.Select>
                    </Form.Group>
                    <Row>
                        <Col>
                            <Form.Group className="mb-3">
                                <Form.Label>
                                    {transactionType === 'ADJUSTMENT' ? 'New Total Quantity' : 'Quantity'}
                                </Form.Label>
                                <Form.Control type="number" value={quantity} onChange={e => setQuantity(e.target.value)} required min="0" />
                            </Form.Group>
                        </Col>
                        {transactionType === 'IN' && (
                            <Col>
                                <Form.Group className="mb-3">
                                    <Form.Label>Unit Cost (UGX)</Form.Label>
                                    <Form.Control type="number" value={unitCost} onChange={e => setUnitCost(e.target.value)} required min="0" />
                                </Form.Group>
                            </Col>
                        )}
                    </Row>
                    <Form.Group className="mb-3">
                        <Form.Label>Reference / Reason</Form.Label>
                        <Form.Control as="textarea" rows={2} value={reference} onChange={e => setReference(e.target.value)} required />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose}>Cancel</Button>
                    <Button variant="primary" type="submit">Record Transaction</Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
};

export default StockTransactionModal;