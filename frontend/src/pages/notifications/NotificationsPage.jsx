import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Button, Badge, Spinner, Form, Row, Col, Pagination } from 'react-bootstrap';
import { FaBell, FaCheckDouble, FaFilter, FaExternalLinkAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import api from '../../api/api.js';
import { toast } from 'react-toastify';

const NotificationsPage = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({
        type: '',
        priority: '',
        isRead: ''
    });
    const [pagination, setPagination] = useState({
        page: 0,
        size: 20,
        totalPages: 0,
        totalElements: 0
    });
    const navigate = useNavigate();

    useEffect(() => {
        fetchNotifications();
    }, [filters, pagination.page]);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const params = {
                page: pagination.page,
                size: pagination.size,
                ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== ''))
            };
            
            const response = await api.get('/notifications', { params });
            
            if (response.data.content) {
                // Paginated response
                setNotifications(response.data.content);
                setPagination(prev => ({
                    ...prev,
                    totalPages: response.data.totalPages,
                    totalElements: response.data.totalElements
                }));
            } else {
                // Simple array response
                setNotifications(response.data);
            }
        } catch (error) {
            toast.error('Failed to fetch notifications');
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id) => {
        try {
            await api.put(`/notifications/${id}/read`);
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, isRead: true } : n)
            );
            toast.success('Notification marked as read');
        } catch (error) {
            toast.error('Failed to mark as read');
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.put('/notifications/mark-all-read');
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            toast.success('All notifications marked as read');
        } catch (error) {
            toast.error('Failed to mark all as read');
        }
    };

    const deleteNotification = async (id) => {
        if (!window.confirm('Delete this notification?')) return;
        
        try {
            await api.delete(`/notifications/${id}`);
            setNotifications(prev => prev.filter(n => n.id !== id));
            toast.success('Notification deleted');
        } catch (error) {
            toast.error('Failed to delete notification');
        }
    };

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({ ...prev, [field]: value }));
        setPagination(prev => ({ ...prev, page: 0 })); // Reset to first page
    };

    const handleNotificationClick = (notification) => {
        if (!notification.isRead) {
            markAsRead(notification.id);
        }
        if (notification.link) {
            navigate(notification.link);
        }
    };

    const getNotificationIcon = (type) => {
        const icons = {
            REQUISITION_APPROVED: '✅',
            REQUISITION_REJECTED: '❌',
            REQUISITION_CREATED: '📝',
            TICKET_ASSIGNED: '🎫',
            TICKET_RESOLVED: '✔️',
            TICKET_CLOSED: '🔒',
            PROJECT_UPDATED: '📊',
            PROJECT_COMPLETED: '🎉',
            PROJECT_ASSIGNED: '👷',
            USER_APPROVED: '👤',
            USER_DEACTIVATED: '🔒',
            STOCK_LOW: '⚠️',
            STOCK_CRITICAL: '🚨',
            REPORT_READY: '📄',
            SYSTEM_ALERT: '🔔',
            FIELD_REPORT_SUBMITTED: '📋'
        };
        return icons[type] || '📬';
    };

    const getPriorityBadge = (priority) => {
        const variants = {
            LOW: 'secondary',
            NORMAL: 'info',
            HIGH: 'warning',
            URGENT: 'danger'
        };
        return <Badge bg={variants[priority] || 'secondary'}>{priority}</Badge>;
    };

    const getTypeBadge = (type) => {
        return <Badge bg="primary" className="text-capitalize">{type.replace(/_/g, ' ')}</Badge>;
    };

    const formatDate = (timestamp) => {
        return new Date(timestamp).toLocaleString();
    };

    const renderPagination = () => {
        if (pagination.totalPages <= 1) return null;

        const items = [];
        for (let i = 0; i < pagination.totalPages; i++) {
            items.push(
                <Pagination.Item
                    key={i}
                    active={i === pagination.page}
                    onClick={() => setPagination(prev => ({ ...prev, page: i }))}
                >
                    {i + 1}
                </Pagination.Item>
            );
        }

        return (
            <Pagination className="justify-content-center">
                <Pagination.First onClick={() => setPagination(prev => ({ ...prev, page: 0 }))} disabled={pagination.page === 0} />
                <Pagination.Prev onClick={() => setPagination(prev => ({ ...prev, page: Math.max(0, prev.page - 1) }))} disabled={pagination.page === 0} />
                {items}
                <Pagination.Next onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages - 1, prev.page + 1) }))} disabled={pagination.page === pagination.totalPages - 1} />
                <Pagination.Last onClick={() => setPagination(prev => ({ ...prev, page: prev.totalPages - 1 }))} disabled={pagination.page === pagination.totalPages - 1} />
            </Pagination>
        );
    };

    return (
        <Container fluid>
            {/* Header */}
            <Card className="shadow-sm mb-3">
                <Card.Header className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center">
                        <FaBell size={24} className="me-3 text-primary" />
                        <div>
                            <h4 className="mb-0">Notifications</h4>
                            <small className="text-muted">
                                {pagination.totalElements} total notification{pagination.totalElements !== 1 ? 's' : ''}
                            </small>
                        </div>
                    </div>
                    <Button variant="primary" size="sm" onClick={markAllAsRead} disabled={notifications.every(n => n.isRead)}>
                        <FaCheckDouble className="me-1" /> Mark All as Read
                    </Button>
                </Card.Header>
            </Card>

            {/* Filters */}
            <Card className="shadow-sm mb-3">
                <Card.Header>
                    <FaFilter className="me-2" /> Filters
                </Card.Header>
                <Card.Body>
                    <Row>
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label>Type</Form.Label>
                                <Form.Select value={filters.type} onChange={(e) => handleFilterChange('type', e.target.value)}>
                                    <option value="">All Types</option>
                                    <option value="REQUISITION_APPROVED">Requisition Approved</option>
                                    <option value="REQUISITION_REJECTED">Requisition Rejected</option>
                                    <option value="TICKET_ASSIGNED">Ticket Assigned</option>
                                    <option value="TICKET_RESOLVED">Ticket Resolved</option>
                                    <option value="PROJECT_UPDATED">Project Updated</option>
                                    <option value="PROJECT_COMPLETED">Project Completed</option>
                                    <option value="USER_APPROVED">User Approved</option>
                                    <option value="STOCK_LOW">Stock Low</option>
                                    <option value="STOCK_CRITICAL">Stock Critical</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label>Priority</Form.Label>
                                <Form.Select value={filters.priority} onChange={(e) => handleFilterChange('priority', e.target.value)}>
                                    <option value="">All Priorities</option>
                                    <option value="LOW">Low</option>
                                    <option value="NORMAL">Normal</option>
                                    <option value="HIGH">High</option>
                                    <option value="URGENT">Urgent</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label>Status</Form.Label>
                                <Form.Select value={filters.isRead} onChange={(e) => handleFilterChange('isRead', e.target.value)}>
                                    <option value="">All</option>
                                    <option value="false">Unread</option>
                                    <option value="true">Read</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* Notifications Table */}
            <Card className="shadow-sm">
                <Card.Body className="p-0">
                    {loading ? (
                        <div className="text-center p-5">
                            <Spinner animation="border" />
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="text-center text-muted p-5">
                            <FaBell size={50} className="mb-3 opacity-50" />
                            <p>No notifications found</p>
                        </div>
                    ) : (
                        <>
                            <Table hover responsive className="mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th style={{ width: '50px' }}></th>
                                        <th>Title</th>
                                        <th>Message</th>
                                        <th>Type</th>
                                        <th>Priority</th>
                                        <th>Date</th>
                                        <th style={{ width: '150px' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {notifications.map(notification => (
                                        <tr
                                            key={notification.id}
                                            className={!notification.isRead ? 'table-primary' : ''}
                                            style={{ cursor: notification.link ? 'pointer' : 'default' }}
                                        >
                                            <td className="text-center">
                                                <span style={{ fontSize: '1.5rem' }}>
                                                    {getNotificationIcon(notification.type)}
                                                </span>
                                            </td>
                                            <td>
                                                <strong>{notification.title}</strong>
                                                {!notification.isRead && <Badge bg="primary" className="ms-2">New</Badge>}
                                            </td>
                                            <td>{notification.message}</td>
                                            <td>{getTypeBadge(notification.type)}</td>
                                            <td>{getPriorityBadge(notification.priority)}</td>
                                            <td>
                                                <small>{formatDate(notification.createdAt)}</small>
                                            </td>
                                            <td>
                                                <div className="d-flex gap-1">
                                                    {notification.link && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline-primary"
                                                            onClick={() => handleNotificationClick(notification)}
                                                            title="View details"
                                                        >
                                                            <FaExternalLinkAlt />
                                                        </Button>
                                                    )}
                                                    {!notification.isRead && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline-success"
                                                            onClick={() => markAsRead(notification.id)}
                                                            title="Mark as read"
                                                        >
                                                            <FaCheckDouble />
                                                        </Button>
                                                    )}
                                                    <Button
                                                        size="sm"
                                                        variant="outline-danger"
                                                        onClick={() => deleteNotification(notification.id)}
                                                        title="Delete"
                                                    >
                                                        ×
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                            {renderPagination()}
                        </>
                    )}
                </Card.Body>
            </Card>
        </Container>
    );
};

export default NotificationsPage;
