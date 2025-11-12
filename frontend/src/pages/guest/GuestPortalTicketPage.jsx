import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaArrowLeft, FaPaperPlane, FaStar } from 'react-icons/fa';
import { toast } from 'react-toastify';
import guestApi from '../../api/guestApi.js';
import './GuestPortalSelf.css';

const GuestPortalTicketPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [ticket, setTicket] = useState(null);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [ratingScore, setRatingScore] = useState(5);
    const [ratingComment, setRatingComment] = useState('');
    const [submittingRating, setSubmittingRating] = useState(false);

    const canRate = useMemo(() => {
        if (!ticket) return false;
        return (ticket.status === 'RESOLVED' || ticket.status === 'CLOSED') && !ticket.ratingScore;
    }, [ticket]);

    useEffect(() => {
        fetchTicket();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const fetchTicket = async () => {
        setLoading(true);
        try {
            const { data } = await guestApi.get(`/portal/guest/tickets/${id}`);
            setTicket(data);
        } catch (error) {
            toast.error('Unable to load ticket.');
            navigate('/guest/portal');
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = async (event) => {
        event.preventDefault();
        if (!message.trim()) {
            toast.warn('Message cannot be empty.');
            return;
        }
        setSending(true);
        try {
            await guestApi.post(`/portal/guest/tickets/${id}/messages`, { message, attachmentPaths: [] });
            setMessage('');
            toast.success('Message sent.');
            fetchTicket();
        } catch (error) {
            const errorMessage = error.validation?.message || error.response?.data?.message || 'Unable to send message';
            toast.error(errorMessage);
        } finally {
            setSending(false);
        }
    };

    const handleSubmitRating = async (event) => {
        event.preventDefault();
        setSubmittingRating(true);
        try {
            const { data } = await guestApi.post(`/portal/guest/tickets/${id}/rating`, {
                ratingScore,
                ratingComment
            });
            setTicket(data);
            toast.success('Thank you for your feedback!');
        } catch (error) {
            const messageText = error.validation?.message || error.response?.data?.message || 'Unable to submit rating';
            toast.error(messageText);
        } finally {
            setSubmittingRating(false);
        }
    };

    if (loading) {
        return <div className="guest-self-empty" style={{ padding: '2rem' }}>Loading ticket…</div>;
    }

    if (!ticket) {
        return null;
    }

    return (
        <div className="guest-self-portal" style={{ minHeight: '100vh' }}>
            <div className="guest-self-portal__header" style={{ maxWidth: '900px' }}>
                <button className="guest-self-portal__logout" onClick={() => navigate('/guest/portal')}>
                    <FaArrowLeft /> Back to portal
                </button>
                <div>
                    <h1>Ticket #{ticket.id}</h1>
                    <p>{ticket.subject}</p>
                    <div className="guest-self-meta" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        <small>Category: <strong>{ticket.category || '—'}</strong></small>
                        <small>Priority: <strong>{ticket.priority || '—'}</strong></small>
                        {ticket.responseDueAt && (
                            <small>Response due: {new Date(ticket.responseDueAt).toLocaleString()}</small>
                        )}
                        {ticket.resolutionDueAt && (
                            <small>Resolution due: {new Date(ticket.resolutionDueAt).toLocaleString()}</small>
                        )}
                    </div>
                </div>
            </div>

            <main style={{ maxWidth: '900px', margin: '0 auto', display: 'grid', gap: '1.5rem' }}>
                <section className="guest-self-portal__card">
                    <h2>Conversation</h2>
                    <div className="guest-self-ticket-thread">
                        {(ticket.messages || []).length === 0 ? (
                            <div className="guest-self-empty">No replies yet. Start the conversation below.</div>
                        ) : (
                            ticket.messages.map((entry) => (
                                <div key={entry.id} className={`guest-self-message guest-self-message--${entry.sender?.toLowerCase()}`}>
                                    <div className="guest-self-message__meta">
                                        <span>{entry.sender === 'GUEST' ? 'You' : 'Staff'}</span>
                                        <time>{entry.createdAt ? new Date(entry.createdAt).toLocaleString() : ''}</time>
                                    </div>
                                    <p>{entry.message}</p>
                                </div>
                            ))
                        )}
                    </div>
                    <form className="guest-self-portal__form" onSubmit={handleSendMessage}>
                        <label>
                            Reply
                            <textarea rows="4" value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Write a reply for the Bamika team" />
                        </label>
                        <button type="submit" className="guest-self-primary" disabled={sending}>
                            <FaPaperPlane /> {sending ? 'Sending…' : 'Send message'}
                        </button>
                    </form>
                </section>

                <section className="guest-self-portal__card">
                    <h2>Your Feedback</h2>
                    {ticket.ratingScore ? (
                        <div className="guest-self-rating-card">
                            <p className="guest-self-rating-row"><FaStar /> {ticket.ratingScore}/5</p>
                            <p>{ticket.ratingComment || 'No additional comments provided.'}</p>
                        </div>
                    ) : canRate ? (
                        <form className="guest-self-portal__form" onSubmit={handleSubmitRating}>
                            <label>
                                How would you rate our support?
                                <select value={ratingScore} onChange={(event) => setRatingScore(Number(event.target.value))}>
                                    {[5, 4, 3, 2, 1].map((score) => (
                                        <option key={score} value={score}>{score} - {score === 5 ? 'Excellent' : score === 4 ? 'Great' : score === 3 ? 'Good' : score === 2 ? 'Fair' : 'Poor'}</option>
                                    ))}
                                </select>
                            </label>
                            <label>
                                Additional comments (optional)
                                <textarea rows="3" value={ratingComment} onChange={(event) => setRatingComment(event.target.value)} />
                            </label>
                            <button type="submit" className="guest-self-primary" disabled={submittingRating}>
                                {submittingRating ? 'Submitting…' : 'Submit rating'}
                            </button>
                        </form>
                    ) : (
                        <div className="guest-self-empty">Ratings are available after our team marks the ticket as resolved.</div>
                    )}
                </section>
            </main>
        </div>
    );
};

export default GuestPortalTicketPage;
