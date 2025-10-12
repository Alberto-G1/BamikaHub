import React, { useState, useEffect, useMemo } from 'react';
import { Table, Button, Spinner, Card, Badge, Tabs, Tab } from 'react-bootstrap';
import { FaPlus, FaMoneyCheckAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import api from '../api/api.js';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext.jsx';

// Helper to get a color for the requisition status
const getStatusBadge = (status) => {
    switch (status) {
        case 'PENDING': return <Badge bg="warning" text="dark">Pending</Badge>;
        case 'APPROVED_BY_FINANCE': return <Badge bg="success">Approved</Badge>;
        case 'REJECTED': return <Badge bg="danger">Rejected</Badge>;
        case 'FULFILLED': return <Badge bg="info">Fulfilled</Badge>;
        case 'CLOSED': return <Badge bg="secondary">Closed</Badge>;
        default: return <Badge bg="light" text="dark">{status}</Badge>;
    }
};

const RequisitionPage = () => {
    const [requisitions, setRequisitions] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { hasPermission } = useAuth();
    const [activeTab, setActiveTab] = useState('PENDING');

    useEffect(() => {
        fetchRequisitions();
    }, []);

    const fetchRequisitions = async () => {
        setLoading(true);
        try {
            const response = await api.get('/requisitions');
            setRequisitions(response.data);
        } catch (err) {
            toast.error('Failed to fetch requisitions.');
        } finally {
            setLoading(false);
        }
    };

    const filteredRequisitions = useMemo(() => {
        if (!requisitions) return [];
        return requisitions.filter(req => req.status === activeTab);
    }, [requisitions, activeTab]);

    if (loading) return <Spinner animation="border" />;

    return (
        <Card className="shadow-sm">
            <Card.Header className="d-flex justify-content-between align-items-center">
                <Card.Title as="h3" className="mb-0 d-flex align-items-center">
                    <FaMoneyCheckAlt className="me-3" /> Requisitions
                </Card.Title>
                {hasPermission('REQUISITION_CREATE') && (
                    <Button variant="primary" onClick={() => navigate('/requisitions/new')}>
                        <FaPlus className="me-2" /> New Requisition
                    </Button>
                )}
            </Card.Header>
            <Card.Body>
                <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-3">
                    <Tab eventKey="PENDING" title={`Pending (${requisitions.filter(r=>r.status === 'PENDING').length})`} />
                    <Tab eventKey="APPROVED_BY_FINANCE" title={`Approved (${requisitions.filter(r=>r.status === 'APPROVED_BY_FINANCE').length})`} />
                    <Tab eventKey="REJECTED" title={`Rejected (${requisitions.filter(r=>r.status === 'REJECTED').length})`} />
                    <Tab eventKey="FULFILLED" title={`Fulfilled (${requisitions.filter(r=>r.status === 'FULFILLED').length})`} />
                </Tabs>
                
                <Table striped bordered hover responsive>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Project</th>
                            <th>Requested By</th>
                            <th>Date Needed</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredRequisitions.map(req => (
                            <tr key={req.id}>
                                <td>REQ-{String(req.id).padStart(4, '0')}</td>
                                <td>{req.project?.name || 'N/A'}</td>
                                <td>{req.requestedBy?.username || 'N/A'}</td>
                                <td>{new Date(req.dateNeeded).toLocaleDateString()}</td>
                                <td>{getStatusBadge(req.status)}</td>
                                <td>
                                    <Button variant="outline-primary" size="sm" onClick={() => navigate(`/requisitions/${req.id}`)}>
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

export default RequisitionPage;