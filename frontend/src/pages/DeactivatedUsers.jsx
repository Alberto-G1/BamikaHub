import React, { useState, useEffect } from 'react';
import { Table, Button, Spinner, Alert, Badge, Card } from 'react-bootstrap';
import { FaUndo, FaArrowLeft } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import api from '../api/api.js';
import { toast } from 'react-toastify';

const DeactivatedUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await api.get('/users/deactivated');
            setUsers(response.data);
        } catch (err) {
            toast.error('Failed to fetch deactivated users.');
        } finally {
            setLoading(false);
        }
    };

    const handleReactivate = async (userId, userFullName) => {
        try {
            await api.post(`/users/${userId}/reactivate`);
            toast.success(`User '${userFullName}' has been reactivated.`);
            fetchData(); // Refresh the list
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to reactivate user.');
        }
    };

    if (loading) return <Spinner animation="border" />;

    return (
        <Card className="shadow-sm">
            <Card.Header className="d-flex justify-content-between align-items-center">
                <Card.Title as="h3" className="mb-0">Deactivated Users</Card.Title>
                <Button variant="outline-secondary" onClick={() => navigate('/users')}>
                    <FaArrowLeft className="me-2" /> Back to Active Users
                </Button>
            </Card.Header>
            <Card.Body>
                {users.length === 0 ? (
                    <Alert variant="info">There are no deactivated users.</Alert>
                ) : (
                    <Table striped bordered hover responsive className="align-middle">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => {
                                const userFullName = `${user.firstName} ${user.lastName}`;
                                return (
                                    <tr key={user.id}>
                                        <td>{userFullName}</td>
                                        <td>{user.email}</td>
                                        <td>{user.role.name}</td>
                                        <td>
                                            <Button variant="info" size="sm" onClick={() => handleReactivate(user.id, userFullName)} title="Reactivate User">
                                                <FaUndo /> Reactivate
                                            </Button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </Table>
                )}
            </Card.Body>
        </Card>
    );
};

export default DeactivatedUsers;