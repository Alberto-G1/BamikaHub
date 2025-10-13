import React, { useState, useEffect } from 'react';
import { Table, Button, Spinner, Card, Badge } from 'react-bootstrap';
import { FaArrowLeft } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import api from '../../api/api.js';
import { toast } from 'react-toastify';

const ArchivedProjectsPage = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchArchivedProjects = async () => {
            setLoading(true);
            try {
                const response = await api.get('/projects/archived');
                setProjects(response.data);
            } catch (err) {
                toast.error('Failed to fetch archived projects.');
            } finally {
                setLoading(false);
            }
        };
        fetchArchivedProjects();
    }, []);

    if (loading) return <Spinner animation="border" />;

    return (
        <Card className="shadow-sm">
            <Card.Header className="d-flex justify-content-between align-items-center">
                <Card.Title as="h3" className="mb-0">Archived Projects</Card.Title>
                <Button variant="outline-secondary" onClick={() => navigate('/projects')}>
                    <FaArrowLeft className="me-2" /> Back to Active Projects
                </Button>
            </Card.Header>
            <Card.Body>
                <Table striped bordered hover responsive>
                    <thead>
                        <tr>
                            <th>Project Name</th>
                            <th>Client</th>
                            <th>Status</th>
                            <th>End Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {projects.map(project => (
                            <tr key={project.id}>
                                <td>{project.name}</td>
                                <td>{project.clientName}</td>
                                <td><Badge bg="secondary">Archived</Badge></td>
                                <td>{project.endDate ? new Date(project.endDate).toLocaleDateString() : 'N/A'}</td>
                                <td>
                                    <Button size="sm" variant="info" onClick={() => navigate(`/projects/${project.id}`)}>
                                        View Details
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </Card.Body>
        </Card>
    );
};

export default ArchivedProjectsPage;