import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaPaperPlane, FaUserShield } from 'react-icons/fa';
import { toast } from 'react-toastify';
import api from '../../api/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import './GuestPortal.css';

const statusOptions = [
    'PENDING',
    'IN_PROGRESS',
    'AWAITING_GUEST',
    'RESOLVED',
    'CLOSED'
];

const GuestTicketDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { hasPermission } = useAuth();
    const canManageTickets = hasPermission('GUEST_TICKET_MANAGE');

    const [ticket, setTicket] = useState(null);
    const [loading, setLoading] = useState(true);
    const [messageBody, setMessageBody] = useState('');
    const [sending, setSending] = useState(false);
    const [updatingStatus, setUpdatingStatus] = useState(false);

    useEffect(() => {
        fetchTicket();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const fetchTicket = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/guest/tickets/${id}`);
            setTicket(response.data);
        } catch (error) {
            toast.error('Unable to load ticket details.');
            navigate('/support/guest');
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = async (event) => {
        event.preventDefault();
        if (!messageBody.trim()) {
            toast.warn('Message cannot be empty.');
            return;
        }
        setSending(true);
        try {
            await api.post(`/guest/tickets/${id}/messages`, {
                sender: 'STAFF',
                message: messageBody,
                attachmentPaths: []
            });
            setMessageBody('');
            toast.success('Reply sent.');
            fetchTicket();
        } catch (error) {
            const message = error.response?.data?.message || 'Unable to send message.';
            toast.error(message);
        } finally {
            setSending(false);
        }
    };

    const handleStatusUpdate = async (event) => {
        const nextStatus = event.target.value;
        setUpdatingStatus(true);
        try {
            await api.post(`/guest/tickets/${id}/status`, {
                ticketId: Number(id),
                nextStatus
            });
            toast.success('Ticket status updated.');
            fetchTicket();
        } catch (error) {
            const message = error.response?.data?.message || 'Unable to update ticket status.';
            toast.error(message);
        } finally {
            setUpdatingStatus(false);
        }
    };

    if (loading) {
        return <div className="guest-loading">Loading ticket details…</div>;
    }

    if (!ticket) {
        return null;
    }

    return (
        <div className="guest-portal-page">
            <div className="guest-portal-card">
                <button className="guest-secondary" onClick={() => navigate(-1)}>
                    <FaArrowLeft /> Back
                </button>

                <header className="guest-ticket-header">
                    <div>
                        <h1>Guest Ticket #{ticket.id}</h1>
                        <p>{ticket.subject}</p>
                    </div>
                    <div className="guest-ticket-meta">
                        <div>
                            <span className="guest-ticket-meta-label">Guest</span>
                            <strong>{ticket.guestName || 'Unknown guest'}</strong>
                        </div>
                        <div>
                            <span className="guest-ticket-meta-label">Assigned Staff</span>
                            <strong>{ticket.assignedStaffName || 'Unassigned'}</strong>
                        </div>
                        <div>
                            <span className="guest-ticket-meta-label">Status</span>
                            {canManageTickets ? (
                                <select value={ticket.status} onChange={handleStatusUpdate} disabled={updatingStatus}>
                                    {statusOptions.map((status) => (
                                        <option key={status} value={status}>{status}</option>
                                    ))}
                                </select>
                            ) : (
                                <span className={`guest-status guest-status--${ticket.status?.toLowerCase()}`}>{ticket.status}</span>
                            )}
                        </div>
                    </div>
                </header>

                <section className="guest-ticket-body">
                    <article className="guest-ticket-description">
                        <h2>Issue Summary</h2>
                        <p>{ticket.description || 'No description provided.'}</p>
                    </article>

                    <aside className="guest-ticket-rating">
                        <h2>Guest Feedback</h2>
                        {ticket.ratingScore ? (
                            <div className="guest-rating-card">
                                <p><strong>Rating:</strong> {ticket.ratingScore}/5</p>
                                <p><strong>Comment:</strong> {ticket.ratingComment || 'No comment provided.'}</p>
                                <p><strong>Rated:</strong> {ticket.ratedAt ? new Date(ticket.ratedAt).toLocaleString() : '—'}</p>
                            </div>
                        ) : (
                            <p className="guest-empty">Guest has not rated this ticket yet.</p>
                        )}
                    </aside>

                    <div className="guest-ticket-conversation">
                        <h2>Conversation</h2>
                        <div className="guest-ticket-messages">
                            {(ticket.messages || []).length === 0 ? (
                                <div className="guest-empty">No messages yet. Start the conversation below.</div>
                            ) : (
                                ticket.messages.map((message, index) => (
                                    <div key={message.id ?? `local-${index}`} className={`guest-message guest-message--${message.sender?.toLowerCase()}`}>
                                        <div className="guest-message-header">
                                            <span><FaUserShield /> {message.sender}</span>
                                            <time>{message.createdAt ? new Date(message.createdAt).toLocaleString() : 'Just now'}</time>
                                        </div>
                                        <p>{message.message}</p>
                                    </div>
                                ))
                            )}
                        </div>

                        {canManageTickets && (
                            <form className="guest-message-form" onSubmit={handleSendMessage}>
                                <textarea
                                    rows="4"
                                    placeholder="Write an update for the guest…"
                                    value={messageBody}
                                    onChange={(event) => setMessageBody(event.target.value)}
                                />
                                <button type="submit" className="guest-primary" disabled={sending}>
                                    <FaPaperPlane /> {sending ? 'Sending…' : 'Send Reply'}
                                </button>
                            </form>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
};

export default GuestTicketDetailPage;
