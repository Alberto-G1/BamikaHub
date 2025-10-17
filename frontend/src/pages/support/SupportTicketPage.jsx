import React, { useState, useEffect, useMemo } from 'react';
import { Table, Button, Spinner, Card, Badge, Tabs, Tab, Modal, Form } from 'react-bootstrap';
import { FaPlus, FaTicketAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import api from '../../api/api.js';
import { toast } from 'react-toastify';

// Helper to get a color for the ticket status
const getStatusBadge = (status) => {
    switch (status) {
        case 'OPEN': return <Badge bg="primary">Open</Badge>;
        case 'IN_PROGRESS': return <Badge bg="info">In Progress</Badge>;
        case 'RESOLVED': return <Badge bg="success">Resolved</Badge>;
        case 'CLOSED': return <Badge bg="secondary">Closed</Badge>;
        default: return <Badge bg="light" text="dark">{status}</Badge>;
    }
};

const SupportTicketPage = () => {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('OPEN');
    
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newTicket, setNewTicket] = useState({ subject: '', description: '', priority: 'MEDIUM' });

    useEffect(() => {
        fetchTickets();
    }, []);

    const fetchTickets = async () => {
        setLoading(true);
        try {
            const response = await api.get('/support/tickets');
            setTickets(response.data);
        } catch (err) {
            toast.error('Failed to fetch support tickets.');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTicket = async (e) => {
        e.preventDefault();
        try {
            await api.post('/support/tickets', newTicket);
            toast.success("Support ticket created successfully!");
            setShowCreateModal(false);
            setNewTicket({ subject: '', description: '', priority: 'MEDIUM' });
            fetchTickets();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to create ticket.");
        }
    };

    const filteredTickets = useMemo(() => {
        if (!tickets) return [];
        if (activeTab === 'ALL') return tickets;
        return tickets.filter(ticket => ticket.status === activeTab);
    }, [tickets, activeTab]);

    if (loading) return <Spinner animation="border" />;

    return (
        <>
            <Card className="shadow-sm">
                <Card.Header className="d-flex justify-content-between align-items-center">
                    <Card.Title as="h3" className="mb-0 d-flex align-items-center">
                        <FaTicketAlt className="me-3" /> Technical Support Tickets
                    </Card.Title>
                    <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                        <FaPlus className="me-2" /> Create New Ticket
                    </Button>
                </Card.Header>
                <Card.Body>
                    <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-3">
                        <Tab eventKey="OPEN" title={`Open (${tickets.filter(t=>t.status === 'OPEN').length})`} />
                        <Tab eventKey="IN_PROGRESS" title={`In Progress (${tickets.filter(t=>t.status === 'IN_PROGRESS').length})`} />
                        <Tab eventKey="RESOLVED" title={`Resolved (${tickets.filter(t=>t.status === 'RESOLVED').length})`} />
                        <Tab eventKey="CLOSED" title={`Closed (${tickets.filter(t=>t.status === 'CLOSED').length})`} />
                        <Tab eventKey="ALL" title="All Tickets" />
                    </Tabs>
                    
                    <Table striped bordered hover responsive>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Subject</th>
                                <th>Submitted By</th>
                                <th>Last Updated</th>
                                <th>Priority</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTickets.map(ticket => (
                                <tr key={ticket.id}>
                                    <td>TICKET-{String(ticket.id).padStart(4, '0')}</td>
                                    <td>{ticket.subject}</td>
                                    <td>{ticket.submittedBy?.username || 'N/A'}</td>
                                    <td>{new Date(ticket.updatedAt).toLocaleString()}</td>
                                    <td><Badge bg={ticket.priority === 'HIGH' || ticket.priority === 'URGENT' ? 'danger' : 'info'}>{ticket.priority}</Badge></td>
                                    <td>{getStatusBadge(ticket.status)}</td>
                                    <td>
                                        <Button variant="outline-primary" size="sm" onClick={() => navigate(`/support/tickets/${ticket.id}`)}>
                                            View Details
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </Card.Body>
            </Card>

            {/* Create Ticket Modal */}
            <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} centered size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Create a New Support Ticket</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleCreateTicket}>
                    <Modal.Body>
                        <Form.Group className="mb-3">
                            <Form.Label>Priority</Form.Label>
                            <Form.Select value={newTicket.priority} onChange={(e) => setNewTicket({...newTicket, priority: e.target.value})}>
                                <option value="LOW">Low</option>
                                <option value="MEDIUM">Medium</option>
                                <option value="HIGH">High</option>
                                <option value="URGENT">Urgent</option>
                            </Form.Select>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Subject</Form.Label>
                            <Form.Control type="text" value={newTicket.subject} onChange={(e) => setNewTicket({...newTicket, subject: e.target.value})} required placeholder="e.g., Cannot access project files" />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Description of Issue</Form.Label>
                            <Form.Control as="textarea" rows={5} value={newTicket.description} onChange={(e) => setNewTicket({...newTicket, description: e.target.value})} required placeholder="Please provide as much detail as possible..."/>
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowCreateModal(false)}>Cancel</Button>
                        <Button variant="primary" type="submit">Submit Ticket</Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </>
    );
};

export default SupportTicketPage;