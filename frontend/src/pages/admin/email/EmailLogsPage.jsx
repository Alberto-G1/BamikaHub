import React, { useState, useEffect } from 'react';
import { FaEnvelope, FaEye, FaCheckCircle, FaExclamationCircle, FaClock, FaUser, FaSearch, FaFilter } from 'react-icons/fa';
import adminApi from '../../../api/adminApi';
import { toast } from 'react-toastify';
import './EmailLogs.css';

const EmailLogsPage = () => {
    const [messages, setMessages] = useState([]);
    const [selected, setSelected] = useState(null);
    const [recipients, setRecipients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [recipientsLoading, setRecipientsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => { 
        fetchLogs(); 
    }, []);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const res = await adminApi.get('/admin/email/messages');
            setMessages(res.data);
        } catch (error) {
            console.error('Failed to fetch email logs:', error);
            toast.error('Failed to load email logs');
        } finally {
            setLoading(false);
        }
    }

    const loadRecipients = async (id) => {
        setRecipientsLoading(true);
        try {
            const res = await adminApi.get(`/admin/email/messages/${id}/recipients`);
            setRecipients(res.data);
            setSelected(id);
        } catch (error) {
            console.error('Failed to fetch recipients:', error);
            toast.error('Failed to load recipients');
        } finally {
            setRecipientsLoading(false);
        }
    }

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'sent':
            case 'delivered':
                return 'success';
            case 'failed':
            case 'bounced':
                return 'danger';
            case 'pending':
            case 'processing':
                return 'warning';
            default:
                return 'secondary';
        }
    }

    const getStatusIcon = (status) => {
        switch (status?.toLowerCase()) {
            case 'sent':
            case 'delivered':
                return <FaCheckCircle />;
            case 'failed':
            case 'bounced':
                return <FaExclamationCircle />;
            case 'pending':
            case 'processing':
                return <FaClock />;
            default:
                return <FaEnvelope />;
        }
    }

    const formatDate = (dateString) => {
        if (!dateString) return '—';
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    }

    const filteredMessages = messages.filter(message => {
        const matchesSearch = searchTerm === '' || 
            message.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            message.recipientsCsv?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = statusFilter === 'all' || 
            recipients.some(recipient => recipient.status?.toLowerCase() === statusFilter.toLowerCase());
        
        return matchesSearch && (statusFilter === 'all' || matchesStatus);
    });

    const getRecipientStats = (recipients) => {
        const stats = {
            total: recipients.length,
            sent: recipients.filter(r => r.status?.toLowerCase() === 'sent').length,
            failed: recipients.filter(r => r.status?.toLowerCase() === 'failed').length,
            pending: recipients.filter(r => r.status?.toLowerCase() === 'pending').length
        };
        return stats;
    }

    if (loading) {
        return (
            <div className="reporting-loading">
                <div className="reporting-spinner" />
                <p>Loading email logs...</p>
            </div>
        );
    }

    return (
        <section className="reporting-page">
            <div className="reporting-banner" data-animate="fade-up">
                <div className="reporting-banner__content">
                    <div className="reporting-banner__info">
                        <span className="reporting-banner__eyebrow">
                            <FaEnvelope /> Communication
                        </span>
                        <h1 className="reporting-banner__title">Email Logs</h1>
                        <p className="reporting-banner__subtitle">
                            Monitor email delivery status, track recipient responses, 
                            and troubleshoot delivery issues.
                        </p>
                    </div>
                </div>
                <div className="reporting-banner__meta">
                    <div className="reporting-banner__meta-item">
                        <div className="reporting-banner__meta-icon reporting-banner__meta-icon--blue">
                            <FaEnvelope />
                        </div>
                        <div className="reporting-banner__meta-content">
                            <span className="reporting-banner__meta-label">Total Messages</span>
                            <span className="reporting-banner__meta-value">{messages.length}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="email-logs-content">
                <div className="email-logs-grid" data-animate="fade-up" data-delay="0.04">
                    {/* Messages List */}
                    <div className="reporting-card">
                        <div className="reporting-card__header">
                            <div>
                                <h2 className="reporting-card__title">Email Messages</h2>
                                <p className="reporting-card__subtitle">Sent email campaigns and notifications</p>
                            </div>
                            <div className="email-logs-filters">
                                <div className="reporting-form-group">
                                    <div className="search-input-wrapper">
                                        <FaSearch className="search-icon" />
                                        <input
                                            type="text"
                                            placeholder="Search messages..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="reporting-input reporting-input--search"
                                        />
                                    </div>
                                </div>
                                <div className="reporting-form-group">
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        className="reporting-select"
                                    >
                                        <option value="all">All Statuses</option>
                                        <option value="sent">Sent</option>
                                        <option value="failed">Failed</option>
                                        <option value="pending">Pending</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="reporting-card__content">
                            <div className="messages-list">
                                {filteredMessages.length > 0 ? (
                                    filteredMessages.map(message => (
                                        <div 
                                            key={message.id} 
                                            className={`message-item ${selected === message.id ? 'is-selected' : ''}`}
                                            onClick={() => loadRecipients(message.id)}
                                        >
                                            <div className="message-header">
                                                <h3 className="message-subject">{message.subject}</h3>
                                                <div className="message-meta">
                                                    <span className="message-date">
                                                        {formatDate(message.createdAt)}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="message-preview">
                                                <p className="message-recipients">
                                                    To: {message.recipientsCsv || 'No recipients'}
                                                </p>
                                            </div>
                                            <div className="message-actions">
                                                <button 
                                                    className="reporting-btn reporting-btn--secondary reporting-btn--sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        loadRecipients(message.id);
                                                    }}
                                                >
                                                    <FaEye /> View Details
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="reporting-empty-state">
                                        <FaEnvelope className="empty-icon" />
                                        <p>No email messages found</p>
                                        {searchTerm || statusFilter !== 'all' ? (
                                            <p>Try adjusting your search or filter criteria</p>
                                        ) : null}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Recipients Details */}
                    <div className="reporting-card">
                        <div className="reporting-card__header">
                            <div>
                                <h2 className="reporting-card__title">
                                    <FaUser /> Recipient Details
                                </h2>
                                <p className="reporting-card__subtitle">
                                    {selected ? 'Delivery status for selected message' : 'Select a message to view recipients'}
                                </p>
                            </div>
                            {selected && recipients.length > 0 && (
                                <div className="recipient-stats">
                                    <span className="reporting-badge reporting-badge--success">
                                        Sent: {getRecipientStats(recipients).sent}
                                    </span>
                                    <span className="reporting-badge reporting-badge--danger">
                                        Failed: {getRecipientStats(recipients).failed}
                                    </span>
                                    <span className="reporting-badge reporting-badge--warning">
                                        Pending: {getRecipientStats(recipients).pending}
                                    </span>
                                </div>
                            )}
                        </div>
                        <div className="reporting-card__content">
                            {recipientsLoading ? (
                                <div className="reporting-loading">
                                    <div className="reporting-spinner" />
                                    <p>Loading recipients...</p>
                                </div>
                            ) : selected ? (
                                <div className="recipients-list">
                                    {recipients.length > 0 ? (
                                        recipients.map(recipient => (
                                            <div key={recipient.id} className="recipient-item">
                                                <div className="recipient-info">
                                                    <div className="recipient-email">
                                                        {recipient.recipientEmail}
                                                    </div>
                                                    <div className="recipient-meta">
                                                        <span className="recipient-date">
                                                            {formatDate(recipient.sentAt)}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="recipient-status">
                                                    <span 
                                                        className={`reporting-badge reporting-badge--${getStatusColor(recipient.status)}`}
                                                    >
                                                        {getStatusIcon(recipient.status)} {recipient.status}
                                                    </span>
                                                    {recipient.errorMessage && (
                                                        <div className="recipient-error">
                                                            <small>{recipient.errorMessage}</small>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="reporting-empty-state">
                                            <FaUser className="empty-icon" />
                                            <p>No recipients found for this message</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="reporting-empty-state">
                                    <FaEye className="empty-icon" />
                                    <p>Select an email message to view recipient details</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Selected Message Details */}
                {selected && (
                    <div className="reporting-card" data-animate="fade-up" data-delay="0.08">
                        <div className="reporting-card__header">
                            <h2 className="reporting-card__title">Message Details</h2>
                            <button 
                                onClick={() => {
                                    setSelected(null);
                                    setRecipients([]);
                                }}
                                className="reporting-btn reporting-btn--secondary"
                            >
                                Clear Selection
                            </button>
                        </div>
                        <div className="reporting-card__content">
                            <div className="message-details-grid">
                                <div className="message-detail-item">
                                    <span className="detail-label">Subject</span>
                                    <span className="detail-value">
                                        {messages.find(m => m.id === selected)?.subject}
                                    </span>
                                </div>
                                <div className="message-detail-item">
                                    <span className="detail-label">Total Recipients</span>
                                    <span className="detail-value">{recipients.length}</span>
                                </div>
                                <div className="message-detail-item">
                                    <span className="detail-label">Sent Date</span>
                                    <span className="detail-value">
                                        {formatDate(messages.find(m => m.id === selected)?.createdAt)}
                                    </span>
                                </div>
                                <div className="message-detail-item">
                                    <span className="detail-label">Success Rate</span>
                                    <span className="detail-value">
                                        {recipients.length > 0 
                                            ? `${Math.round((getRecipientStats(recipients).sent / recipients.length) * 100)}%`
                                            : '0%'
                                        }
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}

export default EmailLogsPage;