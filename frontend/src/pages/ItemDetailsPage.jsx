import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Card, Row, Col, Button, Spinner, Image, ListGroup, Tabs, Tab, Badge, Table } from 'react-bootstrap';
import { FaEdit, FaArrowLeft, FaExchangeAlt } from 'react-icons/fa';
import api from '../api/api.js';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext.jsx';
import StockTransactionModal from '../components/inventory/StockTransactionModal.jsx';
import placeholderImage from '../assets/images/placeholder.jpg';


const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return 'USh 0';
    return new Intl.NumberFormat('en-UG', {
        style: 'currency', currency: 'UGX', minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(amount);
};

const getTransactionTypeBadge = (type) => {
    switch (type) {
        case 'IN': return <Badge bg="success">Stock In</Badge>;
        case 'OUT': return <Badge bg="danger">Stock Out</Badge>;
        case 'ADJUSTMENT': return <Badge bg="warning" text="dark">Adjustment</Badge>;
        case 'RETURN': return <Badge bg="info">Return</Badge>;
        default: return <Badge bg="secondary">{type}</Badge>;
    }
};

const ItemDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { hasPermission } = useAuth();

    const [item, setItem] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const [showStockModal, setShowStockModal] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [itemRes, transRes] = await Promise.all([
                api.get(`/inventory/items/${id}`),
                api.get(`/inventory/items/${id}/transactions`)
            ]);
            setItem(itemRes.data);
            setTransactions(transRes.data);
        } catch (error) {
            toast.error("Failed to load item details.");
            navigate('/inventory');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [id, navigate]);


    if (loading) return <Spinner animation="border" />;
    if (!item) return <p>Item not found.</p>;

    return (
        <>
            <Container>
                <Button variant="outline-secondary" size="sm" className="mb-3" onClick={() => navigate('/inventory')}>
                    <FaArrowLeft className="me-2" /> Back to Inventory
                </Button>
                <Row>
                    <Col md={5} lg={4}>
                        <Card className="shadow-sm mb-3">
                             <Card.Img variant="top" src={item.imageUrl ? `http://localhost:8080${item.imageUrl}` : placeholderImage} />
                             <Card.Body>
                                {hasPermission('ITEM_UPDATE') && (
                                    <Button variant="primary" className="w-100 mb-2" onClick={() => setShowStockModal(true)}>
                                        <FaExchangeAlt className="me-2" /> Manage Stock
                                    </Button>
                                )}
                                {hasPermission('ITEM_UPDATE') && (
                                    <Button variant="outline-secondary" className="w-100" onClick={() => navigate(`/inventory/edit/${id}`)}>
                                        <FaEdit className="me-2" /> Edit Item
                                    </Button>
                                )}
                             </Card.Body>
                        </Card>
                    </Col>
                    <Col md={7} lg={8}>
                         <Card className="shadow-sm">
                            <Card.Header>
                                <h3>{item.name}</h3>
                                <p className="text-muted mb-0">SKU: {item.sku}</p>
                            </Card.Header>
                            <Card.Body>
                                <Tabs defaultActiveKey="details" id="item-details-tabs" className="mb-3">
                                    <Tab eventKey="details" title="Details">
                                        <ListGroup variant="flush">
                                            <ListGroup.Item><strong>Category:</strong> {item.category?.name || 'N/A'}</ListGroup.Item>
                                            <ListGroup.Item><strong>Current Quantity:</strong> <span className="fw-bold fs-5">{item.quantity.toLocaleString()}</span></ListGroup.Item>
                                            <ListGroup.Item><strong>Unit Price:</strong> {formatCurrency(item.unitPrice)}</ListGroup.Item>
                                            <ListGroup.Item><strong>Total Stock Value:</strong> {formatCurrency(item.quantity * item.unitPrice)}</ListGroup.Item>
                                            <ListGroup.Item><strong>Supplier:</strong> {item.supplier?.name || 'N/A'}</ListGroup.Item>
                                            <ListGroup.Item><strong>Location:</strong> {item.location || 'N/A'}</ListGroup.Item>
                                            <ListGroup.Item><strong>Description:</strong> {item.description || 'No description provided.'}</ListGroup.Item>
                                        </ListGroup>
                                    </Tab>
                                    <Tab eventKey="history" title={`Transaction History (${transactions.length})`}>
                                        <Table striped bordered hover responsive size="sm" className="mt-3">
                                            <thead><tr><th>Date</th><th>Type</th><th>Qty</th><th>Ref.</th><th>User</th></tr></thead>
                                            <tbody>
                                                {transactions.map(t => (
                                                    <tr key={t.id}>
                                                        <td>{new Date(t.createdAt).toLocaleString()}</td>
                                                        <td>{getTransactionTypeBadge(t.type)}</td>
                                                        <td>{t.quantity}</td>
                                                        <td>{t.reference}</td>
                                                        <td>{t.user.username}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </Table>
                                    </Tab>
                                </Tabs>
                            </Card.Body>
                         </Card>
                    </Col>
                </Row>
            </Container>
            
            {item && (
                <StockTransactionModal
                    show={showStockModal}
                    handleClose={() => setShowStockModal(false)}
                    item={item}
                    onTransactionSuccess={fetchData}
                />
            )}
        </>
    );
};
export default ItemDetailsPage;