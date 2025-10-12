import React, { useState, useEffect } from 'react';
import { Button, Spinner, Alert, Card, Row, Col } from 'react-bootstrap';
import { FaEdit, FaTrash, FaPlus, FaShieldAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import api from '../../api/api.js';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext.jsx';


const RoleManagement = () => {
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { hasPermission } = useAuth();


    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const rolesRes = await api.get('/roles');
            setRoles(rolesRes.data);
        } catch (err) {
            setError('Failed to fetch roles. Please try again.');
        } finally {
            setLoading(false);
        }
    };
    
    // Custom Confirmation Toast
    const confirmDelete = (roleId, roleName) => {
        const toastId = toast(
            <div>
                <p>Delete role '<strong>{roleName}</strong>'?</p>
                <Button variant="danger" size="sm" className="me-2" onClick={() => {
                    handleDelete(roleId);
                    toast.dismiss(toastId);
                }}>Confirm Delete</Button>
                <Button variant="secondary" size="sm" onClick={() => toast.dismiss(toastId)}>Cancel</Button>
            </div>, 
            {
                autoClose: false,
                closeOnClick: false,
                draggable: false,
                position: "top-center"
            }
        );
    };

    const handleDelete = async (roleId) => {
        try {
            await api.delete(`/roles/${roleId}`);
            toast.success('Role deleted successfully!');
            fetchData(); // Refetch data
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to delete role.');
        }
    };

    if (loading) return <Spinner animation="border" />;
    if (error) return <Alert variant="danger">{error}</Alert>;
    
    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Roles & Permissions</h2>
                {hasPermission('ROLE_CREATE') && (
                    <Button variant="primary" onClick={() => navigate('/roles/new')}>
                        <FaPlus className="me-2" /> Add New Role
                    </Button>
                )}
            </div>
            
            <Row xs={1} md={2} lg={3} xl={4} className="g-4">
                {roles.map(role => (
                    <Col key={role.id}>
                        <Card className="h-100 shadow-sm">
                            <Card.Body className="d-flex flex-column">
                                <Card.Title as="h5" className="d-flex align-items-center">
                                    <FaShieldAlt className="me-2 text-primary" />
                                    {role.name}
                                </Card.Title>
                                <Card.Text className="text-muted flex-grow-1">
                                    This role has <strong>{role.permissions.length}</strong> permissions assigned.
                                </Card.Text>
                                <div className="mt-auto">
                                    {hasPermission('ROLE_UPDATE') && (
                                        <Button 
                                            variant="outline-warning" 
                                            size="sm" 
                                            className="me-2 w-50"
                                            onClick={() => navigate(`/roles/edit/${role.id}`)}
                                        >
                                            <FaEdit className="me-1" /> Edit
                                        </Button>
                                    )}
                                    {hasPermission('ROLE_DELETE') && (
                                        <Button 
                                            variant="outline-danger" 
                                            size="sm" 
                                            className="w-50"
                                            onClick={() => confirmDelete(role.id, role.name)}
                                    >
                                        <FaTrash className="me-1" /> Delete
                                    </Button>
                                    )}
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                ))}
            </Row>
        </div>
    );
};

export default RoleManagement;