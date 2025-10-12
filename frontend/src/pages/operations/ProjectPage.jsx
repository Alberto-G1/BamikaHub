import React, { useState, useEffect, useMemo } from 'react';
import { Card, Row, Col, InputGroup, Form, Badge, Spinner, Button } from 'react-bootstrap';
import { FaPlus, FaSearch, FaProjectDiagram, FaArchive } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import api from '../../api/api.js';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext.jsx';

// Helper to get a color for the project status
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

const ProjectPage = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { hasPermission } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        setLoading(true);
        try {
            const response = await api.get('/projects');
            setProjects(response.data);
        } catch (err) {
            toast.error('Failed to fetch projects.');
        } finally {
            setLoading(false);
        }
    };

    const handleArchive = async (projectId, projectName, event) => {
        event.stopPropagation(); // Prevent card's onClick from firing
        
        const toastId = toast.warn(
            <div>
                <p>Archive project <strong>{projectName}</strong>?</p>
                <p className="small text-muted">It will be moved to the archived projects list.</p>
                <div className="mt-2">
                    <Button variant="warning" size="sm" className="me-2" onClick={async () => {
                        try {
                            await api.post(`/projects/${projectId}/archive`);
                            toast.success("Project archived successfully.");
                            fetchProjects(); // Refresh the list
                        } catch (error) {
                            toast.error(error.response?.data?.message || "Failed to archive project.");
                        }
                        toast.dismiss(toastId);
                    }}>Confirm Archive</Button>
                    <Button variant="light" size="sm" onClick={() => toast.dismiss(toastId)}>Cancel</Button>
                </div>
            </div>,
            { autoClose: false, closeOnClick: false, position: "top-center" }
        );
    };

    const filteredProjects = useMemo(() => {
        if (!projects) return [];
        return projects.filter(project =>
            project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            project.clientName.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [projects, searchQuery]);

    if (loading) return <Spinner animation="border" />;

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Active Projects</h2>
                <div>
                    {hasPermission('PROJECT_READ') && (
                        <Button variant="outline-secondary" className="me-2" onClick={() => navigate('/projects/archived')}>
                            <FaArchive className="me-2" /> View Archived
                        </Button>
                    )}
                    {hasPermission('PROJECT_CREATE') && (
                        <Button variant="primary" onClick={() => navigate('/projects/new')}>
                            <FaPlus className="me-2" /> New Project
                        </Button>
                    )}
                </div>
            </div>
            <InputGroup className="mb-4 shadow-sm">
                <InputGroup.Text><FaSearch /></InputGroup.Text>
                <Form.Control 
                    placeholder="Search by Project Name or Client..." 
                    value={searchQuery} 
                    onChange={e => setSearchQuery(e.target.value)} 
                />
            </InputGroup>

            <Row xs={1} md={2} lg={3} className="g-4">
                {filteredProjects.map(project => (
                    <Col key={project.id}>
                        <Card className="h-100 shadow-sm inventory-card" onClick={() => navigate(`/projects/${project.id}`)}>
                            <Card.Header className="d-flex justify-content-between align-items-center">
                                <span className="fw-bold text-primary">{project.clientName}</span>
                                {getStatusBadge(project.status)}
                            </Card.Header>
                            <Card.Body>
                                <Card.Title className="inventory-card-title">{project.name}</Card.Title>
                                <Card.Text className="text-muted small">
                                    Start Date: {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'N/A'}
                                </Card.Text>
                            </Card.Body>
                            <Card.Footer className="d-flex justify-content-between align-items-center">
                                <span className="text-muted small">
                                    {project.sites?.length || 0} Sites | {project.assignedEngineers?.length || 0} Engineers
                                </span>
                                {project.status === 'COMPLETED' && hasPermission('PROJECT_DELETE') && (
                                    <Button variant="outline-secondary" size="sm" title="Archive Project" onClick={(e) => handleArchive(project.id, project.name, e)}>
                                        <FaArchive />
                                    </Button>
                                )}
                            </Card.Footer>
                        </Card>
                    </Col>
                ))}
            </Row>
        </div>
    );
};

export default ProjectPage;