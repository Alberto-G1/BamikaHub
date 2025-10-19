import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Spinner, Form, Row, Col, Button, Badge } from 'react-bootstrap';
import { FaProjectDiagram, FaFilter, FaChartLine } from 'react-icons/fa';
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

const ProjectPerformanceReport = () => {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        status: '',
        projectId: ''
    });

    useEffect(() => {
        const sanitized = Object.fromEntries(
            Object.entries(filters).filter(([_, v]) => v !== '')
        );
        fetchData(sanitized);
    }, [filters]);

    const fetchData = async (params = {}) => {
        setLoading(true);
        try {
            const response = await api.get('/reports/operations/project-performance', { params });
            setData(response.data || []);
        } catch (error) {
            toast.error('Failed to load project performance data');
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const resetFilters = () => {
        setFilters({ startDate: '', endDate: '', status: '', projectId: '' });
    };

    const getStatusBadge = (status) => {
        const variants = {
            PLANNING: 'secondary',
            IN_PROGRESS: 'primary',
            ON_HOLD: 'warning',
            COMPLETED: 'success',
            CANCELLED: 'danger',
            ARCHIVED: 'dark'
        };
        return <Badge bg={variants[status] || 'secondary'}>{status.replace('_', ' ')}</Badge>;
    };

    return (
        <Container fluid>
            <Card className="shadow-sm mb-3">
                <Card.Header className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center">
                        <FaProjectDiagram size={24} className="me-3" />
                        <div>
                            <h4 className="mb-0">Project Performance Report</h4>
                            <small className="text-muted">Analyze project status, duration, and completion metrics</small>
                        </div>
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
                        <Col md={3}>
                            <Form.Group>
                                <Form.Label>Status</Form.Label>
                                <Form.Select name="status" value={filters.status} onChange={handleFilterChange}>
                                    <option value="">All Statuses</option>
                                    <option value="PLANNING">Planning</option>
                                    <option value="IN_PROGRESS">In Progress</option>
                                    <option value="ON_HOLD">On Hold</option>
                                    <option value="COMPLETED">Completed</option>
                                    <option value="CANCELLED">Cancelled</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={3} className="d-flex align-items-end">
                            <Button type="button" variant="outline-secondary" onClick={resetFilters} className="w-100">Reset Filters</Button>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

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
                                    <th>Project ID</th>
                                    <th>Project Name</th>
                                    <th>Status</th>
                                    <th>Start Date</th>
                                    <th>End Date</th>
                                    <th>Duration (Days)</th>
                                    <th>Completion %</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="text-center text-muted py-4">
                                            No data available
                                        </td>
                                    </tr>
                                ) : (
                                    data.map((project) => (
                                        <tr key={project.projectId}>
                                            <td>{project.projectId}</td>
                                            <td>{project.projectName}</td>
                                            <td>{getStatusBadge(project.status)}</td>
                                            <td>{project.startDate || '—'}</td>
                                            <td>{project.expectedEndDate || '—'}</td>
                                            <td>{project.durationDays !== null ? project.durationDays : '—'}</td>
                                            <td>
                                                <div className="d-flex align-items-center">
                                                    <div className="progress flex-grow-1 me-2" style={{ height: '20px' }}>
                                                        <div
                                                            className="progress-bar"
                                                            role="progressbar"
                                                            style={{ width: `${project.completionPercentage}%` }}
                                                            aria-valuenow={project.completionPercentage}
                                                            aria-valuemin="0"
                                                            aria-valuemax="100"
                                                        >
                                                            {project.completionPercentage}%
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
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

export default ProjectPerformanceReport;
