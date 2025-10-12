import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Card, Row, Col, Button, Spinner, Tabs, Tab, Badge, Table, ListGroup } from 'react-bootstrap';
import { FaArrowLeft, FaPlus, FaUser } from 'react-icons/fa';
import api from '../../api/api.js';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext.jsx';
import FieldReportModal from '../../components/operations/FieldReportModal.jsx';


const getStatusBadge = (status) => {
    switch (status) {
        case 'IN_PROGRESS': return <Badge bg="primary">In Progress</Badge>;
        case 'COMPLETED': return <Badge bg="success">Completed</Badge>;
        case 'PLANNING': return <Badge bg="info">Planning</Badge>;
        case 'ON_HOLD': return <Badge bg="warning" text="dark">On Hold</Badge>;
        case 'CANCELLED': return <Badge bg="danger">Cancelled</Badge>;
        default: return <Badge bg="secondary">{status}</Badge>;
    }
};

const ProjectDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { hasPermission } = useAuth();

    const [project, setProject] = useState(null);
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showReportModal, setShowReportModal] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [projectRes, reportsRes] = await Promise.all([
                    api.get(`/projects/${id}`),
                    api.get(`/reports/project/${id}`)
                ]);
                setProject(projectRes.data);
                setReports(reportsRes.data);
            } catch (error) {
                toast.error("Failed to load project details.");
                navigate('/projects');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id, navigate]);

    if (loading) return <Spinner animation="border" />;
    if (!project) return <p>Project not found.</p>;

    return (
        <Container>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <Button variant="outline-secondary" size="sm" onClick={() => navigate('/projects')}>
                    <FaArrowLeft className="me-2" /> Back to Projects
                </Button>
                {hasPermission('FIELD_REPORT_SUBMIT') && (
                    <Button variant="primary" onClick={() => setShowReportModal(true)}>
                        <FaPlus className="me-2" /> Submit Daily Report
                    </Button>
                )}
            </div>

            <FieldReportModal
                show={showReportModal}
                handleClose={() => setShowReportModal(false)}
                project={project}
                onReportSubmit={() => {
                    setShowReportModal(false);
                    // Optionally refresh reports here
                }}
            />
            <Card className="shadow-sm mb-4">
                <Card.Header as="h2" className="d-flex justify-content-between">
                    {project.name}
                    {getStatusBadge(project.status)}
                </Card.Header>
                <Card.Body>
                    <p><strong>Client:</strong> {project.clientName}</p>
                    <p>{project.description}</p>
                </Card.Body>
            </Card>

            <Row>
                <Col md={4}>
                    <Card className="shadow-sm mb-3">
                        <Card.Header as="h5">Assigned Engineers</Card.Header>
                        <ListGroup variant="flush">
                            {project.assignedEngineers.map(eng => (
                                <ListGroup.Item key={eng.id}><FaUser className="me-2" />{eng.firstName} {eng.lastName}</ListGroup.Item>
                            ))}
                        </ListGroup>
                    </Card>
                </Col>
                <Col md={8}>
                    <Card className="shadow-sm">
                         <Card.Header as="h5">Daily Field Reports</Card.Header>
                         <Card.Body>
                            <Table striped bordered hover size="sm">
                                <thead>
                                    <tr><th>Date</th><th>Submitted By</th><th>Update Summary</th></tr>
                                </thead>
                                <tbody>
                                    {reports.map(report => (
                                        <tr key={report.id}>
                                            <td>{new Date(report.reportDate).toLocaleDateString()}</td>
                                            <td>{report.submittedBy.username}</td>
                                            <td>{report.workProgressUpdate.substring(0, 100)}...</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                         </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default ProjectDetailsPage;