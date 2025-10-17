import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
// v-- THIS IS THE FIX --v
import { Container, Card, Row, Col, Button, Spinner, Badge, Form, ListGroup } from 'react-bootstrap';
import { FaArrowLeft, FaPaperPlane } from 'react-icons/fa';
import api from '../../api/api.js';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext.jsx';

const getStatusBadge = (status) => {
    switch (status) {
        case 'OPEN': return <Badge bg="primary">Open</Badge>;
        case 'IN_PROGRESS': return <Badge bg="info">In Progress</Badge>;
        case 'RESOLVED': return <Badge bg="success">Resolved</Badge>;
        case 'CLOSED': return <Badge bg="secondary">Closed</Badge>;
        default: return <Badge bg="light" text="dark">{status}</Badge>;
    }
};

const TicketDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, hasPermission } = useAuth();
    const [ticket, setTicket] = useState(null);
    const [loading, setLoading] = useState(true);
    const [newComment, setNewComment] = useState('');
    const [resolutionNotes, setResolutionNotes] = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/support/tickets/${id}`);
            setTicket(res.data);
        } catch (error) {
            toast.error("Failed to load ticket details.");
            navigate('/support/tickets');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [id, navigate]);

    const handleAddComment = async () => {
        if (!newComment.trim()) return;
        try {
            await api.post(`/support/tickets/${id}/comments`, { comment: newComment });
            setNewComment('');
            toast.success("Comment added.");
            fetchData();
        } catch (error) { toast.error("Failed to post comment."); }
    };

    const handleAssignToSelf = async () => {
        try {
            await api.post(`/support/tickets/${id}/assign`);
            toast.success("Ticket assigned to you.");
            fetchData();
        } catch (error) { toast.error("Failed to assign ticket."); }
    };

    const handleResolve = async () => {
        if (!resolutionNotes.trim()) {
            toast.error("Resolution notes are required.");
            return;
        }
        try {
            await api.post(`/support/tickets/${id}/resolve`, { comment: resolutionNotes });
            toast.success("Ticket marked as resolved.");
            fetchData();
        } catch (error) { toast.error("Failed to resolve ticket."); }
    };

    const handleClose = async () => {
        try {
            await api.post(`/support/tickets/${id}/close`);
            toast.info("Ticket has been closed.");
            fetchData();
        } catch (error) { toast.error(error.response?.data?.message || "Failed to close ticket."); }
    };

    if (loading) return <Spinner animation="border" />;
    if (!ticket) return null;

    return (
        <Container>
            <Button variant="outline-secondary" size="sm" className="mb-3" onClick={() => navigate('/support/tickets')}>
                <FaArrowLeft className="me-2" /> Back to Tickets
            </Button>
            <Row>
                <Col md={8}>
                    <Card className="shadow-sm">
                        <Card.Header>
                            <h4>{ticket.subject}</h4>
                            <small className="text-muted">
                                Submitted by {ticket.submittedBy.username} on {new Date(ticket.createdAt).toLocaleString()}
                            </small>
                        </Card.Header>
                        <Card.Body>
                            <div className="mb-4" style={{ whiteSpace: 'pre-wrap' }}>{ticket.description}</div>
                            <hr />
                            <h5>Conversation</h5>
                            {ticket.comments.map(comment => (
                                <Card key={comment.id} className={`mb-3 ${comment.commenter.id === ticket.submittedBy.id ? '' : 'bg-light'}`}>
                                    <Card.Body className="p-3">
                                        <p style={{ whiteSpace: 'pre-wrap' }}>{comment.comment}</p>
                                        <footer className="blockquote-footer text-end mb-0">
                                            {comment.commenter.username} on <cite title="Source Title">{new Date(comment.createdAt).toLocaleString()}</cite>
                                        </footer>
                                    </Card.Body>
                                </Card>
                            ))}
                            {ticket.status !== 'CLOSED' && (
                                <Form.Group className="mt-4">
                                    <Form.Label>Add a Comment or Update</Form.Label>
                                    <Form.Control as="textarea" rows={3} value={newComment} onChange={e => setNewComment(e.target.value)} />
                                    <Button variant="primary" size="sm" className="mt-2" onClick={handleAddComment}>
                                        <FaPaperPlane className="me-2" /> Post Comment
                                    </Button>
                                </Form.Group>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card className="shadow-sm mb-3">
                        <ListGroup variant="flush">
                            <ListGroup.Item><strong>Status:</strong> {getStatusBadge(ticket.status)}</ListGroup.Item>
                            <ListGroup.Item><strong>Priority:</strong> <Badge bg={ticket.priority === 'HIGH' || ticket.priority === 'URGENT' ? 'danger' : 'info'}>{ticket.priority}</Badge></ListGroup.Item>
                            <ListGroup.Item><strong>Assigned to:</strong> {ticket.assignedTo?.username || 'Unassigned'}</ListGroup.Item>
                        </ListGroup>
                    </Card>

                    {/* Action Card */}
                    {hasPermission('TICKET_MANAGE') && ['OPEN', 'IN_PROGRESS'].includes(ticket.status) && (
                        <Card className="shadow-sm mb-3">
                            <Card.Header>Support Actions</Card.Header>
                            <Card.Body>
                                {ticket.status === 'OPEN' && (
                                    <Button variant="info" className="w-100 mb-2" onClick={handleAssignToSelf}>Assign to Me</Button>
                                )}
                                {ticket.status === 'IN_PROGRESS' && (
                                    <>
                                        <Form.Group className="mb-2">
                                            <Form.Label>Resolution Notes</Form.Label>
                                            <Form.Control as="textarea" rows={3} value={resolutionNotes} onChange={e => setResolutionNotes(e.target.value)} placeholder="Describe the solution..."/>
                                        </Form.Group>
                                        <Button variant="success" className="w-100" onClick={handleResolve}>Mark as Resolved</Button>
                                    </>
                                )}
                            </Card.Body>
                        </Card>
                    )}
                    {user?.id === ticket.submittedBy.id && ticket.status === 'RESOLVED' && (
                         <Card className="shadow-sm">
                            <Card.Header>Submitter Action</Card.Header>
                            <Card.Body>
                                <p>If your issue is resolved, please close this ticket to confirm.</p>
                                <div className="d-grid">
                                    <Button variant="secondary" onClick={handleClose}>Close Ticket</Button>
                                </div>
                            </Card.Body>
                        </Card>
                    )}
                </Col>
            </Row>
        </Container>
    );
};

export default TicketDetailsPage;