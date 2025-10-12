import React, { useState, useEffect, useMemo } from 'react';
import { Card, Row, Col, InputGroup, Form, Badge, Spinner, Button } from 'react-bootstrap';
import { FaPlus, FaSearch, FaBoxes, FaExclamationTriangle, FaDolly } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import api from '../../api/api.js';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext.jsx';
import placeholderImage from '../../assets/images/placeholder.jpg';

// Reusable currency formatter
const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return 'USh 0';
    return new Intl.NumberFormat('en-UG', {
        style: 'currency',
        currency: 'UGX',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};

const InventoryPage = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { hasPermission } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchItems();
    }, []);

    const fetchItems = async () => {
        setLoading(true);
        try {
            const response = await api.get('/inventory/items');
            setItems(response.data);
        } catch (err) {
            toast.error('Failed to fetch inventory items.');
        } finally {
            setLoading(false);
        }
    };

    const filteredItems = useMemo(() => {
        if (!items) return [];
        return items.filter(item =>
            item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.category && item.category.name.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    }, [items, searchQuery]);

    // RESTORED: Dashboard card metrics calculated using useMemo for efficiency
    const { totalStockValue, lowStockItems, outOfStockItems } = useMemo(() => {
        if (!items) return { totalStockValue: 0, lowStockItems: 0, outOfStockItems: 0 };
        return {
            totalStockValue: items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0),
            lowStockItems: items.filter(item => item.quantity > 0 && item.quantity <= item.reorderLevel).length,
            outOfStockItems: items.filter(item => item.quantity === 0).length
        };
    }, [items]);


    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
                <Spinner animation="border" />
            </div>
        );
    }

    return (
        <div>
            {/* RESTORED: Summary Stat Cards Section */}
            <Row className="mb-4">
                <Col lg={4} className="mb-3 mb-lg-0">
                    <Card bg="primary" text="white" className="shadow-sm h-100">
                        <Card.Body>
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <Card.Title as="h5">Total Stock Value</Card.Title>
                                    <Card.Text className="fs-4 fw-bold">{formatCurrency(totalStockValue)}</Card.Text>
                                </div>
                                <FaBoxes size={36} />
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col lg={4} className="mb-3 mb-lg-0">
                    <Card bg="warning" text="dark" className="shadow-sm h-100">
                        <Card.Body>
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <Card.Title as="h5">Low Stock Items</Card.Title>
                                    <Card.Text className="fs-4 fw-bold">{lowStockItems}</Card.Text>
                                </div>
                                <FaExclamationTriangle size={36} />
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col lg={4} className="mb-3 mb-lg-0">
                    <Card bg="danger" text="white" className="shadow-sm h-100">
                        <Card.Body>
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <Card.Title as="h5">Out of Stock Items</Card.Title>
                                    <Card.Text className="fs-4 fw-bold">{outOfStockItems}</Card.Text>
                                </div>
                                <FaDolly size={36} />
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Main Content: Search and Item Grid */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Inventory Items ({filteredItems.length})</h2>
                {hasPermission('ITEM_CREATE') && (
                    <Button variant="primary" onClick={() => navigate('/inventory/new')}>
                        <FaPlus className="me-2" /> Add New Item
                    </Button>
                )}
            </div>
            <InputGroup className="mb-4 shadow-sm">
                <InputGroup.Text><FaSearch /></InputGroup.Text>
                <Form.Control 
                    placeholder="Search by Name, SKU, or Category..." 
                    value={searchQuery} 
                    onChange={e => setSearchQuery(e.target.value)} 
                />
            </InputGroup>

            <Row xs={1} md={2} lg={3} xl={4} className="g-4">
                {filteredItems.map(item => (
                    <Col key={item.id}>
                        <Card className="h-100 shadow-sm inventory-card" onClick={() => navigate(`/inventory/items/${item.id}`)}>
                            <Card.Img 
                                variant="top" 
                                src={item.imageUrl ? `http://localhost:8080${item.imageUrl}` : placeholderImage} 
                                className="inventory-card-img"
                            />
                            <Card.Body>
                                {item.category && <Badge bg="secondary" className="mb-2">{item.category.name}</Badge>}
                                <Card.Title className="inventory-card-title">{item.name}</Card.Title>
                                <Card.Text className="text-muted">{item.sku}</Card.Text>
                            </Card.Body>
                            <Card.Footer className="d-flex justify-content-between align-items-center">
                                <span className={`fw-bold fs-5 ${item.quantity <= item.reorderLevel && item.quantity > 0 ? 'text-warning' : item.quantity === 0 ? 'text-danger' : ''}`}>
                                    {item.quantity.toLocaleString()} <small className="text-muted">in stock</small>
                                </span>
                                <span className="fw-bold text-success">{formatCurrency(item.unitPrice)}</span>
                            </Card.Footer>
                        </Card>
                    </Col>
                ))}
            </Row>
        </div>
    );
};

export default InventoryPage;