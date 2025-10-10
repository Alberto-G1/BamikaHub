import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Form, Button, Card, Container, Spinner, Row, Col } from 'react-bootstrap';
import api from '../api/api.js';
import { toast } from 'react-toastify';

const UserForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditMode = Boolean(id);

    // UPDATED: Form state to match the backend entity
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [roleId, setRoleId] = useState('');
    const [statusId, setStatusId] = useState('');
    const [version, setVersion] = useState(0);

    // Data for select dropdowns
    const [roles, setRoles] = useState([]);
    const [statuses, setStatuses] = useState([]);

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch supporting data (roles, statuses)
        const fetchSupportData = async () => {
            try {
                const [rolesRes, statusesRes] = await Promise.all([
                    api.get('/roles'),
                    api.get('/statuses')
                ]);
                setRoles(rolesRes.data);
                setStatuses(statusesRes.data.filter(s => s.name !== 'PENDING'));
            } catch (error) {
                toast.error("Failed to load roles and statuses.");
            }
        };

        const fetchUserData = async () => {
            if (isEditMode) {
                try {
                    const res = await api.get(`/users/${id}`);
                    const userData = res.data;
                    
                    // UPDATED: Populate all the new state fields
                    setFirstName(userData.firstName);
                    setLastName(userData.lastName);
                    setUsername(userData.username);
                    setEmail(userData.email);
                    setRoleId(userData.role.id);
                    setStatusId(userData.status.id);
                    setVersion(userData.version);
                } catch (error) {
                    toast.error("Failed to load user data.");
                    navigate('/users');
                }
            }
        };
        
        const loadAllData = async () => {
            setLoading(true);
            await fetchSupportData();
            await fetchUserData();
            setLoading(false);
        };
        
        loadAllData();
    }, [id, isEditMode, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            if (isEditMode) {
                // UPDATED: Send the correct payload for updating
                const payload = { firstName, lastName, username, email, roleId, statusId, version };
                await api.put(`/users/${id}`, payload);
                toast.success("User updated successfully!");
            } else {
                // UPDATED: Send the correct payload for creating
                const payload = { firstName, lastName, username, email, password, roleId };
                await api.post('/users', payload);
                toast.success("User created successfully!");
            }
            navigate('/users');
        } catch (err) {
            toast.error(err.response?.data?.message || "An error occurred.");
        }
    };
    
    if (loading) return <Spinner animation="border" />;

    return (
        <Container>
            <Card className="shadow-sm">
                <Card.Header>
                    <Card.Title as="h3">{isEditMode ? 'Edit User' : 'Create New User'}</Card.Title>
                </Card.Header>
                <Card.Body>
                    <Form onSubmit={handleSubmit}>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>First Name</Form.Label>
                                    <Form.Control type="text" value={firstName} onChange={e => setFirstName(e.target.value)} required />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Last Name</Form.Label>
                                    <Form.Control type="text" value={lastName} onChange={e => setLastName(e.target.value)} required />
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Username</Form.Label>
                                    <Form.Control type="text" value={username} onChange={e => setUsername(e.target.value)} required />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Email</Form.Label>
                                    <Form.Control type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                                </Form.Group>
                            </Col>
                        </Row>
                        
                        {!isEditMode && (
                             <Form.Group className="mb-3">
                                <Form.Label>Password</Form.Label>
                                <Form.Control type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Enter initial password"/>
                            </Form.Group>
                        )}
                         <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Role</Form.Label>
                                    <Form.Select value={roleId} onChange={e => setRoleId(e.target.value)} required>
                                        <option value="">Select a role...</option>
                                        {roles.map(role => <option key={role.id} value={role.id}>{role.name}</option>)}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                             {isEditMode && (
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Status</Form.Label>
                                        <Form.Select value={statusId} onChange={e => setStatusId(e.target.value)} required>
                                            <option value="">Select a status...</option>
                                            {statuses.map(status => <option key={status.id} value={status.id}>{status.name}</option>)}
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                             )}
                        </Row>
                        <div className="mt-3">
                            <Button variant="primary" type="submit">Save User</Button>
                            <Button variant="secondary" className="ms-2" onClick={() => navigate('/users')}>Cancel</Button>
                        </div>
                    </Form>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default UserForm;