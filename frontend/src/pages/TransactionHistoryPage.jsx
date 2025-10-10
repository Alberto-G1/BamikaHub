import React, { useState, useEffect, useMemo } from 'react';
import { Table, Spinner, Card, Form, Row, Col, Badge } from 'react-bootstrap';
import { FaHistory } from 'react-icons/fa';
import api from '../api/api.js';
import { toast } from 'react-toastify';

// Reusable currency formatter
const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return 'N/A';
    return new Intl.NumberFormat('en-UG', {
        style: 'currency', currency: 'UGX', minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(amount);
};

// Helper to format the transaction type for display
const getTransactionTypeBadge = (type) => {
    switch (type) {
        case 'IN': return <Badge bg="success">Stock In</Badge>;
        case 'OUT': return <Badge bg="danger">Stock Out</Badge>;
        case 'ADJUSTMENT': return <Badge bg="warning" text="dark">Adjustment</Badge>;
        case 'RETURN': return <Badge bg="info">Return</Badge>;
        default: return <Badge bg="secondary">{type}</Badge>;
    }
};

const TransactionHistoryPage = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState('ALL');

    useEffect(() => {
        fetchTransactions();
    }, []);

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            const response = await api.get('/inventory/transactions');
            setTransactions(response.data);
        } catch (err) {
            toast.error('Failed to fetch transaction history.');
        } finally {
            setLoading(false);
        }
    };

    const filteredTransactions = useMemo(() => {
        return transactions
            .filter(t => typeFilter === 'ALL' || t.type === typeFilter)
            .filter(t => {
                const searchLower = searchQuery.toLowerCase();
                return (
                    t.item.name.toLowerCase().includes(searchLower) ||
                    t.item.sku.toLowerCase().includes(searchLower) ||
                    (t.reference && t.reference.toLowerCase().includes(searchLower)) ||
                    (t.user.username && t.user.username.toLowerCase().includes(searchLower))
                );
            });
    }, [transactions, searchQuery, typeFilter]);

    if (loading) return <Spinner animation="border" />;

    return (
        <Card className="shadow-sm">
            <Card.Header>
                <Card.Title as="h3" className="mb-0 d-flex align-items-center">
                    <FaHistory className="me-3" /> Stock Transaction Log
                </Card.Title>
            </Card.Header>
            <Card.Body>
                {/* Filter Controls */}
                <Row className="mb-3">
                    <Col md={4}>
                        <Form.Group>
                            <Form.Label>Filter by Type</Form.Label>
                            <Form.Select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
                                <option value="ALL">All Types</option>
                                <option value="IN">Stock In</option>
                                <option value="OUT">Stock Out</option>
                                <option value="ADJUSTMENT">Adjustment</option>
                                <option value="RETURN">Return</option>
                            </Form.Select>
                        </Form.Group>
                    </Col>
                    <Col md={8}>
                        <Form.Group>
                            <Form.Label>Search by Item, SKU, Reference, or User</Form.Label>
                            <Form.Control 
                                type="text"
                                placeholder="Search transactions..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                        </Form.Group>
                    </Col>
                </Row>

                <Table striped bordered hover responsive className="align-middle">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Item (SKU)</th>
                            <th>Type</th>
                            <th>Quantity Moved</th>
                            <th>Previous Qty</th>
                            <th>New Qty</th>
                            <th>Unit Cost</th>
                            <th>Reference/Reason</th>
                            <th>User</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredTransactions.map(t => (
                            <tr key={t.id}>
                                <td>{new Date(t.createdAt).toLocaleString()}</td>
                                <td>
                                    <div>{t.item.name}</div>
                                    <small className="text-muted">{t.item.sku}</small>
                                </td>
                                <td>{getTransactionTypeBadge(t.type)}</td>
                                <td>{t.quantity.toLocaleString()}</td>
                                <td>{t.previousQuantity.toLocaleString()}</td>
                                <td>{t.newQuantity.toLocaleString()}</td>
                                <td>{formatCurrency(t.unitCost)}</td>
                                <td>{t.reference}</td>
                                <td>{t.user.username}</td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </Card.Body>
        </Card>
    );
};

export default TransactionHistoryPage;