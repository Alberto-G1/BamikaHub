import React, { useState, useEffect, useMemo } from 'react';
import { Card, Col, Row, Spinner, Alert } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext.jsx';
import { FaBoxes, FaExclamationTriangle, FaProjectDiagram, FaUsers, FaUserClock, FaTruck } from 'react-icons/fa';
import api from '../../api/api.js';
import { toast } from 'react-toastify';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';

// Register the components you will use from Chart.js
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

// Reusable currency formatter for Ugandan Shillings (UGX)
const formatCurrency = (amount) => {
    if (amount === null || amount === undefined || isNaN(amount)) return 'USh 0';
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
    const [chartData, setChartData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true);
            try {
                // Fetch both summary cards and chart data in parallel for performance
                const [summaryRes, chartsRes] = await Promise.all([
                    api.get('/dashboard/summary'),
                    api.get('/reports/dashboard-charts')
                ]);
                setSummaryData(summaryRes.data);
                setChartData(chartsRes.data);
            } catch (error) {
                toast.error("Failed to load dashboard data.");
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const inventoryChartData = useMemo(() => {
        if (!chartData || !chartData.inventoryValueByCategory) return { labels: [], datasets: [] };
        return {
            labels: chartData.inventoryValueByCategory.map(c => c.categoryName),
            datasets: [{
                label: 'Stock Value (UGX)',
                data: chartData.inventoryValueByCategory.map(c => c.totalValue),
                backgroundColor: ['#00a8e8', '#fecb00', '#343a40', '#6c757d', '#198754', '#fd7e14', '#6f42c1'],
                borderColor: '#ffffff',
                borderWidth: 2,
            }],
        };
    }, [chartData]);

    const projectChartData = useMemo(() => {
        if (!chartData || !chartData.projectsByStatus) return { labels: [], datasets: [] };
        return {
            labels: chartData.projectsByStatus.map(p => p.status.replace(/_/g, ' ')),
            datasets: [{
                label: '# of Projects',
                data: chartData.projectsByStatus.map(p => p.count),
                backgroundColor: 'rgba(0, 168, 232, 0.6)', // Semi-transparent version of theme blue
                borderColor: 'rgba(0, 168, 232, 1)',
                borderWidth: 1,
            }],
        };
    }, [chartData]);

    const fieldReportLeaders = useMemo(() => {
        if (!chartData || !chartData.fieldReportsBySite) return [];
        return chartData.fieldReportsBySite;
    }, [chartData]);

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
                <Spinner animation="border" />
            </div>
        );
    }

    if (!summaryData || !chartData) {
        return <Alert variant="danger">Could not load dashboard summary. Please try refreshing the page.</Alert>;
    }

    return (
        <div>
            <div className="mb-4">
                <h3>Welcome back, {user ? user.email.split('@')[0] : 'Guest'}!</h3>
                <p className="text-muted">Here's a real-time summary of your engineering operations.</p>
            </div>

            {/* Summary Stat Cards */}
            <Row>
                <Col md={6} lg={4} className="mb-4">
                    <Card bg="primary" text="white" className="shadow-sm h-100">
                        <Card.Body className="d-flex flex-column">
                            <div className="d-flex justify-content-between align-items-start">
                                <Card.Title as="h5">Total Stock Value</Card.Title>
                                <FaBoxes size={28} />
                            </div>
                            <Card.Text className="fs-2 fw-bold mt-auto">
                                {formatCurrency(summaryData.totalStockValue)}
                            </Card.Text>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={6} lg={4} className="mb-4">
                    <Card bg="warning" text="dark" className="shadow-sm h-100">
                        <Card.Body className="d-flex flex-column">
                            <div className="d-flex justify-content-between align-items-start">
                                <Card.Title as="h5">Low Stock Items</Card.Title>
                                <FaExclamationTriangle size={28} />
                            </div>
                            <Card.Text className="fs-2 fw-bold mt-auto">
                                {summaryData.lowStockItems}
                            </Card.Text>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={6} lg={4} className="mb-4">
                    <Card bg="info" text="white" className="shadow-sm h-100">
                        <Card.Body className="d-flex flex-column">
                            <div className="d-flex justify-content-between align-items-start">
                                <Card.Title as="h5">Pending User Approvals</Card.Title>
                                <FaUserClock size={28} />
                            </div>
                            <Card.Text className="fs-2 fw-bold mt-auto">
                                {summaryData.pendingUsers}
                            </Card.Text>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Chart Section */}
            <Row>
                <Col lg={7} className="mb-4">
                    <Card className="shadow-sm h-100">
                        <Card.Body>
                            <Card.Title as="h5">Projects by Status</Card.Title>
                            <div style={{ height: '300px' }}>
                                <Bar data={projectChartData} options={{ responsive: true, maintainAspectRatio: false }} />
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col lg={5} className="mb-4">
                    <Card className="shadow-sm h-100">
                        <Card.Body>
                            <Card.Title as="h5">Inventory Value by Category</Card.Title>
                            <div style={{ height: '300px', position: 'relative' }}>
                                <Doughnut data={inventoryChartData} options={{ responsive: true, maintainAspectRatio: false }} />
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {fieldReportLeaders.length > 0 && (
                <Row>
                    <Col md={12} className="mb-4">
                        <Card className="shadow-sm h-100">
                            <Card.Body>
                                <Card.Title as="h5">Top Field Report Activity</Card.Title>
                                <div className="table-responsive">
                                    <table className="table table-striped table-hover table-sm align-middle mb-0">
                                        <thead>
                                            <tr>
                                                <th style={{ minWidth: '220px' }}>Project</th>
                                                <th style={{ minWidth: '200px' }}>Site</th>
                                                <th className="text-end">Reports Submitted</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {fieldReportLeaders.map((entry, index) => (
                                                <tr key={`${entry.projectId || 'project'}-${entry.siteId || 'all'}-${index}`}>
                                                    <td>{entry.projectName || 'Unassigned Project'}</td>
                                                    <td>
                                                        {entry.projectLevel ? (
                                                            <span className="text-muted">Whole Project</span>
                                                        ) : (
                                                            <>
                                                                <div className="fw-semibold">{entry.siteName}</div>
                                                                {entry.siteLocation && <div className="text-muted small">{entry.siteLocation}</div>}
                                                            </>
                                                        )}
                                                    </td>
                                                    <td className="text-end fw-semibold">{entry.reportCount}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            )}
        </div>
    );
};

export default Dashboard;