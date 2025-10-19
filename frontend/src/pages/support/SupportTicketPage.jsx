import React, { useState, useEffect } from 'react';
import { Table, Button, Spinner, Card, Badge, Modal, Form, Row, Col, ButtonGroup } from 'react-bootstrap';
import { FaPlus, FaTicketAlt, FaFileExcel, FaFilePdf } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import api from '../../api/api.js';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext.jsx';

const initialFilters = {
    status: '',
    priority: '',
    categoryId: '',
    department: '',
    startDate: '',
    endDate: '',
    search: '',
    includeArchived: false
};

const formatDateTime = (value) => (value ? new Date(value).toLocaleString() : '—');

const getStatusBadge = (status) => {
    switch (status) {
        case 'OPEN': return <Badge bg="primary">Open</Badge>;
        case 'IN_PROGRESS': return <Badge bg="info">In Progress</Badge>;
        case 'RESOLVED': return <Badge bg="success">Resolved</Badge>;
        case 'CLOSED': return <Badge bg="secondary">Closed</Badge>;
        default: return <Badge bg="light" text="dark">{status}</Badge>;
    }
};

const sanitizeFilters = (filters) => {
    const cleaned = {};
    Object.entries(filters).forEach(([key, value]) => {
        if (value === undefined || value === null) {
            return;
        }
        if (typeof value === 'string' && value.trim() === '') {
            return;
        }
        if (key === 'includeArchived') {
            if (value) {
                cleaned[key] = true;
            }
            return;
        }
        cleaned[key] = value;
    });
    return cleaned;
};

const areFiltersEqual = (a, b) => JSON.stringify(a) === JSON.stringify(b);

