import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Form, Button, Card, Container, Spinner, Row, Col, Image } from 'react-bootstrap';
import api from '../../api/api.js';
import { toast } from 'react-toastify';
import placeholderImage from '../../assets/images/placeholder.jpg';

const InventoryForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditMode = Boolean(id);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    const [formData, setFormData] = useState({
        name: '', sku: '', categoryId: '', description: '',
        quantity: 0, reorderLevel: 0, unitPrice: '',
        supplierId: '', location: '', isActive: true, version: 0
    });
    
    const [imageUrl, setImageUrl] = useState(null);
    const [suppliers, setSuppliers] = useState([]);
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        const fetchSupportData = async () => {
            try {
                const [suppliersRes, categoriesRes] = await Promise.all([
                    api.get('/suppliers'),
                    api.get('/categories')
                ]);
                setSuppliers(suppliersRes.data);
                setCategories(categoriesRes.data);
            } catch (error) {
                toast.error("Failed to load suppliers and categories.");
            }
        };

        const fetchItemData = async () => {
            if (isEditMode) {
                try {
                    const res = await api.get(`/inventory/items/${id}`);
                    const item = res.data;
                    setFormData({
                        name: item.name || '',
                        sku: item.sku || '',
                        categoryId: item.category?.id || '',
                        description: item.description || '',
                        quantity: item.quantity || 0,
                        reorderLevel: item.reorderLevel || 0,
                        unitPrice: item.unitPrice || '',
                        supplierId: item.supplier?.id || '',
                        location: item.location || '',
                        isActive: item.isActive,
                        version: item.version,
                    });
                    setImageUrl(item.imageUrl);
                } catch (error) {
                    toast.error('Failed to load item data.');
                    navigate('/inventory');
                }
            }
        };
        
        const loadAll = async () => {
            setLoading(true);
            await fetchSupportData();
            await fetchItemData();
            setLoading(false);
        };
        
        loadAll();
    }, [id, isEditMode, navigate]);

    const handleFormChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file || !id) return;

        const apiFormData = new FormData();
        apiFormData.append('file', file);
        setUploading(true);
        try {
            const res = await api.post(`/inventory/items/${id}/image`, apiFormData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setImageUrl(res.data.imageUrl);
            toast.success("Image uploaded successfully!");
        } catch (error) {
            toast.error(error.response?.data?.message || "Image upload failed.");
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEditMode) {
                await api.put(`/inventory/items/${id}`, formData);
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
            <Form onSubmit={handleSubmit}>
                <Row>
                    <Col md={isEditMode ? 8 : 12}>
                        <Card className="shadow-sm">
                            <Card.Header as="h3">{isEditMode ? 'Edit Item Details' : 'Create New Inventory Item'}</Card.Header>
                            <Card.Body>
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
                                        <Form.Select name="categoryId" value={formData.categoryId} onChange={handleFormChange} required>
                                            <option value="">Select a Category...</option>
                                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </Form.Select>
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
                            </Card.Body>
                        </Card>
                    </Col>
                    {isEditMode && (
                        <Col md={4}>
                             <Card className="shadow-sm">
                                <Card.Header as="h5">Item Image</Card.Header>
                                <Card.Body className="text-center">
                                    {uploading ? <Spinner animation="border" /> :
                                        <Image src={imageUrl ? `http://localhost:8080${imageUrl}` : placeholderImage} fluid rounded className="mb-3" style={{maxHeight: '200px', objectFit: 'cover'}} />
                                    }
                                    <input type="file" ref={fileInputRef} onChange={handleImageUpload} style={{ display: 'none' }} accept="image/png, image/jpeg, image/gif" />
                                    <Button variant="outline-primary" onClick={() => fileInputRef.current.click()} disabled={uploading}>
                                        {uploading ? 'Uploading...' : 'Upload Image'}
                                    </Button>
                                </Card.Body>
                             </Card>
                        </Col>
                    )}
                </Row>
            </Form>
        </Container>
    );
};

export default InventoryForm;