import React, { useState, useEffect, useMemo } from 'react';
import { Table, Button, Spinner, Card, Row, Col, InputGroup, Form, Badge } from 'react-bootstrap';
import { FaPlus, FaSearch, FaBoxes, FaExclamationTriangle, FaDolly, FaEdit, FaTrash } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import api from '../api/api.js';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext.jsx';
import StockTransactionModal from '../components/inventory/StockTransactionModal.jsx';

// A reusable currency formatter utility for Ugandan Shillings (UGX)
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

    // State for the Stock Transaction modal
    const [showStockModal, setShowStockModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);

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
            item.category.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [items, searchQuery]);
    
    // Dashboard card metrics calculated using useMemo for efficiency
    const { totalStockValue, lowStockItems, outOfStockItems } = useMemo(() => {
        if (!items) return { totalStockValue: 0, lowStockItems: 0, outOfStockItems: 0 };
        return {
            totalStockValue: items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0),
            lowStockItems: items.filter(item => item.quantity <= item.reorderLevel).length,
            outOfStockItems: items.filter(item => item.quantity === 0).length
        };
    }, [items]);

    const handleOpenStockModal = (item) => {
        setSelectedItem(item);
        setShowStockModal(true);
    };

    const handleCloseStockModal = () => {
        setSelectedItem(null);
        setShowStockModal(false);
    };

    const handleDelete = async (itemId, itemName) => {
        try {
            await api.delete(`/inventory/items/${itemId}`);
            toast.warn(`Item '${itemName}' has been deleted.`);
            fetchItems();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete item.');
        }
    };
    
    // Custom confirmation toast for delete action
    const confirmDelete = (itemId, itemName) => {
        const toastId = toast.error(
            <div>
                <p>Delete item <strong>{itemName}</strong>?</p>
                <p className="small text-muted">This action cannot be undone.</p>
                <div className="mt-3">
                    <Button variant="danger" size="sm" className="me-2" onClick={() => { handleDelete(itemId, itemName); toast.dismiss(toastId); }}>
                        Yes, Delete
                    </Button>
                    <Button variant="light" size="sm" onClick={() => toast.dismiss(toastId)}>
                        Cancel
                    </Button>
                </div>
            </div>,
            {
                autoClose: false,
                closeOnClick: false,
                draggable: false,
                position: "top-center",
                theme: "colored"
            }
        );
    };

    if (loading) return <Spinner animation="border" />;

    return (
        <>
            <div>
                {/* Summary Cards */}
                <Row className="mb-4">
                    <Col lg={4} className="mb-3 mb-lg-0"><Card bg="primary" text="white" className="shadow-sm">
                        <Card.Body><FaBoxes size={24} className="mb-2" />
                            <Card.Title>Total Stock Value</Card.Title>
                            <Card.Text className="fs-4 fw-bold">{formatCurrency(totalStockValue)}</Card.Text>
                        </Card.Body></Card>
                    </Col>
                    <Col lg={4} className="mb-3 mb-lg-0"><Card bg="warning" text="dark" className="shadow-sm">
                        <Card.Body><FaExclamationTriangle size={24} className="mb-2" />
                            <Card.Title>Low Stock Items</Card.Title>
                            <Card.Text className="fs-4 fw-bold">{lowStockItems}</Card.Text>
                        </Card.Body></Card>
                    </Col>
                    <Col lg={4} className="mb-3 mb-lg-0"><Card bg="danger" text="white" className="shadow-sm">
                        <Card.Body><FaDolly size={24} className="mb-2" />
                            <Card.Title>Out of Stock Items</Card.Title>
                            <Card.Text className="fs-4 fw-bold">{outOfStockItems}</Card.Text>
                        </Card.Body></Card>
                    </Col>
                </Row>

                <Card className="shadow-sm">
                    <Card.Header className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                        <Card.Title as="h4" className="mb-0">Inventory Items</Card.Title>
                        {hasPermission('ITEM_CREATE') && (
                            <Button variant="primary" onClick={() => navigate('/inventory/new')}>
                                <FaPlus className="me-2" /> Add New Item
                            </Button>
                        )}
                    </Card.Header>
                    <Card.Body>
                        <InputGroup className="mb-3">
                            <InputGroup.Text><FaSearch /></InputGroup.Text>
                            <Form.Control 
                                placeholder="Search by Name, SKU, or Category..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                        </InputGroup>
                        <Table striped bordered hover responsive className="align-middle">
                            <thead>
                                <tr>
                                    <th>SKU</th>
                                    <th>Name</th>
                                    <th>Category</th>
                                    <th>Quantity</th>
                                    <th>Unit Price</th>
                                    <th>Stock Value</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredItems.map(item => (
                                    <tr key={item.id} className={item.quantity <= item.reorderLevel && item.quantity > 0 ? 'table-warning' : item.quantity === 0 ? 'table-danger' : ''}>
                                        <td>{item.sku}</td>
                                        <td>{item.name}</td>
                                        <td>{item.category}</td>
                                        <td className="fw-bold">{item.quantity.toLocaleString()}</td>
                                        <td>{formatCurrency(item.unitPrice)}</td>
                                        <td>{formatCurrency(item.quantity * item.unitPrice)}</td>
                                        <td>
                                            <Badge bg={item.isActive ? 'success' : 'secondary'}>
                                                {item.isActive ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </td>
                                        <td>
                                            {hasPermission('ITEM_UPDATE') && (
                                                <Button variant="outline-primary" size="sm" className="me-2" title="Manage Stock" onClick={() => handleOpenStockModal(item)}>Stock</Button>
                                            )}
                                            {hasPermission('ITEM_UPDATE') && (
                                                <Button variant="outline-secondary" size="sm" className="me-2" title="Edit Item" onClick={() => navigate(`/inventory/edit/${item.id}`)}>
                                                    <FaEdit />
                                                </Button>
                                            )}
                                            {hasPermission('ITEM_DELETE') && (
                                                <Button variant="outline-danger" size="sm" title="Delete Item" onClick={() => confirmDelete(item.id, item.name)}>
                                                    <FaTrash />
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </Card.Body>
                </Card>
            </div>
            {selectedItem && (
                <StockTransactionModal 
                    show={showStockModal}
                    handleClose={handleCloseStockModal}
                    item={selectedItem}
                    onTransactionSuccess={fetchItems}
                />
            )}
        </>
    );
};

export default InventoryPage;