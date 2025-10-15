import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Card, Row, Col, Button, Spinner, Badge, Table, Form, ListGroup, Alert } from 'react-bootstrap';
import { FaArrowLeft, FaEdit, FaTrash, FaHistory } from 'react-icons/fa';import api from '../../api/api.js';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext.jsx';
import FulfillmentModal from '../../components/finance/FulfillmentModal.jsx';

// Helper to get a color for the requisition status
const getStatusBadge = (status) => {
    switch (status) {
        case 'PENDING': return <Badge bg="warning" text="dark">Pending Approval</Badge>;
        case 'APPROVED_BY_FINANCE': return <Badge bg="success">Approved</Badge>;
        case 'REJECTED': return <Badge bg="danger">Rejected</Badge>;
        case 'FULFILLED': return <Badge bg="info">Fulfilled</Badge>;
        case 'CLOSED': return <Badge bg="secondary">Closed</Badge>;
        default: return <Badge bg="light" text="dark">{status}</Badge>;
    }
};

// Reusable currency formatter for UGX
const formatCurrency = (amount) => {
    if (amount === null || amount === undefined || isNaN(amount)) return 'USh 0';
    return new Intl.NumberFormat('en-UG', {
        style: 'currency',
        currency: 'UGX',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};

const RequisitionDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, hasPermission } = useAuth();
    const [requisition, setRequisition] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notes, setNotes] = useState('');
    const [showFulfillmentModal, setShowFulfillmentModal] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/requisitions/${id}`);
            setRequisition(res.data);
        } catch (error) {
            toast.error("Failed to load requisition details.");
            navigate('/requisitions');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { 
        fetchData(); 
    }, [id, navigate]);

    // A generic handler for all state-changing actions
    const handleAction = async (action) => {
        if ((action === 'reject' || action === 'close') && !notes.trim()) {
            toast.error("Notes or a reason are required for this action.");
            return;
        }

        const endpoint = `/requisitions/${id}/${action}`;
        const payload = { notes };
        try {
            await api.post(endpoint, payload);
            toast.success(`Requisition has been ${action}ed successfully.`);
            setNotes(''); // Clear notes field after action
            fetchData(); // Refresh data to show the new status and history
        } catch (error) {
            toast.error(error.response?.data?.message || 'Action failed.');
        }
    };
    
    const handleDelete = async () => {
        const toastId = toast.error(
            <div>
                <p><strong>Permanently delete this requisition?</strong></p>
                <p className="small text-muted">This action cannot be undone.</p>
                <div className="mt-2">
                    <Button variant="danger" size="sm" className="me-2" onClick={async () => {
                        try {
                            await api.delete(`/requisitions/${id}`);
                            toast.warn("Requisition has been deleted.");
                            navigate('/requisitions');
                        } catch (error) {
                            toast.error(error.response?.data?.message || "Failed to delete requisition.");
                        }
                        toast.dismiss(toastId);
                    }}>
                        Confirm Delete
                    </Button>
                    <Button variant="light" size="sm" onClick={() => toast.dismiss(toastId)}>
                        Cancel
                    </Button>
                </div>
            </div>,
            { autoClose: false, closeOnClick: false, position: "top-center", theme: "colored" }
        );
    };

    if (loading) {
         return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
                <Spinner animation="border" />
            </div>
        );
    }

    if (!requisition) return null;

    const totalEstimatedCost = requisition.items.reduce((acc, item) => {
        const cost = item.estimatedUnitCost || 0;
        const quantity = item.quantity || 0;
        return acc + (quantity * cost);
    }, 0);

    const renderActionCard = () => {
        // Finance Manager sees Approve/Reject for PENDING requisitions
       if (hasPermission('REQUISITION_APPROVE') && requisition.status === 'PENDING') {
            return (
                <Card className="shadow-sm">
                    <Card.Header as="h5">Approval Action</Card.Header>
                    <Card.Body>
                        {requisition.submissionCount > 1 && requisition.notesHistory && (
                            <Alert variant="warning">
                                <Alert.Heading><FaHistory className="me-2" /> Resubmission History</Alert.Heading>
                                <p className="mb-1 small">This requisition was previously rejected. Review the reason below before approving.</p>
                                <hr />
                                <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.8rem', maxHeight: '150px', overflowY: 'auto' }}>
                                    {requisition.notesHistory}
                                </pre>
                            </Alert>
                        )}
                        <Form.Group className="mb-3">
                            <Form.Label>Notes / Reason for Rejection</Form.Label>
                            <Form.Control as="textarea" rows={4} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Required for rejection..."/>
                        </Form.Group>
                        <div className="d-grid gap-2">
                            <Button variant="success" onClick={() => handleAction('approve')}>Approve</Button>
                            <Button variant="danger" onClick={() => handleAction('reject')}>Reject</Button>
                        </div>
                    </Card.Body>
                </Card>
            );
        }
        
        // Inventory Manager sees Fulfill for APPROVED requisitions
        if (hasPermission('ITEM_UPDATE') && requisition.status === 'APPROVED_BY_FINANCE') {
            return (
                 <Card className="shadow-sm">
                    <Card.Header as="h5">Fulfillment Action</Card.Header>
                    <Card.Body>
                        <p className="text-muted">Procure the requested items and record the fulfillment action.</p>
                        <div className="d-grid">
                            <Button variant="primary" onClick={() => setShowFulfillmentModal(true)}>
                                Fulfill Requisition
                            </Button>
                        </div>
                    </Card.Body>
                </Card>
            );
        }
        
        // Finance Manager sees Close for FULFILLED requisitions
        if (hasPermission('REQUISITION_APPROVE') && requisition.status === 'FULFILLED') {
             return (
                 <Card className="shadow-sm">
                    <Card.Header as="h5">Closing Action</Card.Header>
                    <Card.Body>
                        <Form.Group className="mb-3">
                            <Form.Label>Closing Notes</Form.Label>
                            <Form.Control as="textarea" rows={4} value={notes} onChange={e => setNotes(e.target.value)} required />
                        </Form.Group>
                        <div className="d-grid">
                            <Button variant="secondary" onClick={() => handleAction('close')}>Close Requisition</Button>
                        </div>
                    </Card.Body>
                </Card>
            );
        }

        // Default: Show history card for all other states or if user has no action permissions
        return (
             <Card className="shadow-sm">
                <Card.Header as="h5">Action History</Card.Header>
                <Card.Body>
                    <p className="mb-1"><strong>Final Status:</strong> {getStatusBadge(requisition.status)}</p>
                    <p className="mb-1"><strong>Action By:</strong> {requisition.approvedBy?.username || 'N/A'}</p>
                    <p className="mb-1"><strong>Action Date:</strong> {requisition.approvedAt ? new Date(requisition.approvedAt).toLocaleString() : 'N/A'}</p>
                    <hr/>
                    <p className="mb-0"><strong>Notes / Reason:</strong></p>
                    <p className="text-muted">{requisition.approvalNotes || 'No notes provided.'}</p>
                </Card.Body>
             </Card>
        );
    };

    return (
        <>
            <Container>
                <Button variant="outline-secondary" size="sm" className="mb-3" onClick={() => navigate('/requisitions')}>
                    <FaArrowLeft className="me-2" /> Back to Requisitions
                </Button>
                <Row>
                    <Col md={8}>
                        <Card className="shadow-sm">
                            <Card.Header>
                                <div className="d-flex justify-content-between align-items-center">
                                    <div>
                                        <h3>Requisition REQ-{String(requisition.id).padStart(4, '0')}</h3>
                                        {requisition.submissionCount > 1 && <Badge bg="info" className="me-2">Resubmitted</Badge>}
                                        {getStatusBadge(requisition.status)}
                                    </div>
                                    <div>
                                        {user && requisition.requestedBy.id === user.id && ['PENDING', 'REJECTED'].includes(requisition.status) && (
                                            <Button variant="outline-warning" size="sm" className="me-2" onClick={() => navigate(`/requisitions/edit/${id}`)} title="Edit Requisition">
                                                <FaEdit />
                                            </Button>
                                        )}
                                        {user && ((requisition.requestedBy.id === user.id && requisition.status === 'PENDING') || hasPermission('REQUISITION_APPROVE')) && (
                                            <Button variant="outline-danger" size="sm" onClick={handleDelete} title="Delete Requisition">
                                                <FaTrash />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </Card.Header>
                            <Card.Body>
                                <ListGroup variant="flush" className="mb-3">
                                    <ListGroup.Item><strong>Project:</strong> {requisition.project.name}</ListGroup.Item>
                                    <ListGroup.Item><strong>Requested By:</strong> {requisition.requestedBy.username}</ListGroup.Item>
                                    <ListGroup.Item><strong>Date Requested:</strong> {new Date(requisition.createdAt).toLocaleString()}</ListGroup.Item>
                                    <ListGroup.Item><strong>Date Needed By:</strong> {new Date(requisition.dateNeeded).toLocaleDateString()}</ListGroup.Item>
                                    <ListGroup.Item><strong>Justification:</strong> {requisition.justification}</ListGroup.Item>
                                </ListGroup>
                                
                                <h5 className="mt-4">Requested Items</h5>
                                <Table bordered size="sm">
                                    <thead>
                                        <tr>
                                            <th>Item</th>
                                            <th className="text-end">Qty</th>
                                            <th>Unit</th>
                                            <th className="text-end">Est. Unit Cost</th>
                                            <th className="text-end">Est. Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {requisition.items.map(item => (
                                            <tr key={item.id}>
                                                <td>{item.itemName}</td>
                                                <td className="text-end">{item.quantity}</td>
                                                <td>{item.unitOfMeasure}</td>
                                                <td className="text-end">{formatCurrency(item.estimatedUnitCost)}</td>
                                                <td className="text-end">{formatCurrency(item.quantity * (item.estimatedUnitCost || 0))}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="fw-bold">
                                            <td colSpan="4" className="text-end">Total Estimated Cost:</td>
                                            <td className="text-end">{formatCurrency(totalEstimatedCost)}</td>
                                        </tr>
                                    </tfoot>
                                </Table>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={4}>
                        {renderActionCard()}
                    </Col>
                </Row>
            </Container>
            
            {requisition && (
                <FulfillmentModal
                    show={showFulfillmentModal}
                    handleClose={() => setShowFulfillmentModal(false)}
                    requisition={requisition}
                    onFulfillmentSuccess={fetchData}
                />
            )}
        </>
    );
};

export default RequisitionDetailsPage;