import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Spinner, Form, Row, Col, Button, Badge } from 'react-bootstrap';
import { FaDollarSign, FaFilter } from 'react-icons/fa';
import api from '../../api/api.js';
import { toast } from 'react-toastify';

const formatCurrency = (amount) => {
    if (!amount) return 'UGX 0';
    return new Intl.NumberFormat('en-UG', {
        style: 'currency',
        currency: 'UGX',
        minimumFractionDigits: 0
    }).format(amount);
};

const BudgetVsActualReport = () => {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        projectId: '',
        status: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async (params = {}) => {
        setLoading(true);
        try {
            const response = await api.get('/reports/finance/budget-vs-actual', { params });
            setData(response.data || []);
        } catch (error) {
            toast.error('Failed to load budget vs actual data');
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const applyFilters = (e) => {
        e.preventDefault();
        const sanitized = Object.fromEntries(
            Object.entries(filters).filter(([_, v]) => v !== '')
        );
        fetchData(sanitized);
    };

    const resetFilters = () => {
        setFilters({ startDate: '', endDate: '', projectId: '', status: '' });
        fetchData();
    };

    const getStatusBadge = (status) => {
        const variants = {
            UNDER_BUDGET: 'success',
            ON_BUDGET: 'info',
            OVER_BUDGET: 'danger'
        };
        return <Badge bg={variants[status] || 'secondary'}>{status.replace('_', ' ')}</Badge>;
    };

    const totals = data.reduce((acc, item) => ({
        budgeted: acc.budgeted + (item.budgetedCost || 0),
        actual: acc.actual + (item.actualCost || 0),
        variance: acc.variance + (item.variance || 0)
    }), { budgeted: 0, actual: 0, variance: 0 });

    return (
        <Container fluid>
            <Card className="shadow-sm mb-3">
                <Card.Header className="d-flex align-items-center">
                    <FaDollarSign size={24} className="me-3 text-success" />
                    <div>
                        <h4 className="mb-0">Budget vs Actual Cost Analysis</h4>
                        <small className="text-muted">Compare budgeted costs against actual spending</small>
                    </div>
                </Card.Header>
            </Card>

            <Card className="shadow-sm mb-3">
                <Card.Header>
                    <FaFilter className="me-2" /> Filters
                </Card.Header>
                <Card.Body>
                    <Form onSubmit={applyFilters}>
                        <Row className="g-3">
                            <Col md={3}>
                                <Form.Group>
                                    <Form.Label>Start Date</Form.Label>
                                    <Form.Control
                                        type="date"
                                        name="startDate"
                                        value={filters.startDate}
                                        onChange={handleFilterChange}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group>
                                    <Form.Label>End Date</Form.Label>
                                    <Form.Control
                                        type="date"
                                        name="endDate"
                                        value={filters.endDate}
                                        onChange={handleFilterChange}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group>
                                    <Form.Label>Status</Form.Label>
                                    <Form.Select name="status" value={filters.status} onChange={handleFilterChange}>
                                        <option value="">All</option>
                                        <option value="PLANNING">Planning</option>
                                        <option value="IN_PROGRESS">In Progress</option>
                                        <option value="COMPLETED">Completed</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={3} className="d-flex align-items-end">
                                <Button type="submit" variant="primary" className="me-2">Apply</Button>
                                <Button type="button" variant="outline-secondary" onClick={resetFilters}>Reset</Button>
                            </Col>
                        </Row>
                    </Form>
                </Card.Body>
            </Card>

            <Row className="mb-3">
                <Col md={4}>
                    <Card className="shadow-sm h-100 bg-primary text-white">
                        <Card.Body>
                            <div className="small text-uppercase">Total Budgeted</div>
                            <div className="h3 mb-0">{formatCurrency(totals.budgeted)}</div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card className="shadow-sm h-100 bg-warning">
                        <Card.Body>
                            <div className="small text-uppercase">Total Actual</div>
                            <div className="h3 mb-0">{formatCurrency(totals.actual)}</div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card className={`shadow-sm h-100 ${totals.variance >= 0 ? 'bg-success' : 'bg-danger'} text-white`}>
                        <Card.Body>
                            <div className="small text-uppercase">Total Variance</div>
                            <div className="h3 mb-0">{formatCurrency(totals.variance)}</div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Card className="shadow-sm">
                <Card.Body className="p-0">
                    {loading ? (
                        <div className="text-center p-5">
                            <Spinner animation="border" />
                        </div>
                    ) : (
                        <Table striped bordered hover responsive className="mb-0">
                            <thead>
                                <tr>
                                    <th>Project</th>
                                    <th>Budgeted Cost</th>
                                    <th>Actual Cost</th>
                                    <th>Variance</th>
                                    <th>Variance %</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="text-center text-muted py-4">
                                            No data available
                                        </td>
                                    </tr>
                                ) : (
                                    data.map((item) => (
                                        <tr key={item.projectId}>
                                            <td>{item.projectName}</td>
                                            <td>{formatCurrency(item.budgetedCost)}</td>
                                            <td>{formatCurrency(item.actualCost)}</td>
                                            <td className={item.variance >= 0 ? 'text-success' : 'text-danger'}>
                                                {formatCurrency(item.variance)}
                                            </td>
                                            <td className={item.variancePercentage >= 0 ? 'text-success' : 'text-danger'}>
                                                {item.variancePercentage.toFixed(1)}%
                                            </td>
                                            <td>{getStatusBadge(item.status)}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </Table>
                    )}
                </Card.Body>
            </Card>
        </Container>
    );
};

export default BudgetVsActualReport;
