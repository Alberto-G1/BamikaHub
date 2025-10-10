// src/pages/RoleForm.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Form, Button, Card, Container, Spinner, Row, Col } from 'react-bootstrap';
import api from '../api/api.js';
import { toast } from 'react-toastify';

const RoleForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditMode = Boolean(id);

    const [roleName, setRoleName] = useState('');
    // State now holds the grouped permissions object
    const [groupedPermissions, setGroupedPermissions] = useState({});
    const [selectedPermissions, setSelectedPermissions] = useState(new Set());
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPermissions = api.get('/roles/permissions');
        
        let fetchRole = Promise.resolve();
        if (isEditMode) {
            fetchRole = api.get(`/roles/${id}`);
        }

        Promise.all([fetchPermissions, fetchRole])
            .then(([permissionsRes, roleRes]) => {
                // The response now has a 'grouped' property
                setGroupedPermissions(permissionsRes.data.grouped);

                if (isEditMode && roleRes) {
                    setRoleName(roleRes.data.name);
                    const initialPermissionIds = new Set(roleRes.data.permissions.map(p => p.id));
                    setSelectedPermissions(initialPermissionIds);
                }
            })
            .catch(err => {
                toast.error('Failed to load data for the form.');
                console.error(err);
            })
            .finally(() => setLoading(false));

    }, [id, isEditMode]);

    const handlePermissionChange = (permissionId) => {
        const newSelection = new Set(selectedPermissions);
        if (newSelection.has(permissionId)) {
            newSelection.delete(permissionId);
        } else {
            newSelection.add(permissionId);
        }
        setSelectedPermissions(newSelection);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const payload = {
            name: roleName,
            permissionIds: Array.from(selectedPermissions),
        };

        try {
            if (isEditMode) {
                await api.put(`/roles/${id}`, payload);
                toast.success(`Role '${roleName}' updated successfully!`);
            } else {
                await api.post('/roles', payload);
                toast.success(`Role '${roleName}' created successfully!`);
            }
            navigate('/roles'); // Go back to the role list
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save role.');
        }
    };
    
    if (loading) return <Spinner animation="border" />;

    return (
        <Container>
            <Card>
                <Card.Header>
                    <Card.Title as="h3">{isEditMode ? `Edit Role` : 'Create New Role'}</Card.Title>
                </Card.Header>
                <Card.Body>
                    <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-4">
                            <Form.Label>Role Name</Form.Label>
                            <Form.Control 
                                type="text" 
                                placeholder="Enter role name" 
                                value={roleName}
                                onChange={(e) => setRoleName(e.target.value)}
                                required
                            />
                        </Form.Group>

                        <Form.Group>
                            <Form.Label>Permissions</Form.Label>
                            <p className="text-muted">Select the permissions this role should have.</p>
                            
                            {/* NEW: Render grouped permissions */}
                            {Object.keys(groupedPermissions).sort().map(groupName => (
                                <Card key={groupName} className="mb-3">
                                    <Card.Header as="h6" className="text-capitalize">{groupName.toLowerCase()} Management</Card.Header>
                                    <Card.Body>
                                        <Row>
                                            {groupedPermissions[groupName].map(permission => (
                                                <Col md={4} sm={6} key={permission.id}>
                                                    <Form.Check 
                                                        type="checkbox"
                                                        id={`permission-${permission.id}`}
                                                        label={permission.name}
                                                        checked={selectedPermissions.has(permission.id)}
                                                        onChange={() => handlePermissionChange(permission.id)}
                                                        className="mb-2"
                                                    />
                                                </Col>
                                            ))}
                                        </Row>
                                    </Card.Body>
                                </Card>
                            ))}
                        </Form.Group>
                        
                        <div className="mt-4">
                            <Button variant="primary" type="submit">Save Role</Button>
                            <Button variant="secondary" className="ms-2" onClick={() => navigate('/roles')}>Cancel</Button>
                        </div>
                    </Form>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default RoleForm;