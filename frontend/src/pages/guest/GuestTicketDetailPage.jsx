import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaPaperPlane, FaUserShield, FaStar, FaUser, FaUserCog, FaFlag, FaTags, FaExclamationCircle } from 'react-icons/fa';
import { toast } from 'react-toastify';
import api from '../../api/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import ThemeToggle from '../../components/common/ThemeToggle';
import './GuestStyles.css';

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
    const [assigning, setAssigning] = useState(false);
    const [assignStaffId, setAssignStaffId] = useState('');
    const [staffOptions, setStaffOptions] = useState([]);

    useEffect(() => {
        fetchTicket();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    useEffect(() => {
        if (!canManageTickets) return;
        const loadStaff = async () => {
            try {
                const resp = await api.get('/users');
                const users = Array.isArray(resp.data) ? resp.data : [];
                // prefer active staff users (exclude guests)
                const staff = users.filter(u => u.status?.name === 'ACTIVE' && u.role?.name !== 'GUEST')
                    .map(u => ({ id: u.id, label: `${(u.firstName || '') + ' ' + (u.lastName || '')}`.trim() || u.email || u.username }));
                setStaffOptions(staff);
            } catch (err) {
                console.error('Failed to load staff users', err);
            }
        };
        loadStaff();
    }, [canManageTickets]);

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
        return (
            <div className="guest-portal-page">
                <div className="guest-empty">Loading ticket details…</div>
            </div>
        );
    }

    if (!ticket) {
        return null;
    }

    return (
        <div className="guest-portal-page">
            {/* Header Banner */}
            <header className="guest-portal-header" data-animate="fade-up">
                <div>
                    <h1>Guest Ticket #{ticket.id}</h1>
                    <p>{ticket.subject}</p>
                    
                    {/* Beautiful Metadata Badges */}
                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(5, 1fr)',
                        gap: '1rem',
                        marginTop: '1.5rem'
                    }}
                    className="guest-metadata-grid">
                        {/* Guest Badge */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '1rem 1.25rem',
                            background: 'linear-gradient(135deg, rgba(70, 193, 235, 0.15), rgba(70, 193, 235, 0.05))',
                            border: '2px solid rgba(70, 193, 235, 0.4)',
                            borderRadius: '12px',
                            transition: 'all 0.3s ease',
                            cursor: 'default'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 8px 20px rgba(70, 193, 235, 0.25)';
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
                                background: 'rgba(70, 193, 235, 0.2)',
                                borderRadius: '10px'
                            }}>
                                <FaUser style={{ color: '#46C1EB', fontSize: '1.1rem' }} />
                            </div>
                            <div>
                                <div style={{ 
                                    fontSize: '0.75rem', 
                                    color: 'var(--guest-text-muted)',
                                    fontWeight: '600',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px'
                                }}>Guest</div>
                                <div style={{ 
                                    fontSize: '0.95rem', 
                                    color: 'var(--guest-text-primary)',
                                    fontWeight: '700',
                                    marginTop: '2px'
                                }}>{ticket.guestName || 'Unknown'}</div>
                            </div>
                        </div>

                        {/* Assigned Staff Badge */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '1rem 1.25rem',
                            background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.15), rgba(147, 51, 234, 0.05))',
                            border: '2px solid rgba(147, 51, 234, 0.4)',
                            borderRadius: '12px',
                            transition: 'all 0.3s ease',
                            cursor: 'default'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 8px 20px rgba(147, 51, 234, 0.25)';
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
                                background: 'rgba(147, 51, 234, 0.2)',
                                borderRadius: '10px'
                            }}>
                                <FaUserCog style={{ color: '#9333EA', fontSize: '1.1rem' }} />
                            </div>
                            <div>
                                <div style={{ 
                                    fontSize: '0.75rem', 
                                    color: 'var(--guest-text-muted)',
                                    fontWeight: '600',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px'
                                }}>Assigned To</div>
                                <div style={{ 
                                    fontSize: '0.95rem', 
                                    color: 'var(--guest-text-primary)',
                                    fontWeight: '700',
                                    marginTop: '2px'
                                }}>{ticket.assignedStaffName || 'Unassigned'}</div>
                            </div>
                        </div>

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
                    </div>
                </div>
                <div className="guest-portal-header-actions">
                    <button className="guest-back-button" onClick={() => navigate(-1)}>
                        <FaArrowLeft /> Back
                    </button>
                </div>
            </header>

            {/* Ticket Management Controls */}
            {canManageTickets && (
                <section className="guest-portal-card" data-animate="fade-up" data-delay="0.08">
                    <h2><FaUserShield /> Staff Controls</h2>
                    <div className="guest-portal-grid-2">
                        <div className="guest-auth-form-group">
                            <label className="guest-auth-form-label">Assign to Staff</label>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <select 
                                    className="guest-auth-select"
                                    value={assignStaffId} 
                                    onChange={(e) => setAssignStaffId(e.target.value)}
                                >
                                    <option value="">Select staff...</option>
                                    {staffOptions.map(s => (
                                        <option key={s.id} value={s.id}>{s.label} (#{s.id})</option>
                                    ))}
                                </select>
                                <button
                                    className="guest-auth-primary-btn"
                                    disabled={assigning || !assignStaffId}
                                    onClick={async () => {
                                        setAssigning(true);
                                        try {
                                            await api.post(`/guest/tickets/${id}/assign`, { staffUserId: Number(assignStaffId) });
                                            toast.success('Ticket assigned.');
                                            setAssignStaffId('');
                                            fetchTicket();
                                        } catch (error) {
                                            const msg = error.response?.data?.message || 'Unable to assign ticket.';
                                            toast.error(msg);
                                        } finally {
                                            setAssigning(false);
                                        }
                                    }}
                                >
                                    <FaUserShield /> Assign
                                </button>
                            </div>
                        </div>
                        <div className="guest-auth-form-group">
                            <label className="guest-auth-form-label">Update Status</label>
                            <select 
                                className="guest-auth-select"
                                value={ticket.status} 
                                onChange={handleStatusUpdate} 
                                disabled={updatingStatus}
                            >
                                {statusOptions.map((status) => (
                                    <option key={status} value={status}>{status}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </section>
            )}

            {/* Ticket Content */}
            <div className="guest-portal-grid">
                <section className="guest-portal-card" data-animate="fade-up" data-delay="0.12">
                    <h2>Issue Summary</h2>
                    <p style={{ lineHeight: '1.6', color: 'var(--guest-text-primary)' }}>
                        {ticket.description || 'No description provided.'}
                    </p>
                </section>

                {ticket.ratingScore && (
                    <section className="guest-portal-card" data-animate="fade-up" data-delay="0.16">
                        <h2><FaStar /> Guest Feedback</h2>
                        <div style={{ 
                            padding: '1.5rem', 
                            borderRadius: '12px', 
                            background: 'var(--guest-gold-light)',
                            border: '1px solid var(--guest-gold)'
                        }}>
                            <div className="guest-rating" style={{ marginBottom: '1rem', marginTop: 0 }}>
                                <FaStar /> {ticket.ratingScore}/5
                            </div>
                            <p style={{ margin: '0 0 0.5rem 0', color: 'var(--guest-text-primary)' }}>
                                {ticket.ratingComment || 'No comment provided.'}
                            </p>
                            <small style={{ color: 'var(--guest-text-muted)' }}>
                                Rated: {ticket.ratedAt ? new Date(ticket.ratedAt).toLocaleString() : '—'}
                            </small>
                        </div>
                    </section>
                )}
            </div>

            {/* Conversation Section */}
            <section className="guest-portal-card" data-animate="fade-up" data-delay="0.2">
                <h2><FaPaperPlane /> Conversation</h2>
                <div className="guest-ticket-thread">
                    {(ticket.messages || []).length === 0 ? (
                        <div className="guest-empty">No messages yet. Start the conversation below.</div>
                    ) : (
                        ticket.messages.map((message, index) => (
                            <div key={message.id ?? `local-${index}`} className={`guest-message guest-message--${message.sender?.toLowerCase()}`}>
                                <div className="guest-message__meta">
                                    <span><FaUserShield /> {message.senderDisplayName || message.sender}</span>
                                    <time>{message.createdAt ? new Date(message.createdAt).toLocaleString() : 'Just now'}</time>
                                </div>
                                <p>{message.message}</p>
                            </div>
                        ))
                    )}
                </div>

                {canManageTickets && (
                    <form className="guest-portal-form" onSubmit={handleSendMessage} style={{ marginTop: '1.5rem' }}>
                        <div className="guest-auth-form-group">
                            <label className="guest-auth-form-label">Write a Reply</label>
                            <textarea
                                className="guest-auth-textarea"
                                rows="4"
                                placeholder="Write an update for the guest…"
                                value={messageBody}
                                onChange={(event) => setMessageBody(event.target.value)}
                            />
                        </div>
                        <button type="submit" className="guest-auth-primary-btn" disabled={sending}>
                            <FaPaperPlane /> {sending ? 'Sending…' : 'Send Reply'}
                        </button>
                    </form>
                )}
            </section>
        </div>
    );
};

export default GuestTicketDetailPage;