const SupportTicketPage = () => {
    const navigate = useNavigate();
    const { hasPermission } = useAuth();
    const canManageTickets = hasPermission('TICKET_MANAGE');

    const [tickets, setTickets] = useState([]);
    const [categories, setCategories] = useState([]);
    const [analytics, setAnalytics] = useState(null);

    const [filters, setFilters] = useState(initialFilters);
    const [appliedFilters, setAppliedFilters] = useState({});

    const [loadingTickets, setLoadingTickets] = useState(false);
    const [loadingAnalytics, setLoadingAnalytics] = useState(false);
    const [downloadingFormat, setDownloadingFormat] = useState(null);

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showOtherCategory, setShowOtherCategory] = useState(false);
    const [newTicket, setNewTicket] = useState({
        subject: '',
        description: '',
        priority: 'MEDIUM',
        categoryId: '',
        otherCategory: '',
        submitterDepartment: ''
    });

    useEffect(() => {
        const loadReferenceData = async () => {
            try {
                const response = await api.get('/support/tickets/categories');
                setCategories(response.data || []);
            } catch (error) {
                toast.error('Failed to load ticket categories.');
            }
        };
        loadReferenceData();
    }, []);

    useEffect(() => {
        fetchTickets(appliedFilters);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [appliedFilters]);

    useEffect(() => {
        const sanitized = sanitizeFilters(filters);
        const timeout = setTimeout(() => {
            setAppliedFilters((previous) => (areFiltersEqual(previous, sanitized) ? previous : sanitized));
        }, 300);

        return () => clearTimeout(timeout);
    }, [filters]);

    useEffect(() => {
        if (canManageTickets) {
            fetchAnalytics();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [canManageTickets]);

    const fetchTickets = async (params = {}) => {
        setLoadingTickets(true);
        try {
            const response = await api.get('/support/tickets', { params });
            setTickets(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            toast.error('Failed to load support tickets.');
        } finally {
            setLoadingTickets(false);
        }
    };

    const fetchAnalytics = async () => {
        setLoadingAnalytics(true);
        try {
            const response = await api.get('/support/tickets/analytics/summary');
            setAnalytics(response.data);
        } catch (error) {
            toast.error('Failed to load ticket analytics.');
        } finally {
            setLoadingAnalytics(false);
        }
    };

    const handleFilterChange = (event) => {
        const { name, value, type, checked } = event.target;
        setFilters((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleResetFilters = () => {
        setFilters(initialFilters);
        setAppliedFilters({});
    };

    const handleFormChange = (event) => {
        const { name, value } = event.target;
        setNewTicket((prev) => ({ ...prev, [name]: value }));
    };

    const handleCategoryChange = (event) => {
        const categoryId = event.target.value;
        const selectedCategory = categories.find((category) => category.id.toString() === categoryId);
        setNewTicket((prev) => ({ ...prev, categoryId }));
        setShowOtherCategory(Boolean(selectedCategory && selectedCategory.name === 'OTHER'));
    };

    const handleCreateTicket = async (event) => {
        event.preventDefault();
        setIsSubmitting(true);
        try {
            const payload = {
                ...newTicket,
                categoryId: newTicket.categoryId ? Number(newTicket.categoryId) : null,
                otherCategory: showOtherCategory ? newTicket.otherCategory : null
            };
            await api.post('/support/tickets', payload);
            toast.success('Support ticket created successfully.');
            handleCloseModal();
            setAppliedFilters((prev) => ({ ...prev }));
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create support ticket.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCloseModal = () => {
        setShowCreateModal(false);
        setShowOtherCategory(false);
        setNewTicket({
            subject: '',
            description: '',
            priority: 'MEDIUM',
            categoryId: '',
            otherCategory: '',
            submitterDepartment: ''
        });
    };

    const handleExport = async (format) => {
        setDownloadingFormat(format);
        try {
            const response = await api.get(`/support/tickets/export/${format}`, {
                params: appliedFilters,
                responseType: 'blob'
            });
            const disposition = response.headers['content-disposition'];
            const suggestedName = disposition ? disposition.split('filename=')[1]?.replace(/"/g, '') : `tickets.${format === 'excel' ? 'xlsx' : 'pdf'}`;
            const blob = new Blob([response.data], { type: response.headers['content-type'] });
            const url = window.URL.createObjectURL(blob);
            const tempLink = document.createElement('a');
            tempLink.href = url;
            tempLink.setAttribute('download', suggestedName || `tickets.${format}`);
            document.body.appendChild(tempLink);
            tempLink.click();
            tempLink.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            toast.error('Failed to export tickets.');
        } finally {
            setDownloadingFormat(null);
        }
    };

    const statusCounts = analytics?.ticketsByStatus || {};

    return (
        <>
            <Card className="shadow-sm mb-3">
                <Card.Header className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center">
                    <div className="d-flex align-items-center mb-3 mb-lg-0">
                        <FaTicketAlt className="me-3" size={24} />
                        <div>
                            <Card.Title as="h3" className="mb-0">Technical Support Tickets</Card.Title>
                            <small className="text-muted">Track requests, monitor SLAs, and export reports.</small>
                        </div>
                    </div>
                    <div className="d-flex gap-2">
                        {canManageTickets && (
                            <ButtonGroup>
                                <Button
                                    variant="outline-success"
                                    disabled={downloadingFormat === 'excel'}
                                    onClick={() => handleExport('excel')}
                                >
                                    {downloadingFormat === 'excel' ? 'Exporting…' : <><FaFileExcel className="me-2" />Export Excel</>}
                                </Button>
                                <Button
                                    variant="outline-danger"
                                    disabled={downloadingFormat === 'pdf'}
                                    onClick={() => handleExport('pdf')}
                                >
                                    {downloadingFormat === 'pdf' ? 'Exporting…' : <><FaFilePdf className="me-2" />Export PDF</>}
                                </Button>
                            </ButtonGroup>
                        )}
                        <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                            <FaPlus className="me-2" /> Create Ticket
                        </Button>
                    </div>
                </Card.Header>
            </Card>

            {canManageTickets && (
                <Card className="shadow-sm mb-3">
                    <Card.Header>Support Analytics</Card.Header>
                    <Card.Body>
                        {loadingAnalytics ? (
                            <Spinner animation="border" size="sm" />
                        ) : analytics ? (
                            <Row className="g-3">
                                <Col md={3} sm={6}>
                                    <Card className="border-0 bg-light h-100">
                                        <Card.Body>
                                            <div className="text-muted text-uppercase small">Open Tickets</div>
                                            <div className="display-6">{statusCounts.OPEN || 0}</div>
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col md={3} sm={6}>
                                    <Card className="border-0 bg-light h-100">
                                        <Card.Body>
                                            <div className="text-muted text-uppercase small">In Progress</div>
                                            <div className="display-6">{statusCounts.IN_PROGRESS || 0}</div>
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col md={3} sm={6}>
                                    <Card className="border-0 bg-light h-100">
                                        <Card.Body>
                                            <div className="text-muted text-uppercase small">Resolved</div>
                                            <div className="display-6">{statusCounts.RESOLVED || 0}</div>
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col md={3} sm={6}>
                                    <Card className="border-0 bg-light h-100">
                                        <Card.Body>
                                            <div className="text-muted text-uppercase small">Closed</div>
                                            <div className="display-6">{statusCounts.CLOSED || 0}</div>
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col md={4} sm={6}>
                                    <Card className="border-0 bg-light h-100">
                                        <Card.Body>
                                            <div className="text-muted text-uppercase small">Avg Resolution (hrs)</div>
                                            <div className="display-6">{analytics.averageResolutionHours?.toFixed(1) || 0}</div>
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col md={4} sm={6}>
                                    <Card className="border-0 bg-light h-100">
                                        <Card.Body>
                                            <div className="text-muted text-uppercase small">Avg Response (hrs)</div>
                                            <div className="display-6">{analytics.averageResponseHours?.toFixed(1) || 0}</div>
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col md={4} sm={6}>
                                    <Card className="border-0 bg-light h-100">
                                        <Card.Body>
                                            <div className="text-muted text-uppercase small">SLA Compliance (%)</div>
                                            <div className="display-6">{analytics.slaCompliancePercentage?.toFixed(0) || 0}</div>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>
                        ) : (
                            <div className="text-muted">No analytics available.</div>
                        )}
                    </Card.Body>
                </Card>
            )}

            <Card className="shadow-sm mb-3">
                <Card.Header>Filters</Card.Header>
                <Card.Body>
                    <Form onSubmit={(event) => event.preventDefault()}>
                        <Row className="g-3">
                            <Col md={3} sm={6}>
                                <Form.Group controlId="filterStatus">
                                    <Form.Label>Status</Form.Label>
                                    <Form.Select name="status" value={filters.status} onChange={handleFilterChange}>
                                        <option value="">All statuses</option>
                                        <option value="OPEN">Open</option>
                                        <option value="IN_PROGRESS">In Progress</option>
                                        <option value="RESOLVED">Resolved</option>
                                        <option value="CLOSED">Closed</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={3} sm={6}>
                                <Form.Group controlId="filterPriority">
                                    <Form.Label>Priority</Form.Label>
                                    <Form.Select name="priority" value={filters.priority} onChange={handleFilterChange}>
                                        <option value="">All priorities</option>
                                        <option value="LOW">Low</option>
                                        <option value="MEDIUM">Medium</option>
                                        <option value="HIGH">High</option>
                                        <option value="URGENT">Urgent</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={3} sm={6}>
                                <Form.Group controlId="filterCategory">
                                    <Form.Label>Category</Form.Label>
                                    <Form.Select name="categoryId" value={filters.categoryId} onChange={handleFilterChange}>
                                        <option value="">All categories</option>
                                        {categories.map((category) => (
                                            <option key={category.id} value={category.id}>{category.name.replace(/_/g, ' ')}</option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={3} sm={6}>
                                <Form.Group controlId="filterDepartment">
                                    <Form.Label>Department</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="department"
                                        value={filters.department}
                                        onChange={handleFilterChange}
                                        placeholder="e.g., Finance"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={3} sm={6}>
                                <Form.Group controlId="filterStartDate">
                                    <Form.Label>Start Date</Form.Label>
                                    <Form.Control type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} />
                                </Form.Group>
                            </Col>
                            <Col md={3} sm={6}>
                                <Form.Group controlId="filterEndDate">
                                    <Form.Label>End Date</Form.Label>
                                    <Form.Control type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group controlId="filterSearch">
                                    <Form.Label>Search</Form.Label>
                                    <Form.Control
                                        type="search"
                                        name="search"
                                        value={filters.search}
                                        onChange={handleFilterChange}
                                        placeholder="Search by subject, ticket number, or description"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={3} sm={6} className="d-flex align-items-end">
                                <Form.Check
                                    type="switch"
                                    id="filterIncludeArchived"
                                    name="includeArchived"
                                    label="Include archived"
                                    checked={filters.includeArchived}
                                    onChange={handleFilterChange}
                                />
                            </Col>
                        </Row>
                        <div className="d-flex gap-2 mt-3">
                            <Button type="button" variant="outline-secondary" onClick={handleResetFilters}>Reset</Button>
                        </div>
                    </Form>
                </Card.Body>
            </Card>

            <Card className="shadow-sm">
                <Card.Body className="p-0">
                    {loadingTickets ? (
                        <div className="p-4 text-center">
                            <Spinner animation="border" />
                        </div>
                    ) : (
                        <Table striped bordered hover responsive className="mb-0">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Subject</th>
                                    <th>Category</th>
                                    <th>Submitted By</th>
                                    <th>Assigned To</th>
                                    <th>Priority</th>
                                    <th>Status</th>
                                    <th>Updated</th>
                                    <th>Response Due</th>
                                    <th>Resolution Due</th>
                                    <th>SLA</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tickets.length === 0 ? (
                                    <tr>
                                        <td colSpan={12} className="text-center py-4 text-muted">No tickets match the selected filters.</td>
                                    </tr>
                                ) : (
                                    tickets.map((ticket) => (
                                        <tr key={ticket.id}>
                                            <td>TICKET-{String(ticket.id).padStart(4, '0')}</td>
                                            <td>{ticket.subject}</td>
                                            <td>{ticket.categoryName === 'OTHER' ? ticket.otherCategory : ticket.categoryName?.replace(/_/g, ' ') || '—'}</td>
                                            <td>{ticket.submittedByName || '—'}</td>
                                            <td>{ticket.assignedToName || 'Unassigned'}</td>
                                            <td>
                                                <Badge bg={['HIGH', 'URGENT'].includes(ticket.priority) ? 'danger' : 'info'}>
                                                    {ticket.priority}
                                                </Badge>
                                            </td>
                                            <td>{getStatusBadge(ticket.status)}</td>
                                            <td>{formatDateTime(ticket.updatedAt || ticket.createdAt)}</td>
                                            <td>{formatDateTime(ticket.responseDueAt)}</td>
                                            <td>{formatDateTime(ticket.resolutionDueAt)}</td>
                                            <td className="text-nowrap">
                                                <Badge bg={ticket.responseBreached ? 'danger' : 'success'} className="me-1">Response</Badge>
                                                <Badge bg={ticket.resolutionBreached ? 'danger' : 'success'}>Resolution</Badge>
                                            </td>
                                            <td>
                                                <Button variant="outline-primary" size="sm" onClick={() => navigate(`/support/tickets/${ticket.id}`)}>
                                                    View
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </Table>
                    )}
                </Card.Body>
            </Card>

            <Modal show={showCreateModal} onHide={handleCloseModal} centered size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Create Support Ticket</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleCreateTicket}>
                    <Modal.Body>
                        <Row className="g-3">
                            <Col md={6}>
                                <Form.Group controlId="newTicketCategory">
                                    <Form.Label>Category</Form.Label>
                                    <Form.Select name="categoryId" value={newTicket.categoryId} onChange={handleCategoryChange} required>
                                        <option value="">Select a category</option>
                                        {categories.map((category) => (
                                            <option key={category.id} value={category.id}>{category.name.replace(/_/g, ' ')}</option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group controlId="newTicketPriority">
                                    <Form.Label>Priority</Form.Label>
                                    <Form.Select name="priority" value={newTicket.priority} onChange={handleFormChange}>
                                        <option value="LOW">Low</option>
                                        <option value="MEDIUM">Medium</option>
                                        <option value="HIGH">High</option>
                                        <option value="URGENT">Urgent</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            {showOtherCategory && (
                                <Col md={12}>
                                    <Form.Group controlId="newTicketOtherCategory">
                                        <Form.Label>Specify Category</Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="otherCategory"
                                            value={newTicket.otherCategory}
                                            onChange={handleFormChange}
                                            required
                                            placeholder="e.g., Printer Issue, Site Access Request"
                                        />
                                    </Form.Group>
                                </Col>
                            )}
                            <Col md={6}>
                                <Form.Group controlId="newTicketSubject">
                                    <Form.Label>Subject</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="subject"
                                        value={newTicket.subject}
                                        onChange={handleFormChange}
                                        required
                                        placeholder="Brief summary of the request"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group controlId="newTicketDepartment">
                                    <Form.Label>Department</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="submitterDepartment"
                                        value={newTicket.submitterDepartment}
                                        onChange={handleFormChange}
                                        placeholder="Department requesting support"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={12}>
                                <Form.Group controlId="newTicketDescription">
                                    <Form.Label>Description</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={5}
                                        name="description"
                                        value={newTicket.description}
                                        onChange={handleFormChange}
                                        required
                                        placeholder="Provide detailed information about the issue"
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={handleCloseModal} disabled={isSubmitting}>Cancel</Button>
                        <Button variant="primary" type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Submitting…' : 'Submit Ticket'}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </>
    );
};

export default SupportTicketPage;