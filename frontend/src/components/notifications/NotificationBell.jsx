import React, { useState, useEffect } from 'react';
import { Dropdown, Badge, ListGroup, Spinner } from 'react-bootstrap';
import { FaBell, FaCheckDouble, FaExternalLinkAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import api from '../../api/api.js';
import { toast } from 'react-toastify';
import './NotificationBell.css';

const NotificationBell = () => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [show, setShow] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchNotifications();
        fetchUnreadCount();
        
        // Poll for new notifications every 30 seconds
        const interval = setInterval(() => {
            fetchUnreadCount();
        }, 30000);

        return () => clearInterval(interval);
    }, []);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const response = await api.get('/notifications?page=0&size=10');
            setNotifications(response.data.content || response.data);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUnreadCount = async () => {
        try {
            const response = await api.get('/notifications/unread-count');
            setUnreadCount(response.data);
        } catch (error) {
            console.error('Failed to fetch unread count:', error);
        }
    };

    const markAsRead = async (notificationId) => {
        try {
            await api.put(`/notifications/${notificationId}/read`);
            setNotifications(prev =>
                prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.put('/notifications/mark-all-read');
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
            toast.success('All notifications marked as read');
        } catch (error) {
            toast.error('Failed to mark all as read');
        }
    };

    const handleNotificationClick = (notification) => {
        markAsRead(notification.id);
        if (notification.link) {
            navigate(notification.link);
            setShow(false);
        }
    };

    const getNotificationIcon = (type) => {
        const icons = {
            REQUISITION_APPROVED: '✅',
            REQUISITION_REJECTED: '❌',
            TICKET_ASSIGNED: '🎫',
            TICKET_RESOLVED: '✔️',
            PROJECT_UPDATED: '📊',
            PROJECT_COMPLETED: '🎉',
            USER_APPROVED: '👤',
            USER_DEACTIVATED: '🔒',
            STOCK_LOW: '⚠️',
            STOCK_CRITICAL: '🚨',
            REPORT_READY: '📄',
            SYSTEM_ALERT: '🔔'
        };
        return icons[type] || '📬';
    };

    const getTimeAgo = (timestamp) => {
        const now = new Date();
        const past = new Date(timestamp);
        const diffInSeconds = Math.floor((now - past) / 1000);

        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
        return past.toLocaleDateString();
    };

    const getPriorityClass = (priority) => {
        const classes = {
            LOW: 'priority-low',
            NORMAL: 'priority-normal',
            HIGH: 'priority-high',
            URGENT: 'priority-urgent'
        };
        return classes[priority] || 'priority-normal';
    };

    return (
        <Dropdown show={show} onToggle={setShow} align="end" className="notification-dropdown">
            <Dropdown.Toggle variant="link" className="notification-bell-toggle position-relative p-2">
                <FaBell size={20} />
                {unreadCount > 0 && (
                    <Badge 
                        bg="danger" 
                        pill 
                        className="position-absolute top-0 start-100 translate-middle"
                        style={{ fontSize: '0.65rem' }}
                    >
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </Badge>
                )}
            </Dropdown.Toggle>

            <Dropdown.Menu className="notification-menu shadow-lg">
                <div className="notification-header d-flex justify-content-between align-items-center px-3 py-2 border-bottom">
                    <h6 className="mb-0 fw-bold">Notifications</h6>
                    {unreadCount > 0 && (
                        <button 
                            className="btn btn-sm btn-link text-primary p-0" 
                            onClick={markAllAsRead}
                            title="Mark all as read"
                        >
                            <FaCheckDouble /> Mark all read
                        </button>
                    )}
                </div>

                <div className="notification-list" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {loading ? (
                        <div className="text-center py-4">
                            <Spinner animation="border" size="sm" />
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="text-center text-muted py-4">
                            <FaBell size={40} className="mb-2 opacity-50" />
                            <p className="mb-0">No notifications</p>
                        </div>
                    ) : (
                        <ListGroup variant="flush">
                            {notifications.map(notification => (
                                <ListGroup.Item
                                    key={notification.id}
                                    action
                                    onClick={() => handleNotificationClick(notification)}
                                    className={`notification-item ${!notification.isRead ? 'unread' : ''} ${getPriorityClass(notification.priority)}`}
                                >
                                    <div className="d-flex align-items-start">
                                        <div className="notification-icon me-2">
                                            {getNotificationIcon(notification.type)}
                                        </div>
                                        <div className="flex-grow-1">
                                            <div className="d-flex justify-content-between align-items-start">
                                                <strong className="notification-title">
                                                    {notification.title}
                                                </strong>
                                                <small className="text-muted ms-2">
                                                    {getTimeAgo(notification.createdAt)}
                                                </small>
                                            </div>
                                            <p className="notification-message mb-1">
                                                {notification.message}
                                            </p>
                                            {notification.link && (
                                                <small className="text-primary">
                                                    <FaExternalLinkAlt size={10} className="me-1" />
                                                    View details
                                                </small>
                                            )}
                                        </div>
                                        {!notification.isRead && (
                                            <Badge bg="primary" pill className="ms-2">New</Badge>
                                        )}
                                    </div>
                                </ListGroup.Item>
                            ))}
                        </ListGroup>
                    )}
                </div>

                {notifications.length > 0 && (
                    <div className="notification-footer border-top px-3 py-2 text-center">
                        <button 
                            className="btn btn-sm btn-link text-decoration-none" 
                            onClick={() => {
                                navigate('/notifications');
                                setShow(false);
                            }}
                        >
                            View all notifications
                        </button>
                    </div>
                )}
            </Dropdown.Menu>
        </Dropdown>
    );
};

export default NotificationBell;
