import React, { useState, useEffect } from 'react';
import { Container, Card, Form, Row, Col, Button, Spinner } from 'react-bootstrap';
import { FaChartLine } from 'react-icons/fa';
import api from '../../api/api.js';
import { toast } from 'react-toastify';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const CompletionTrendsReport = () => {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(null);
    const [filters, setFilters] = useState({
        startDate: new Date(new Date().setMonth(new Date().getMonth() - 12)).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        aggregationLevel: 'MONTHLY'
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async (params = filters) => {
        setLoading(true);
        try {
            const response = await api.get('/reports/operations/project-completion-trend', { params });
            setData(response.data);
        } catch (error) {
            toast.error('Failed to load completion trends');
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
        fetchData(filters);
    };

    const chartData = data ? {
        labels: data.dataPoints.map(dp => dp.period),
        datasets: [
            {
                label: 'Completed Projects',
                data: data.dataPoints.map(dp => dp.count),
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                tension: 0.1
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
                text: 'Project Completion Trend Over Time'
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    stepSize: 1
                }
            }
        }
    };

    return (
        <Container fluid>
            <Card className="shadow-sm mb-3">
                <Card.Header className="d-flex align-items-center">
                    <FaChartLine size={24} className="me-3 text-success" />
                    <div>
                        <h4 className="mb-0">Project Completion Trends</h4>
                        <small className="text-muted">Track completion patterns over time</small>
                    </div>
                </Card.Header>
            </Card>

            <Card className="shadow-sm mb-3">
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
                                    <Form.Label>Aggregation</Form.Label>
                                    <Form.Select
                                        name="aggregationLevel"
                                        value={filters.aggregationLevel}
                                        onChange={handleFilterChange}
                                    >
                                        <option value="DAILY">Daily</option>
                                        <option value="WEEKLY">Weekly</option>
                                        <option value="MONTHLY">Monthly</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={3} className="d-flex align-items-end">
                                <Button type="submit" variant="primary">Apply Filters</Button>
                            </Col>
                        </Row>
                    </Form>
                </Card.Body>
            </Card>

            <Card className="shadow-sm">
                <Card.Body>
                    {loading ? (
                        <div className="text-center p-5">
                            <Spinner animation="border" />
                        </div>
                    ) : data ? (
                        <>
                            <div className="mb-3">
                                <p className="text-muted">{data.summary}</p>
                            </div>
                            {chartData && <Line data={chartData} options={chartOptions} />}
                        </>
                    ) : (
                        <div className="text-center text-muted py-5">No data available</div>
                    )}
                </Card.Body>
            </Card>
        </Container>
    );
};

export default CompletionTrendsReport;
