import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Card, Row, Col, Button, Spinner, Tabs, Tab, Badge, Table, ListGroup, Image } from 'react-bootstrap';
import { FaArrowLeft, FaPlus, FaUser, FaEdit, FaImage } from 'react-icons/fa';
import api from '../../api/api.js';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext.jsx';
import FieldReportModal from '../../components/operations/FieldReportModal.jsx';
import ReportViewModal from '../../components/operations/ReportViewModal.jsx';
import placeholderImage from '../../assets/images/placeholder.jpg';

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
    const [selectedReport, setSelectedReport] = useState(null);

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

    useEffect(() => {
        fetchData();
    }, [id, navigate]);

    if (loading) return <Spinner animation="border" />;
    if (!project) return <p>Project not found.</p>;

    return (
        <>
            <Container>
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <Button variant="outline-secondary" size="sm" onClick={() => navigate('/projects')}>
                        <FaArrowLeft className="me-2" /> Back to Projects
                    </Button>
                    <div>
                        {hasPermission('PROJECT_UPDATE') && (
                            <Button variant="outline-warning" className="me-2" onClick={() => navigate(`/projects/edit/${id}`)}>
                                <FaEdit className="me-2" /> Edit Project
                            </Button>
                        )}
                        {hasPermission('FIELD_REPORT_SUBMIT') && (
                            <Button variant="primary" onClick={() => setShowReportModal(true)}>
                                <FaPlus className="me-2" /> Submit Daily Report
                            </Button>
                        )}
                    </div>
                </div>
                
                <Card className="shadow-sm mb-4">
                    <Card.Header as="h2" className="d-flex justify-content-between align-items-center">
                        {project.name}
                        {getStatusBadge(project.status)}
                    </Card.Header>
                    <Card.Body>
                        <p><strong>Client:</strong> {project.clientName}</p>
                        <p>{project.description}</p>
                    </Card.Body>
                </Card>

                <Tabs defaultActiveKey="reports" id="project-details-tabs" className="mb-3">
                    <Tab eventKey="reports" title={`Daily Reports (${reports.length})`}>
                        <Card className="shadow-sm">
                            <Card.Body>
                                {reports.length > 0 ? (
                                    <Table striped bordered hover responsive size="sm">
                                        <thead>
                                            <tr><th>Report Date</th><th>Submitted By</th><th>Update Summary</th><th>Attachment</th></tr>
                                        </thead>
                                        <tbody>
                                            {reports.map(report => (
                                                <tr key={report.id} onClick={() => setSelectedReport(report)} style={{ cursor: 'pointer' }}>
                                                    <td>{new Date(report.reportDate).toLocaleDateString()}</td>
                                                    <td>{report.submittedBy.username}</td>
                                                    <td>{report.workProgressUpdate.substring(0, 100)}{report.workProgressUpdate.length > 100 ? '...' : ''}</td>
                                                    <td>{report.reportFileUrl ? 'Yes' : 'No'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                ) : (
                                    <p className="text-muted">No daily reports have been submitted for this project yet.</p>
                                )}
                            </Card.Body>
                        </Card>
                    </Tab>
                    <Tab eventKey="gallery" title="Project Gallery">
                        <Card className="shadow-sm">
                             <Card.Header className="d-flex justify-content-between align-items-center">
                                <h5>Image Gallery</h5>
                                <Button variant="outline-primary" size="sm">
                                    <FaImage className="me-2" /> Add Image
                                </Button>
                             </Card.Header>
                             <Card.Body>
                                <p className="text-muted">Gallery feature coming soon.</p>
                                {/* Gallery images will be displayed here in a grid */}
                             </Card.Body>
                        </Card>
                    </Tab>
                    <Tab eventKey="engineers" title={`Assigned Engineers (${project.assignedEngineers.length})`}>
                        <Card className="shadow-sm">
                            <ListGroup variant="flush">
                                {project.assignedEngineers.map(eng => (
                                    <ListGroup.Item key={eng.id} className="d-flex align-items-center">
                                        <Image src={`http://localhost:8080${eng.profilePictureUrl}`} roundedCircle width={30} height={30} className="me-2" style={{objectFit: 'cover'}}/>
                                        {eng.firstName} {eng.lastName}
                                    </ListGroup.Item>
                                ))}
                            </ListGroup>
                        </Card>
                    </Tab>
                </Tabs>
            </Container>

            <FieldReportModal
                show={showReportModal}
                handleClose={() => setShowReportModal(false)}
                project={project}
                onReportSubmit={fetchData}
            />

            <ReportViewModal 
                show={selectedReport !== null}
                handleClose={() => setSelectedReport(null)}
                report={selectedReport}
            />
        </>
    );
};

export default ProjectDetailsPage;