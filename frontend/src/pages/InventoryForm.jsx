import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Form, Button, Card, Container, Spinner, Row, Col } from 'react-bootstrap';
import api from '../api/api.js';
import { toast } from 'react-toastify';

const InventoryForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditMode = Boolean(id);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: '', sku: '', category: '', description: '',
        quantity: 0, reorderLevel: 0, unitPrice: '',
        supplierId: '', location: '', isActive: true, version: 0
    });
    
    // You'll need to fetch suppliers to populate a dropdown
    const [suppliers, setSuppliers] = useState([]);

    useEffect(() => {
        // Fetch suppliers for the dropdown
        api.get('/suppliers').then(res => setSuppliers(res.data));

        if (isEditMode) {
            setLoading(true);
            api.get(`/inventory/items/${id}`) // <-- NOTE: We need to create this backend endpoint
                .then(res => {
                    setFormData({ ...res.data, supplierId: res.data.supplier?.id || '' });
                })
                .catch(() => toast.error('Failed to load item data.'))
                .finally(() => setLoading(false));
        }
    }, [id, isEditMode]);

    const handleFormChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEditMode) {
                await api.put(`/inventory/items/${id}`, formData); // <-- NOTE: We need to create this endpoint
                toast.success("Item updated successfully!");
            } else {
                await api.post('/inventory/items', formData);
                toast.success("Item created successfully!");
            }
            navigate('/inventory');
        } catch (err) {
            toast.error(err.response?.data?.message || "An error occurred.");
        }
    };

    if (loading) return <Spinner animation="border" />;

    return (
        <Container>
            <Card className="shadow-sm">
                <Card.Header as="h3">{isEditMode ? 'Edit Item' : 'Create New Inventory Item'}</Card.Header>
                <Card.Body>
                    <Form onSubmit={handleSubmit}>
                        <Row>
                            <Col md={8}><Form.Group className="mb-3">
                                <Form.Label>Item Name</Form.Label>
                                <Form.Control name="name" value={formData.name} onChange={handleFormChange} required />
                            </Form.Group></Col>
                            <Col md={4}><Form.Group className="mb-3">
                                <Form.Label>SKU (Stock Keeping Unit)</Form.Label>
                                <Form.Control name="sku" value={formData.sku} onChange={handleFormChange} required />
                            </Form.Group></Col>
                        </Row>
                        <Row>
                             <Col md={6}><Form.Group className="mb-3">
                                <Form.Label>Category</Form.Label>
                                <Form.Control name="category" value={formData.category} onChange={handleFormChange} required />
                            </Form.Group></Col>
                            <Col md={6}><Form.Group className="mb-3">
                                <Form.Label>Unit Price (UGX)</Form.Label>
                                <Form.Control type="number" name="unitPrice" value={formData.unitPrice} onChange={handleFormChange} required min="0" />
                            </Form.Group></Col>
                        </Row>
                         <Form.Group className="mb-3">
                            <Form.Label>Description</Form.Label>
                            <Form.Control as="textarea" rows={3} name="description" value={formData.description} onChange={handleFormChange} />
                        </Form.Group>
                        <Row>
                            <Col md={6}><Form.Group className="mb-3">
                                <Form.Label>Initial Quantity</Form.Label>
                                <Form.Control type="number" name="quantity" value={formData.quantity} onChange={handleFormChange} required min="0" disabled={isEditMode} />
                                {isEditMode && <Form.Text className="text-muted">Quantity must be changed via Stock Transactions.</Form.Text>}
                            </Form.Group></Col>
                            <Col md={6}><Form.Group className="mb-3">
                                <Form.Label>Re-Order Level</Form.Label>
                                <Form.Control type="number" name="reorderLevel" value={formData.reorderLevel} onChange={handleFormChange} required min="0" />
                            </Form.Group></Col>
                        </Row>
                        <Row>
                             <Col md={6}><Form.Group className="mb-3">
                                <Form.Label>Supplier</Form.Label>
                                <Form.Select name="supplierId" value={formData.supplierId} onChange={handleFormChange}>
                                    <option value="">No Supplier</option>
                                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </Form.Select>
                            </Form.Group></Col>
                             <Col md={6}><Form.Group className="mb-3">
                                <Form.Label>Location</Form.Label>
                                <Form.Control name="location" value={formData.location} onChange={handleFormChange} />
                            </Form.Group></Col>
                        </Row>
                        <Form.Check type="switch" id="is-active-switch" name="isActive" label="Item is Active" checked={formData.isActive} onChange={handleFormChange} className="mb-3" />
                        <Button variant="primary" type="submit">Save Item</Button>
                        <Button variant="secondary" className="ms-2" onClick={() => navigate('/inventory')}>Cancel</Button>
                    </Form>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default InventoryForm;