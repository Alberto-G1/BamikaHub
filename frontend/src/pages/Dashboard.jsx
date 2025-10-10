import React, { useState, useEffect } from 'react';
import { Card, Col, Row, Spinner, Alert } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext.jsx';
import { FaBoxes, FaExclamationTriangle, FaTruck, FaUsers, FaUserClock } from 'react-icons/fa';
import api from '../api/api.js';
import { toast } from 'react-toastify';

// Reusable currency formatter for UGX
const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return 'USh 0';
    return new Intl.NumberFormat('en-UG', {
        style: 'currency',
        currency: 'UGX',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};

const Dashboard = () => {
    const { user } = useAuth();
    const [summaryData, setSummaryData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSummary = async () => {
            setLoading(true);
            try {
                const response = await api.get('/dashboard/summary');
                setSummaryData(response.data);
            } catch (error) {
                toast.error("Failed to load dashboard data.");
            } finally {
                setLoading(false);
            }
        };

        fetchSummary();
    }, []);

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
                <Spinner animation="border" />
            </div>
        );
    }

    if (!summaryData) {
        return <Alert variant="danger">Could not load dashboard summary.</Alert>;
    }

    return (
        <div>
            <div className="mb-4">
                <h3>Welcome back, {user ? user.email.split('@')[0] : 'Guest'}!</h3>
                <p className="text-muted">Here's a summary of your inventory system.</p>
            </div>

            <Row>
                {/* Total Stock Value Card */}
                <Col md={6} lg={4} className="mb-4">
                    <Card bg="primary" text="white" className="shadow-sm h-100">
                        <Card.Body className="d-flex flex-column">
                            <div className="d-flex justify-content-between align-items-center">
                                <Card.Title as="h5">Total Stock Value</Card.Title>
                                <FaBoxes size={28} />
                            </div>
                            <Card.Text className="fs-2 fw-bold mt-auto">
                                {formatCurrency(summaryData.totalStockValue)}
                            </Card.Text>
                        </Card.Body>
                    </Card>
                </Col>

                {/* Low Stock Items Card */}
                <Col md={6} lg={4} className="mb-4">
                    <Card bg="warning" text="dark" className="shadow-sm h-100">
                        <Card.Body className="d-flex flex-column">
                            <div className="d-flex justify-content-between align-items-center">
                                <Card.Title as="h5">Low Stock Items</Card.Title>
                                <FaExclamationTriangle size={28} />
                            </div>
                            <Card.Text className="fs-2 fw-bold mt-auto">
                                {summaryData.lowStockItems}
                            </Card.Text>
                        </Card.Body>
                    </Card>
                </Col>

                {/* Pending Users Card */}
                <Col md={6} lg={4} className="mb-4">
                    <Card bg="info" text="white" className="shadow-sm h-100">
                        <Card.Body className="d-flex flex-column">
                            <div className="d-flex justify-content-between align-items-center">
                                <Card.Title as="h5">Pending User Approvals</Card.Title>
                                <FaUserClock size={28} />
                            </div>
                            <Card.Text className="fs-2 fw-bold mt-auto">
                                {summaryData.pendingUsers}
                            </Card.Text>
                        </Card.Body>
                    </Card>
                </Col>

                 {/* Total Items Card */}
                <Col md={6} lg={4} className="mb-4">
                    <Card className="shadow-sm h-100">
                        <Card.Body className="d-flex flex-column">
                            <div className="d-flex justify-content-between align-items-center">
                                <Card.Title as="h5">Total Unique Items</Card.Title>
                                <FaBoxes size={28} className="text-secondary" />
                            </div>
                            <Card.Text className="fs-2 fw-bold mt-auto">
                                {summaryData.totalItems}
                            </Card.Text>
                        </Card.Body>
                    </Card>
                </Col>

                {/* Total Suppliers Card */}
                <Col md={6} lg={4} className="mb-4">
                    <Card className="shadow-sm h-100">
                        <Card.Body className="d-flex flex-column">
                             <div className="d-flex justify-content-between align-items-center">
                                <Card.Title as="h5">Total Suppliers</Card.Title>
                                <FaTruck size={28} className="text-secondary" />
                            </div>
                            <Card.Text className="fs-2 fw-bold mt-auto">
                                {summaryData.totalSuppliers}
                            </Card.Text>
                        </Card.Body>
                    </Card>
                </Col>

                {/* Total Users Card */}
                 <Col md={6} lg={4} className="mb-4">
                    <Card className="shadow-sm h-100">
                        <Card.Body className="d-flex flex-column">
                            <div className="d-flex justify-content-between align-items-center">
                                <Card.Title as="h5">Total System Users</Card.Title>
                                <FaUsers size={28} className="text-secondary" />
                            </div>
                            <Card.Text className="fs-2 fw-bold mt-auto">
                                {summaryData.totalUsers}
                            </Card.Text>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Placeholder for future charts */}
            <Row className="mt-4">
                <Col>
                    <Card className="shadow-sm">
                        <Card.Body>
                            <Card.Title>Future Chart Area</Card.Title>
                            <Card.Text>Charts for stock value over time or category breakdowns will be displayed here.</Card.Text>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default Dashboard;