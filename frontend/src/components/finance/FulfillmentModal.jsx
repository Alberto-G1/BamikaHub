import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, Table, Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';
import api from '../../api/api.js';
import Select from 'react-select';

const FulfillmentModal = ({ show, handleClose, requisition, onFulfillmentSuccess }) => {
    const [fulfillmentItems, setFulfillmentItems] = useState([]);
    const [inventoryItemOptions, setInventoryItemOptions] = useState([]);
    const [loading, setLoading] = useState(false);
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
        }
    };

    if (!requisition) return null;

    return (
        <Modal show={show} onHide={handleClose} size="xl" centered>
            <Modal.Header closeButton>
                <Modal.Title>Fulfill Requisition REQ-{String(requisition.id).padStart(4, '0')}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {loading ? (
                     <div className="text-center p-5"><Spinner animation="border" /> <p className="mt-2">Loading inventory list...</p></div>
                ) : (
                    <Form>
                        <Table bordered responsive>
                            <thead>
                                <tr>
                                    <th>Requested Item</th>
                                    <th>Map to Inventory Item</th>
                                    <th style={{width: '120px'}}>Qty Received</th>
                                    <th style={{width: '180px'}}>Actual Unit Cost (UGX)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {fulfillmentItems.map((item, index) => (
                                    <tr key={item.requisitionItemId}>
                                        <td className="align-middle">{item.requestedItemName}</td>
                                        <td>
                                            <Select
                                                options={inventoryItemOptions}
                                                value={item.inventoryItemId}
                                                onChange={selectedOption => handleItemChange(index, 'inventoryItemId', selectedOption)}
                                                placeholder="Select or search for an item..."
                                                menuPortalTarget={document.body}
                                                styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                            />
                                        </td>
                                        <td>
                                            <Form.Control
                                                type="number"
                                                value={item.quantityReceived}
                                                onChange={e => handleItemChange(index, 'quantityReceived', e.target.value)}
                                                min="0"
                                            />
                                        </td>
                                        <td>
                                            <Form.Control
                                                type="number"
                                                value={item.actualUnitCost}
                                                onChange={e => handleItemChange(index, 'actualUnitCost', e.target.value)}
                                                min="0"
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                        <Form.Group className="mt-3">
                            <Form.Label>Notes (e.g., PO Number, Invoice #)</Form.Label>
                            <Form.Control as="textarea" rows={2} value={notes} onChange={e => setNotes(e.target.value)} />
                        </Form.Group>
                    </Form>
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}>Cancel</Button>
                <Button variant="info" onClick={() => handleSubmit('FULFILL_AND_ISSUE_TO_PROJECT')}>
                    Fulfill & Issue to Project
                </Button>
                <Button variant="success" onClick={() => handleSubmit('RECEIVE_INTO_STOCK')}>
                    Receive into Stock
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default FulfillmentModal;