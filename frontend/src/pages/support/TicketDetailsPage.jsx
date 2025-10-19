import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Card, Row, Col, Button, Spinner, Badge, Form, ListGroup } from 'react-bootstrap';
import { FaArrowLeft, FaPaperPlane, FaDownload } from 'react-icons/fa';
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

const formatDateTime = (value) => (value ? new Date(value).toLocaleString() : '—');

const TicketDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, hasPermission } = useAuth();

    const [ticket, setTicket] = useState(null);
    const [loading, setLoading] = useState(true);

    const [newComment, setNewComment] = useState('');
    const [attachmentFile, setAttachmentFile] = useState(null);
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);
    const [resolutionNotes, setResolutionNotes] = useState('');

    const fileInputRef = useRef(null);

    const canManageTickets = hasPermission('TICKET_MANAGE');

    const fetchData = async () => {
        try {
            const response = await api.get(`/support/tickets/${id}`);
            setTicket(response.data);
        } catch (error) {
            toast.error('Failed to load ticket details.');
            navigate('/support/tickets');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setLoading(true);
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const handleAddComment = async (event) => {
        event.preventDefault();
        if (!newComment.trim() && !attachmentFile) {
            toast.warn('Please add a comment or attach a file.');
            return;
        }
        setIsSubmittingComment(true);

        const formData = new FormData();
        formData.append('comment', JSON.stringify({ comment: newComment }));
        if (attachmentFile) {
            formData.append('file', attachmentFile);
        }

        try {
            await api.post(`/support/tickets/${id}/comments`, formData);
            toast.success('Update posted successfully.');
            setNewComment('');
            setAttachmentFile(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = null;
            }
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to post update.');
        } finally {
            setIsSubmittingComment(false);
        }
    };

    const handleAssignToSelf = async () => {
        try {
            await api.post(`/support/tickets/${id}/assign`);
            toast.success('Ticket assigned to you.');
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to assign ticket.');
        }
    };

    const handleResolve = async () => {
        if (!resolutionNotes.trim()) {
            toast.error('Resolution notes are required.');
            return;
        }
        try {
            await api.post(`/support/tickets/${id}/resolve`, { comment: resolutionNotes });
            toast.success('Ticket marked as resolved.');
            setResolutionNotes('');
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to resolve ticket.');
        }
    };

    const handleClose = async () => {
        try {
            await api.post(`/support/tickets/${id}/close`);
            toast.info('Ticket has been closed.');
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to close ticket.');
        }
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center py-5">
                <Spinner animation="border" />
            </div>
        );
    }

    if (!ticket) {
        return null;
    }

    const commentCards = (ticket.comments || []).map((comment) => (
        <Card key={comment.id} className={`mb-3 ${comment.fromSubmitter ? 'bg-white' : 'bg-light'}`}>
            <Card.Body className="p-3">
                <div className="fw-semibold mb-1">{comment.commenterName || 'System'}</div>
                <p className="mb-2" style={{ whiteSpace: 'pre-wrap' }}>{comment.comment}</p>
                {comment.fileUrl && (
                    <Button
                        as="a"
                        href={comment.fileUrl.startsWith('http') ? comment.fileUrl : `http://localhost:8080${comment.fileUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        variant="outline-secondary"
                        size="sm"
                        className="me-2"
                    >
                        <FaDownload className="me-2" /> View Attachment
                    </Button>
                )}
                <div className="text-muted text-end small">{formatDateTime(comment.createdAt)}</div>
            </Card.Body>
        </Card>
    ));

    const attachments = ticket.attachments || [];
    const activityLog = ticket.activityLog || [];
    const isSubmitter = user?.id === ticket.submittedById;

    return (
        <Container>
            <Button variant="outline-secondary" size="sm" className="mb-3" onClick={() => navigate('/support/tickets')}>
                <FaArrowLeft className="me-2" /> Back to Tickets
            </Button>
            <Row className="g-3">
                <Col lg={8}>
                    <Card className="shadow-sm mb-3">
                        <Card.Header>
                            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center">
                                <div>
                                    <h4 className="mb-1">{ticket.subject}</h4>
                                    <small className="text-muted">Ticket #{String(ticket.id).padStart(4, '0')}</small>
                                </div>
                                <div className="mt-2 mt-md-0">{getStatusBadge(ticket.status)}</div>
                            </div>
                        </Card.Header>
                        <Card.Body>
                            <p className="mb-4" style={{ whiteSpace: 'pre-wrap' }}>{ticket.description}</p>
                            <Row className="g-3">
                                <Col md={6}>
                                    <ListGroup variant="flush">
                                        <ListGroup.Item><strong>Submitted By:</strong> {ticket.submittedByName || '—'}</ListGroup.Item>
                                        <ListGroup.Item><strong>Department:</strong> {ticket.submitterDepartment || '—'}</ListGroup.Item>
                                        <ListGroup.Item><strong>Created:</strong> {formatDateTime(ticket.createdAt)}</ListGroup.Item>
                                        <ListGroup.Item><strong>Updated:</strong> {formatDateTime(ticket.updatedAt)}</ListGroup.Item>
                                    </ListGroup>
                                </Col>
                                <Col md={6}>
                                    <ListGroup variant="flush">
                                        <ListGroup.Item><strong>Category:</strong> {ticket.categoryName === 'OTHER' ? ticket.otherCategory : ticket.categoryName?.replace(/_/g, ' ') || '—'}</ListGroup.Item>
                                        <ListGroup.Item><strong>Assigned To:</strong> {ticket.assignedToName || 'Unassigned'}</ListGroup.Item>
                                        <ListGroup.Item><strong>Priority:</strong> <Badge bg={['HIGH', 'URGENT'].includes(ticket.priority) ? 'danger' : 'info'}>{ticket.priority}</Badge></ListGroup.Item>
                                        <ListGroup.Item><strong>Related Item:</strong> {ticket.inventoryItemName || '—'}</ListGroup.Item>
                                        <ListGroup.Item><strong>Project:</strong> {ticket.projectName || '—'}</ListGroup.Item>
                                    </ListGroup>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>

                    <Card className="shadow-sm mb-3">
                        <Card.Header>SLA Tracking</Card.Header>
                        <Card.Body>
                            <Row className="g-3">
                                <Col md={6}>
                                    <ListGroup variant="flush">
                                        <ListGroup.Item><strong>Response Due:</strong> {formatDateTime(ticket.responseDueAt)}</ListGroup.Item>
                                        <ListGroup.Item><strong>First Response:</strong> {formatDateTime(ticket.firstResponseAt)}</ListGroup.Item>
                                        <ListGroup.Item><strong>Response Status:</strong> <Badge bg={ticket.responseBreached ? 'danger' : 'success'}>{ticket.responseBreached ? 'Breached' : 'On Track'}</Badge></ListGroup.Item>
                                    </ListGroup>
                                </Col>
                                <Col md={6}>
                                    <ListGroup variant="flush">
                                        <ListGroup.Item><strong>Resolution Due:</strong> {formatDateTime(ticket.resolutionDueAt)}</ListGroup.Item>
                                        <ListGroup.Item><strong>Resolved At:</strong> {formatDateTime(ticket.resolvedAt)}</ListGroup.Item>
                                        <ListGroup.Item><strong>Resolution Status:</strong> <Badge bg={ticket.resolutionBreached ? 'danger' : 'success'}>{ticket.resolutionBreached ? 'Breached' : 'On Track'}</Badge></ListGroup.Item>
                                    </ListGroup>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>

                    <Card className="shadow-sm mb-3">
                        <Card.Header>Conversation</Card.Header>
                        <Card.Body>
                            {commentCards.length > 0 ? commentCards : <div className="text-muted">No updates yet.</div>}
                            {ticket.status !== 'CLOSED' && (
                                <Card className="mt-4 bg-light">
                                    <Card.Body>
                                        <Form onSubmit={handleAddComment}>
                                            <Form.Group controlId="newComment">
                                                <Form.Label>Add Comment</Form.Label>
                                                <Form.Control
                                                    as="textarea"
                                                    rows={3}
                                                    value={newComment}
                                                    onChange={(event) => setNewComment(event.target.value)}
                                                    placeholder="Share progress updates or request more info"
                                                />
                                            </Form.Group>
                                            <Form.Group className="mt-2" controlId="newCommentAttachment">
                                                <Form.Label>Attach File (optional)</Form.Label>
                                                <Form.Control type="file" ref={fileInputRef} onChange={(event) => setAttachmentFile(event.target.files[0])} />
                                            </Form.Group>
                                            <Button variant="primary" size="sm" className="mt-3" type="submit" disabled={isSubmittingComment}>
                                                {isSubmittingComment ? 'Posting…' : <><FaPaperPlane className="me-2" /> Post Update</>}
                                            </Button>
                                        </Form>
                                    </Card.Body>
                                </Card>
                            )}
                        </Card.Body>
                    </Card>
                </Col>

                <Col lg={4}>
                    <Card className="shadow-sm mb-3">
                        <Card.Header>Ticket Actions</Card.Header>
                        <Card.Body>
                            {canManageTickets && ticket.status === 'OPEN' && (
                                <Button variant="info" className="w-100 mb-2" onClick={handleAssignToSelf}>Assign to Me</Button>
                            )}
                            {canManageTickets && ticket.status === 'IN_PROGRESS' && (
                                <>
                                    <Form.Group className="mb-2">
                                        <Form.Label>Resolution Notes</Form.Label>
                                        <Form.Control
                                            as="textarea"
                                            rows={3}
                                            value={resolutionNotes}
                                            onChange={(event) => setResolutionNotes(event.target.value)}
                                            placeholder="Describe how the issue was resolved"
                                        />
                                    </Form.Group>
                                    <Button variant="success" className="w-100" onClick={handleResolve}>Mark as Resolved</Button>
                                </>
                            )}
                            {isSubmitter && ticket.status === 'RESOLVED' && (
                                <Button variant="secondary" className="w-100" onClick={handleClose}>Close Ticket</Button>
                            )}
                            {!canManageTickets && !isSubmitter && (
                                <div className="text-muted small">No actions available.</div>
                            )}
                        </Card.Body>
                    </Card>

                    <Card className="shadow-sm mb-3">
                        <Card.Header>Attachments</Card.Header>
                        <ListGroup variant="flush">
                            {attachments.length > 0 ? attachments.map((file) => (
                                <ListGroup.Item key={file.id}>
                                    <div className="fw-semibold">{file.originalFilename}</div>
                                    <div className="text-muted small">Uploaded {formatDateTime(file.uploadedAt)} by {file.uploadedByName || 'Unknown'}</div>
                                    <Button
                                        as="a"
                                        href={file.fileUrl?.startsWith('http') ? file.fileUrl : `http://localhost:8080${file.fileUrl}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        variant="outline-secondary"
                                        size="sm"
                                        className="mt-2"
                                    >
                                        <FaDownload className="me-2" /> Download
                                    </Button>
                                </ListGroup.Item>
                            )) : (
                                <ListGroup.Item className="text-muted">No attachments</ListGroup.Item>
                            )}
                        </ListGroup>
                    </Card>

                    <Card className="shadow-sm">
                        <Card.Header>Activity Log</Card.Header>
                        <ListGroup variant="flush">
                            {activityLog.length > 0 ? activityLog.map((activity) => (
                                <ListGroup.Item key={activity.id}>
                                    <div className="fw-semibold">{activity.actionType ? activity.actionType.replace(/_/g, ' ') : 'Activity'}</div>
                                    <div>{activity.details}</div>
                                    <div className="text-muted small">{formatDateTime(activity.createdAt)} {activity.performedByName ? `by ${activity.performedByName}` : ''}</div>
                                </ListGroup.Item>
                            )) : (
                                <ListGroup.Item className="text-muted">No activity recorded</ListGroup.Item>
                            )}
                        </ListGroup>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default TicketDetailsPage;