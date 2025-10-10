import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Form, Button, Card, Container, Spinner, Row, Col } from 'react-bootstrap';
import api from '../api/api.js';
import { toast } from 'react-toastify';
import Select from 'react-select'; // We'll use a better multi-select library

const ProjectForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditMode = Boolean(id);
    const [loading, setLoading] = useState(true);

    // Form State
    const [formData, setFormData] = useState({
        name: '', clientName: '', description: '',
        status: 'PLANNING', startDate: '', endDate: ''
    });
    const [assignedEngineers, setAssignedEngineers] = useState([]);

    // Data for dropdowns
    const [allEngineers, setAllEngineers] = useState([]);

    useEffect(() => {
        const fetchEngineers = async () => {
            try {
                // Fetch users who are Field Engineers (or Admins/Managers)
                const res = await api.get('/users');
                const engineerOptions = res.data
                    .filter(user => ['Field Engineer (Civil)', 'Admin', 'Inventory & Operations Manager'].includes(user.role.name))
                    .map(user => ({ value: user.id, label: `${user.firstName} ${user.lastName}` }));
                setAllEngineers(engineerOptions);
            } catch (error) {
                toast.error("Failed to load engineers list.");
            }
        };

        const fetchProjectData = async () => {
            if (isEditMode) {
                try {
                    const res = await api.get(`/projects/${id}`);
                    const project = res.data;
                    setFormData({
                        name: project.name || '',
                        clientName: project.clientName || '',
                        description: project.description || '',
                        status: project.status || 'PLANNING',
                        startDate: project.startDate || '',
                        endDate: project.endDate || ''
                    });
                    const selectedEngineers = project.assignedEngineers.map(user => ({
                        value: user.id, label: `${user.firstName} ${user.lastName}`
                    }));
                    setAssignedEngineers(selectedEngineers);
                } catch (error) {
                    toast.error('Failed to load project data.');
                    navigate('/projects');
                }
            }
        };

        const loadAll = async () => {
            setLoading(true);
            await fetchEngineers();
            await fetchProjectData();
            setLoading(false);
        };

        loadAll();
    }, [id, isEditMode, navigate]);

    const handleFormChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const payload = {
            ...formData,
            assignedEngineerIds: assignedEngineers.map(eng => eng.value)
        };

        try {
            if (isEditMode) {
                await api.put(`/projects/${id}`, payload); // <-- We need to build this endpoint
                toast.success("Project updated successfully!");
            } else {
                await api.post('/projects', payload);
                toast.success("Project created successfully!");
            }
            navigate('/projects');
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to save project.");
        }
    };

    if (loading) return <Spinner animation="border" />;

    return (
        <Container>
            <Card className="shadow-sm">
                <Card.Header as="h3">{isEditMode ? 'Edit Project' : 'Create New Project'}</Card.Header>
                <Card.Body>
                    <Form onSubmit={handleSubmit}>
                        <Row>
                            <Col md={8}><Form.Group className="mb-3">
                                <Form.Label>Project Name</Form.Label>
                                <Form.Control name="name" value={formData.name} onChange={handleFormChange} required />
                            </Form.Group></Col>
                            <Col md={4}><Form.Group className="mb-3">
                                <Form.Label>Client Name</Form.Label>
                                <Form.Control name="clientName" value={formData.clientName} onChange={handleFormChange} required />
                            </Form.Group></Col>
                        </Row>
                        <Form.Group className="mb-3">
                            <Form.Label>Description</Form.Label>
                            <Form.Control as="textarea" rows={4} name="description" value={formData.description} onChange={handleFormChange} />
                        </Form.Group>
                        <Row>
                            <Col md={4}><Form.Group className="mb-3">
                                <Form.Label>Start Date</Form.Label>
                                <Form.Control type="date" name="startDate" value={formData.startDate} onChange={handleFormChange} />
                            </Form.Group></Col>
                            <Col md={4}><Form.Group className="mb-3">
                                <Form.Label>End Date</Form.Label>
                                <Form.Control type="date" name="endDate" value={formData.endDate} onChange={handleFormChange} />
                            </Form.Group></Col>
                             <Col md={4}><Form.Group className="mb-3">
                                <Form.Label>Status</Form.Label>
                                <Form.Select name="status" value={formData.status} onChange={handleFormChange} required>
                                    <option value="PLANNING">Planning</option>
                                    <option value="IN_PROGRESS">In Progress</option>
                                    <option value="ON_HOLD">On Hold</option>
                                    <option value="COMPLETED">Completed</option>
                                    <option value="CANCELLED">Cancelled</option>
                                </Form.Select>
                            </Form.Group></Col>
                        </Row>
                        <Form.Group className="mb-3">
                            <Form.Label>Assign Engineers</Form.Label>
                            <Select
                                isMulti
                                name="engineers"
                                options={allEngineers}
                                className="basic-multi-select"
                                classNamePrefix="select"
                                value={assignedEngineers}
                                onChange={setAssignedEngineers}
                            />
                        </Form.Group>
                        <Button variant="primary" type="submit">Save Project</Button>
                        <Button variant="secondary" className="ms-2" onClick={() => navigate('/projects')}>Cancel</Button>
                    </Form>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default ProjectForm;