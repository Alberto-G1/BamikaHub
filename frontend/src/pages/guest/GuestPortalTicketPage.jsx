import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaArrowLeft, FaPaperPlane, FaStar, FaTags, FaFlag, FaExclamationCircle, FaClock } from 'react-icons/fa';
import { toast } from 'react-toastify';
import guestApi from '../../api/guestApi.js';
import ThemeToggle from '../../components/common/ThemeToggle';
import './GuestStyles.css';

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
        return (
            <div className="guest-ticket-detail-page">
                <div className="guest-empty">Loading ticket…</div>
            </div>
        );
    }

    if (!ticket) {
        return null;
    }

    return (
        <div className="guest-portal-page">
            {/* Header Banner with gradient background */}
            <header className="guest-portal-header" data-animate="fade-up">
                <div>
                    <h1>Ticket #{ticket.id}</h1>
                    <p>{ticket.subject}</p>
                    
                    {/* Beautiful Metadata Badges */}
                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '1rem',
                        marginTop: '1.5rem'
                    }}
                    className="guest-metadata-grid">
                        {/* Status Badge */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '1rem 1.25rem',
                            background: `linear-gradient(135deg, ${
                                ticket.status === 'PENDING' ? 'rgba(245, 158, 11, 0.15), rgba(245, 158, 11, 0.05)' :
                                ticket.status === 'IN_PROGRESS' ? 'rgba(59, 130, 246, 0.15), rgba(59, 130, 246, 0.05)' :
                                ticket.status === 'AWAITING_GUEST' ? 'rgba(147, 51, 234, 0.15), rgba(147, 51, 234, 0.05)' :
                                ticket.status === 'RESOLVED' ? 'rgba(16, 185, 129, 0.15), rgba(16, 185, 129, 0.05)' :
                                'rgba(100, 116, 139, 0.15), rgba(100, 116, 139, 0.05)'
                            })`,
                            border: `2px solid ${
                                ticket.status === 'PENDING' ? 'rgba(245, 158, 11, 0.4)' :
                                ticket.status === 'IN_PROGRESS' ? 'rgba(59, 130, 246, 0.4)' :
                                ticket.status === 'AWAITING_GUEST' ? 'rgba(147, 51, 234, 0.4)' :
                                ticket.status === 'RESOLVED' ? 'rgba(16, 185, 129, 0.4)' :
                                'rgba(100, 116, 139, 0.4)'
                            }`,
                            borderRadius: '12px',
                            transition: 'all 0.3s ease',
                            cursor: 'default'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = `0 8px 20px ${
                                ticket.status === 'PENDING' ? 'rgba(245, 158, 11, 0.25)' :
                                ticket.status === 'IN_PROGRESS' ? 'rgba(59, 130, 246, 0.25)' :
                                ticket.status === 'AWAITING_GUEST' ? 'rgba(147, 51, 234, 0.25)' :
                                ticket.status === 'RESOLVED' ? 'rgba(16, 185, 129, 0.25)' :
                                'rgba(100, 116, 139, 0.25)'
                            }`;
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '40px',
                                height: '40px',
                                background: `${
                                    ticket.status === 'PENDING' ? 'rgba(245, 158, 11, 0.2)' :
                                    ticket.status === 'IN_PROGRESS' ? 'rgba(59, 130, 246, 0.2)' :
                                    ticket.status === 'AWAITING_GUEST' ? 'rgba(147, 51, 234, 0.2)' :
                                    ticket.status === 'RESOLVED' ? 'rgba(16, 185, 129, 0.2)' :
                                    'rgba(100, 116, 139, 0.2)'
                                }`,
                                borderRadius: '10px'
                            }}>
                                <FaExclamationCircle style={{ 
                                    color: `${
                                        ticket.status === 'PENDING' ? '#F59E0B' :
                                        ticket.status === 'IN_PROGRESS' ? '#3B82F6' :
                                        ticket.status === 'AWAITING_GUEST' ? '#9333EA' :
                                        ticket.status === 'RESOLVED' ? '#10B981' :
                                        '#64748B'
                                    }`, 
                                    fontSize: '1.1rem' 
                                }} />
                            </div>
                            <div>
                                <div style={{ 
                                    fontSize: '0.75rem', 
                                    color: 'var(--guest-text-muted)',
                                    fontWeight: '600',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px'
                                }}>Status</div>
                                <div style={{ 
                                    fontSize: '0.95rem', 
                                    color: 'var(--guest-text-primary)',
                                    fontWeight: '700',
                                    marginTop: '2px'
                                }}>{ticket.status?.replace(/_/g, ' ')}</div>
                            </div>
                        </div>

                        {/* Category Badge */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '1rem 1.25rem',
                            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(16, 185, 129, 0.05))',
                            border: '2px solid rgba(16, 185, 129, 0.4)',
                            borderRadius: '12px',
                            transition: 'all 0.3s ease',
                            cursor: 'default'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 8px 20px rgba(16, 185, 129, 0.25)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '40px',
                                height: '40px',
                                background: 'rgba(16, 185, 129, 0.2)',
                                borderRadius: '10px'
                            }}>
                                <FaTags style={{ color: '#10B981', fontSize: '1.1rem' }} />
                            </div>
                            <div>
                                <div style={{ 
                                    fontSize: '0.75rem', 
                                    color: 'var(--guest-text-muted)',
                                    fontWeight: '600',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px'
                                }}>Category</div>
                                <div style={{ 
                                    fontSize: '0.95rem', 
                                    color: 'var(--guest-text-primary)',
                                    fontWeight: '700',
                                    marginTop: '2px'
                                }}>{ticket.category || 'General'}</div>
                            </div>
                        </div>

                        {/* Priority Badge */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '1rem 1.25rem',
                            background: `linear-gradient(135deg, ${
                                ticket.priority === 'CRITICAL' ? 'rgba(220, 38, 38, 0.15), rgba(220, 38, 38, 0.05)' :
                                ticket.priority === 'HIGH' ? 'rgba(239, 68, 68, 0.15), rgba(239, 68, 68, 0.05)' :
                                ticket.priority === 'MEDIUM' ? 'rgba(245, 158, 11, 0.15), rgba(245, 158, 11, 0.05)' :
                                'rgba(59, 130, 246, 0.15), rgba(59, 130, 246, 0.05)'
                            })`,
                            border: `2px solid ${
                                ticket.priority === 'CRITICAL' ? 'rgba(220, 38, 38, 0.4)' :
                                ticket.priority === 'HIGH' ? 'rgba(239, 68, 68, 0.4)' :
                                ticket.priority === 'MEDIUM' ? 'rgba(245, 158, 11, 0.4)' :
                                'rgba(59, 130, 246, 0.4)'
                            }`,
                            borderRadius: '12px',
                            transition: 'all 0.3s ease',
                            cursor: 'default'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = `0 8px 20px ${
                                ticket.priority === 'CRITICAL' ? 'rgba(220, 38, 38, 0.25)' :
                                ticket.priority === 'HIGH' ? 'rgba(239, 68, 68, 0.25)' :
                                ticket.priority === 'MEDIUM' ? 'rgba(245, 158, 11, 0.25)' :
                                'rgba(59, 130, 246, 0.25)'
                            }`;
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '40px',
                                height: '40px',
                                background: `${
                                    ticket.priority === 'CRITICAL' ? 'rgba(220, 38, 38, 0.2)' :
                                    ticket.priority === 'HIGH' ? 'rgba(239, 68, 68, 0.2)' :
                                    ticket.priority === 'MEDIUM' ? 'rgba(245, 158, 11, 0.2)' :
                                    'rgba(59, 130, 246, 0.2)'
                                }`,
                                borderRadius: '10px'
                            }}>
                                <FaFlag style={{ 
                                    color: `${
                                        ticket.priority === 'CRITICAL' ? '#DC2626' :
                                        ticket.priority === 'HIGH' ? '#EF4444' :
                                        ticket.priority === 'MEDIUM' ? '#F59E0B' :
                                        '#3B82F6'
                                    }`, 
                                    fontSize: '1.1rem' 
                                }} />
                            </div>
                            <div>
                                <div style={{ 
                                    fontSize: '0.75rem', 
                                    color: 'var(--guest-text-muted)',
                                    fontWeight: '600',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px'
                                }}>Priority</div>
                                <div style={{ 
                                    fontSize: '0.95rem', 
                                    color: 'var(--guest-text-primary)',
                                    fontWeight: '700',
                                    marginTop: '2px'
                                }}>{ticket.priority || 'LOW'}</div>
                            </div>
                        </div>

                        {/* Response Due Badge (if exists) */}
                        {ticket.responseDueAt && (
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                padding: '1rem 1.25rem',
                                background: 'linear-gradient(135deg, rgba(214, 163, 41, 0.15), rgba(214, 163, 41, 0.05))',
                                border: '2px solid rgba(214, 163, 41, 0.4)',
                                borderRadius: '12px',
                                transition: 'all 0.3s ease',
                                cursor: 'default'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 8px 20px rgba(214, 163, 41, 0.25)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = 'none';
                            }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '40px',
                                    height: '40px',
                                    background: 'rgba(214, 163, 41, 0.2)',
                                    borderRadius: '10px'
                                }}>
                                    <FaClock style={{ color: '#D6A329', fontSize: '1.1rem' }} />
                                </div>
                                <div>
                                    <div style={{ 
                                        fontSize: '0.75rem', 
                                        color: 'var(--guest-text-muted)',
                                        fontWeight: '600',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px'
                                    }}>Response Due</div>
                                    <div style={{ 
                                        fontSize: '0.85rem', 
                                        color: 'var(--guest-text-primary)',
                                        fontWeight: '700',
                                        marginTop: '2px'
                                    }}>{new Date(ticket.responseDueAt).toLocaleDateString()}</div>
                                </div>
                            </div>
                        )}

                        {/* Resolution Due Badge (if exists) */}
                        {ticket.resolutionDueAt && (
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                padding: '1rem 1.25rem',
                                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(239, 68, 68, 0.05))',
                                border: '2px solid rgba(239, 68, 68, 0.4)',
                                borderRadius: '12px',
                                transition: 'all 0.3s ease',
                                cursor: 'default'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 8px 20px rgba(239, 68, 68, 0.25)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = 'none';
                            }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '40px',
                                    height: '40px',
                                    background: 'rgba(239, 68, 68, 0.2)',
                                    borderRadius: '10px'
                                }}>
                                    <FaClock style={{ color: '#EF4444', fontSize: '1.1rem' }} />
                                </div>
                                <div>
                                    <div style={{ 
                                        fontSize: '0.75rem', 
                                        color: 'var(--guest-text-muted)',
                                        fontWeight: '600',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px'
                                    }}>Resolution Due</div>
                                    <div style={{ 
                                        fontSize: '0.85rem', 
                                        color: 'var(--guest-text-primary)',
                                        fontWeight: '700',
                                        marginTop: '2px'
                                    }}>{new Date(ticket.resolutionDueAt).toLocaleDateString()}</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <div className="guest-portal-header-actions">
                    <ThemeToggle />
                    <button className="guest-back-button" onClick={() => navigate('/guest/portal')}>
                        <FaArrowLeft /> Back to portal
                    </button>
                </div>
            </header>

            {/* Main Content Grid */}
            <div className="guest-portal-grid">
                <section className="guest-portal-card" data-animate="fade-up" data-delay="0.08">
                    <h2><FaPaperPlane /> Conversation</h2>
                    <div className="guest-ticket-thread">
                        {(ticket.messages || []).length === 0 ? (
                            <div className="guest-empty">No replies yet. Start the conversation below.</div>
                        ) : (
                            ticket.messages.map((entry) => (
                                <div key={entry.id} className={`guest-message guest-message--${entry.sender?.toLowerCase()}`}>
                                    <div className="guest-message__meta">
                                        <span>{entry.sender === 'GUEST' ? 'You' : 'Staff'}</span>
                                        <time>{entry.createdAt ? new Date(entry.createdAt).toLocaleString() : ''}</time>
                                    </div>
                                    <p>{entry.message}</p>
                                </div>
                            ))
                        )}
                    </div>
                    <form className="guest-portal-form" onSubmit={handleSendMessage}>
                        <div className="guest-auth-form-group">
                            <label className="guest-auth-form-label">Reply</label>
                            <textarea 
                                className="guest-auth-textarea"
                                rows="4" 
                                value={message} 
                                onChange={(event) => setMessage(event.target.value)} 
                                placeholder="Write a reply for the Bamika team" 
                            />
                        </div>
                        <button type="submit" className="guest-auth-primary-btn" disabled={sending}>
                            <FaPaperPlane /> {sending ? 'Sending…' : 'Send message'}
                        </button>
                    </form>
                </section>

                <section className="guest-portal-card" data-animate="fade-up" data-delay="0.12">
                    <h2><FaStar /> Your Feedback</h2>
                    {ticket.ratingScore ? (
                        <div style={{ 
                            padding: '1.5rem', 
                            borderRadius: '12px', 
                            background: 'var(--guest-gold-light)',
                            border: '1px solid var(--guest-gold)'
                        }}>
                            <div className="guest-rating" style={{ marginBottom: '1rem', marginTop: 0 }}>
                                <FaStar /> {ticket.ratingScore}/5
                            </div>
                            <p style={{ margin: 0, color: 'var(--guest-text-primary)' }}>
                                {ticket.ratingComment || 'No additional comments provided.'}
                            </p>
                        </div>
                    ) : canRate ? (
                        <form className="guest-portal-form" onSubmit={handleSubmitRating}>
                            <div className="guest-auth-form-group">
                                <label className="guest-auth-form-label">How would you rate our support?</label>
                                <select 
                                    className="guest-auth-select"
                                    value={ratingScore} 
                                    onChange={(event) => setRatingScore(Number(event.target.value))}
                                >
                                    {[5, 4, 3, 2, 1].map((score) => (
                                        <option key={score} value={score}>
                                            {score} - {score === 5 ? 'Excellent' : score === 4 ? 'Great' : score === 3 ? 'Good' : score === 2 ? 'Fair' : 'Poor'}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="guest-auth-form-group">
                                <label className="guest-auth-form-label">Additional comments (optional)</label>
                                <textarea 
                                    className="guest-auth-textarea"
                                    rows="3" 
                                    value={ratingComment} 
                                    onChange={(event) => setRatingComment(event.target.value)} 
                                />
                            </div>
                            <button type="submit" className="guest-auth-primary-btn" disabled={submittingRating}>
                                <FaStar /> {submittingRating ? 'Submitting…' : 'Submit rating'}
                            </button>
                        </form>
                    ) : (
                        <div className="guest-empty">
                            <p>Ratings are available after our team marks the ticket as resolved.</p>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
};

export default GuestPortalTicketPage;
