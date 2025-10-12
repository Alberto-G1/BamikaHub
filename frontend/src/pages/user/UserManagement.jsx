import React, { useState, useEffect, useMemo } from 'react';
import { Table, Button, Spinner, Alert, Badge, Form, Row, Col, InputGroup, Card, Image } from 'react-bootstrap';
import { FaEdit, FaPlus, FaCheck, FaTimes, FaSearch, FaUserCircle, FaArchive } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import api from '../../api/api.js';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext.jsx';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { hasPermission } = useAuth();

    // Filtering and Searching State
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await api.get('/users');
            setUsers(response.data);
        } catch (err) {
            setError('Failed to fetch users. Please try again.');
            toast.error('Failed to fetch users.');
        } finally {
            setLoading(false);
        }
    };

        const handleDeactivate = async (userId, userFullName) => {
        try {
            await api.post(`/users/${userId}/deactivate`);
            toast.warn(`User '${userFullName}' has been deactivated.`);
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to deactivate user.');
        }
    };
    
    // Custom Confirmation Toast for deactivating
    const confirmDeactivate = (userId, userFullName) => {
        const toastId = toast.warn(
            <div>
                <p>Deactivate user <strong>{userFullName}</strong>?</p>
                <p className="small text-muted">They will be moved to the deactivated list and can be reactivated later.</p>
                <div className="mt-3">
                    <Button variant="warning" size="sm" className="me-2" onClick={() => { handleDeactivate(userId, userFullName); toast.dismiss(toastId); }}>Yes, Deactivate</Button>
                    <Button variant="secondary" size="sm" onClick={() => toast.dismiss(toastId)}>Cancel</Button>
                </div>
            </div>,
            { autoClose: false, closeOnClick: false, position: "top-center" }
        );
    };

    const handleApprove = async (userId) => {
        // Assign the default 'Staff' role (ID 3) on approval.
        const defaultStaffRoleId = 3;
        try {
            await api.post(`/users/${userId}/approve`, defaultStaffRoleId, {
                 headers: { 'Content-Type': 'application/json' }
            });
            toast.success('User approved successfully!');
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to approve user.');
        }
    };
    
    const handleReject = async (userId, userFullName) => {
        try {
            await api.delete(`/users/${userId}`);
            toast.info(`Registration for ${userFullName} has been rejected.`);
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to reject user.');
        }
    };
    
    const confirmReject = (userId, userFullName) => {
        const toastId = toast(
            <div>
                <p className="mb-2">Reject registration for <strong>{userFullName}</strong>?</p>
                <p className="small text-muted">This will permanently delete the user record.</p>
                <div className="mt-3">
                    <Button variant="danger" size="sm" className="me-2" onClick={() => {
                        handleReject(userId, userFullName);
                        toast.dismiss(toastId);
                    }}>
                        Yes, Reject
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => toast.dismiss(toastId)}>
                        Cancel
                    </Button>
                </div>
            </div>,
            {
                autoClose: false,
                closeOnClick: false,
                draggable: false,
                position: "top-center",
                theme: "light",
            }
        );
    };

    const filteredUsers = useMemo(() => {
        return users
            .filter(user => {
                // Status filter
                if (statusFilter === 'ALL') return true;
                return user.status.name === statusFilter;
            })
            .filter(user => {
                // Search filter (case-insensitive)
                const searchLower = searchQuery.toLowerCase();
                const fullName = `${user.firstName || ''} ${user.lastName || ''}`;
                
                return fullName.toLowerCase().includes(searchLower) ||
                       (user.username && user.username.toLowerCase().includes(searchLower)) ||
                       user.email.toLowerCase().includes(searchLower);
            });
    }, [users, statusFilter, searchQuery]);

    if (loading) return <Spinner animation="border" />;
    if (error) return <Alert variant="danger">{error}</Alert>;

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>User Management</h2>
                <div> {/* Wrapper div for buttons on the right */}
                    <Button variant="outline-secondary" className="me-2" onClick={() => navigate('/users/deactivated')}>
                        <FaArchive className="me-2" /> View Deactivated
                    </Button>
                    {hasPermission('USER_CREATE') && (
                        <Button variant="primary" onClick={() => navigate('/users/new')}>
                            <FaPlus className="me-2" /> Add User
                        </Button>
                    )}
                </div>
            </div>

            <Card className="mb-4 shadow-sm">
                <Card.Body>
                    <Row className="align-items-center">
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label>Filter by Status</Form.Label>
                                <Form.Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                                    <option value="ALL">All</option>
                                    <option value="PENDING">Pending</option>
                                    <option value="ACTIVE">Active</option>
                                    <option value="SUSPENDED">Suspended</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={8}>
                             <Form.Group>
                                <Form.Label>Search by Name, Username, or Email</Form.Label>
                                <InputGroup>
                                    <InputGroup.Text><FaSearch /></InputGroup.Text>
                                    <Form.Control 
                                        type="text"
                                        placeholder="Search..."
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                    />
                                </InputGroup>
                            </Form.Group>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            <Table striped bordered hover responsive className="align-middle">
                <thead>
                    <tr>
                        <th style={{ width: '25%' }}>Name</th>
                        <th>Username</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Joined</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredUsers.map(user => {
                        const userFullName = `${user.firstName} ${user.lastName}`;

                        return (
                            <tr key={user.id}>
                                <td>
                                    <div className="d-flex align-items-center">
                                        {user.profilePictureUrl ? (
                                            <Image 
                                                src={`http://localhost:8080${user.profilePictureUrl}`} 
                                                roundedCircle 
                                                width="40" 
                                                height="40" 
                                                className="me-3"
                                                style={{ objectFit: 'cover' }}
                                            />
                                        ) : (
                                            <FaUserCircle size={40} className="text-muted me-3" />
                                        )}
                                        <span>{userFullName}</span>
                                    </div>
                                </td>
                                <td>{user.username}</td>
                                <td>{user.email}</td>
                                <td>{user.role.name}</td>
                                <td>
                                    <Badge pill style={{ backgroundColor: user.status.color, color: '#fff' }}>
                                        {user.status.name}
                                    </Badge>
                                </td>
                                <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                                <td>
                                    {user.status.name === 'PENDING' ? (
                                        <>
                                            {hasPermission('USER_APPROVE') && (
                                                <Button variant="success" size="sm" className="me-2" onClick={() => handleApprove(user.id)} title="Approve">
                                                    <FaCheck />
                                                </Button>
                                            )}
                                            {hasPermission('USER_DELETE') && (
                                                // UPDATED: Calls the new confirmation toast function
                                                <Button variant="danger" size="sm" onClick={() => confirmReject(user.id, userFullName)} title="Reject">
                                                    <FaTimes />
                                                </Button>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            {hasPermission('USER_UPDATE') && (
                                                <Button variant="warning" size="sm" className="me-2" onClick={() => navigate(`/users/edit/${user.id}`)} title="Edit">
                                                    <FaEdit />
                                                </Button>
                                            )}

                                            {hasPermission('USER_DELETE') && ( // Using DELETE permission for deactivation
                                                <Button variant="danger" size="sm" onClick={() => confirmDeactivate(user.id, userFullName)} title="Deactivate">
                                                    <FaArchive />
                                                </Button>
                                            )} 
                                            {/* You can add a delete button for active users here, which would also call a confirmation toast */}
                                        </>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </Table>
        </div>
    );
};

export default UserManagement;