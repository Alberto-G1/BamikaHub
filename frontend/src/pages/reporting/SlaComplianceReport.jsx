import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Spinner, Form, Row, Col, Button } from 'react-bootstrap';
import { FaCheckCircle, FaFilter } from 'react-icons/fa';
import api from '../../api/api.js';
import { toast } from 'react-toastify';
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const SlaComplianceReport = () => {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);
    const [filters, setFilters] = useState({
        startDate: new Date(new Date().setMonth(new Date().getMonth() - 3)).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        priority: '',
        status: ''
    });

    useEffect(() => {
        fetchData(filters);
    }, [filters]);

    const fetchData = async (params = filters) => {
        setLoading(true);
        try {
            const response = await api.get('/reports/support/sla-compliance', { params });
            setData(response.data || []);
        } catch (error) {
            toast.error('Failed to load SLA compliance data');
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const resetFilters = () => {
        const defaultFilters = {
            startDate: new Date(new Date().setMonth(new Date().getMonth() - 3)).toISOString().split('T')[0],
            endDate: new Date().toISOString().split('T')[0],
            priority: '',
            status: ''
        };
        setFilters(defaultFilters);
    };

    const chartData = data.length > 0 ? {
        labels: data.map(item => item.priority),
        datasets: [
            {
                label: 'Response Compliance %',
                data: data.map(item => item.responseCompliancePercentage),
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
            },
            {
                label: 'Resolution Compliance %',
                data: data.map(item => item.resolutionCompliancePercentage),
                backgroundColor: 'rgba(153, 102, 255, 0.6)',
            }
        ]
    } : null;

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top'
            },
            title: {
                display: true,
                text: 'SLA Compliance by Priority'
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                max: 100,
                ticks: {
                    callback: function(value) {
                        return value + '%';
                    }
                }
            }
        }
    };

    const overallCompliance = data.length > 0 ? {
        responseAvg: (data.reduce((sum, item) => sum + item.responseCompliancePercentage, 0) / data.length).toFixed(1),
        resolutionAvg: (data.reduce((sum, item) => sum + item.resolutionCompliancePercentage, 0) / data.length).toFixed(1),
        totalTickets: data.reduce((sum, item) => sum + item.totalTickets, 0)
    } : null;

    return (
        <Container fluid>
            <Card className="shadow-sm mb-3">
                <Card.Header className="d-flex align-items-center">
                    <FaCheckCircle size={24} className="me-3 text-success" />
                    <div>
                        <h4 className="mb-0">SLA Compliance Report</h4>
                        <small className="text-muted">Response and resolution time compliance by priority</small>
                    </div>
                </Card.Header>
            </Card>

            <Card className="shadow-sm mb-3">
                <Card.Header>
                    <FaFilter className="me-2" /> Filters
                </Card.Header>
                <Card.Body>
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
                        <Col md={2}>
                            <Form.Group>
                                <Form.Label>Priority</Form.Label>
                                <Form.Select name="priority" value={filters.priority} onChange={handleFilterChange}>
                                    <option value="">All</option>
                                    <option value="LOW">Low</option>
                                    <option value="MEDIUM">Medium</option>
                                    <option value="HIGH">High</option>
                                    <option value="URGENT">Urgent</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={2}>
                            <Form.Group>
                                <Form.Label>Status</Form.Label>
                                <Form.Select name="status" value={filters.status} onChange={handleFilterChange}>
                                    <option value="">All</option>
                                    <option value="OPEN">Open</option>
                                    <option value="IN_PROGRESS">In Progress</option>
                                    <option value="RESOLVED">Resolved</option>
                                    <option value="CLOSED">Closed</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={2} className="d-flex align-items-end">
                            <Button type="button" variant="outline-secondary" onClick={resetFilters} className="w-100">Reset Filters</Button>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {overallCompliance && (
                <Row className="mb-3">
                    <Col md={4}>
                        <Card className="shadow-sm h-100 bg-info text-white">
                            <Card.Body>
                                <div className="small text-uppercase">Total Tickets</div>
                                <div className="h3 mb-0">{overallCompliance.totalTickets}</div>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={4}>
                        <Card className="shadow-sm h-100 bg-success text-white">
                            <Card.Body>
                                <div className="small text-uppercase">Avg Response Compliance</div>
                                <div className="h3 mb-0">{overallCompliance.responseAvg}%</div>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={4}>
                        <Card className="shadow-sm h-100 bg-primary text-white">
                            <Card.Body>
                                <div className="small text-uppercase">Avg Resolution Compliance</div>
                                <div className="h3 mb-0">{overallCompliance.resolutionAvg}%</div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            )}

            {chartData && (
                <Card className="shadow-sm mb-3">
                    <Card.Body>
                        <Bar data={chartData} options={chartOptions} />
                    </Card.Body>
                </Card>
            )}

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
                                    <th>Priority</th>
                                    <th>Total Tickets</th>
                                    <th>Response Met</th>
                                    <th>Resolution Met</th>
                                    <th>Response Compliance %</th>
                                    <th>Resolution Compliance %</th>
                                    <th>Avg Response (hrs)</th>
                                    <th>Avg Resolution (hrs)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="text-center text-muted py-4">
                                            No data available
                                        </td>
                                    </tr>
                                ) : (
                                    data.map((item) => (
                                        <tr key={item.priority}>
                                            <td><strong>{item.priority}</strong></td>
                                            <td>{item.totalTickets}</td>
                                            <td>{item.responseMetCount}</td>
                                            <td>{item.resolutionMetCount}</td>
                                            <td>
                                                <span className={item.responseCompliancePercentage >= 80 ? 'text-success' : 'text-danger'}>
                                                    {item.responseCompliancePercentage.toFixed(1)}%
                                                </span>
                                            </td>
                                            <td>
                                                <span className={item.resolutionCompliancePercentage >= 80 ? 'text-success' : 'text-danger'}>
                                                    {item.resolutionCompliancePercentage.toFixed(1)}%
                                                </span>
                                            </td>
                                            <td>{item.averageResponseHours.toFixed(1)}</td>
                                            <td>{item.averageResolutionHours.toFixed(1)}</td>
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

export default SlaComplianceReport;
