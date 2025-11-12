import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaPlusCircle, FaSignOutAlt, FaStar, FaTicketAlt, FaComments, FaChartBar } from 'react-icons/fa';
import { toast } from 'react-toastify';
import guestApi from '../../api/guestApi.js';
import { useGuestAuth } from '../../context/GuestAuthContext.jsx';
import ThemeToggle from '../../components/common/ThemeToggle';
import './GuestStyles.css';

const defaultTicketForm = {
    subject: '',
    description: '',
    category: 'General',
    priority: 'MEDIUM',
    attachmentPaths: []
};

const statusLabels = {
    PENDING: 'Pending',
    IN_PROGRESS: 'In Progress',
    AWAITING_GUEST: 'Awaiting You',
    RESOLVED: 'Resolved',
    CLOSED: 'Closed'
};

const GuestPortalDashboardPage = () => {
    const { guest, updateGuest, logoutGuest } = useGuestAuth();
    const [profile, setProfile] = useState(guest);
    const [tickets, setTickets] = useState([]);
    const [loadingTickets, setLoadingTickets] = useState(true);
    const [ticketForm, setTicketForm] = useState(defaultTicketForm);
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        refreshProfile();
        fetchTickets();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const refreshProfile = async () => {
        try {
            const { data } = await guestApi.get('/portal/guest/me');
            setProfile(data);
            updateGuest(data);
        } catch (error) {
            console.error('Failed to refresh profile:', error);
        }
    };

    const fetchTickets = async () => {
        setLoadingTickets(true);
        try {
            const { data } = await guestApi.get('/portal/guest/tickets');
            setTickets(Array.isArray(data) ? data : []);
        } catch (error) {
            toast.error('Unable to load your tickets right now.');
        } finally {
            setLoadingTickets(false);
        }
    };

    const handleTicketInputChange = (event) => {
        const { name, value } = event.target;
        setTicketForm((previous) => ({ ...previous, [name]: value }));
    };

    const handleCreateTicket = async (event) => {
        event.preventDefault();
        if (!ticketForm.subject.trim() || !ticketForm.description.trim()) {
            toast.warn('Please provide a subject and description.');
            return;
        }
        setCreating(true);
        try {
            await guestApi.post('/portal/guest/tickets', {
                subject: ticketForm.subject,
                description: ticketForm.description,
                category: ticketForm.category,
                priority: ticketForm.priority,
                attachmentPaths: ticketForm.attachmentPaths
            });
            toast.success('Ticket submitted!');
            setTicketForm(defaultTicketForm);
            fetchTickets();
        } catch (error) {
            const message = error.validation?.message || error.response?.data?.message || 'Unable to create ticket';
            toast.error(message);
        } finally {
            setCreating(false);
        }
    };

    const ratedTickets = useMemo(() => tickets.filter((ticket) => ticket.ratingScore), [tickets]);
    const activeTickets = useMemo(() => tickets.filter((ticket) => 
        !['RESOLVED', 'CLOSED'].includes(ticket.status)
    ), [tickets]);

    return (
        <div className="guest-portal-page">
            <header className="guest-portal-header" data-animate="fade-up">
                <div>
                    <h1>Guest Portal</h1>
                    <p>Welcome back{profile?.fullName ? `, ${profile.fullName}` : ''}! Manage your support experience here.</p>
                    <div className="guest-meta">
                        <small><strong>Email:</strong> {profile?.email}</small>
                        <small><strong>Company:</strong> {profile?.companyName || '—'}</small>
                    </div>
                </div>
                <div className="guest-portal-header-actions">
                    <ThemeToggle />
                    <button className="guest-portal-logout" onClick={logoutGuest}>
                        <FaSignOutAlt /> Sign out
                    </button>
                </div>
            </header>

            <section className="guest-portal-grid">
                {/* Create Ticket Card */}
                <article className="guest-portal-card" data-animate="fade-up" data-delay="0.08">
                    <h2><FaPlusCircle /> Raise a Ticket</h2>
                    <form onSubmit={handleCreateTicket} className="guest-portal-form">
                        <div className="guest-auth-form-group">
                            <label className="guest-auth-form-label">Subject</label>
                            <input 
                                name="subject" 
                                className="guest-auth-input"
                                value={ticketForm.subject} 
                                onChange={handleTicketInputChange} 
                                required 
                            />
                        </div>
                        
                        <div className="guest-auth-form-group">
                            <label className="guest-auth-form-label">Description</label>
                            <textarea 
                                name="description" 
                                rows="4" 
                                className="guest-auth-textarea"
                                value={ticketForm.description} 
                                onChange={handleTicketInputChange} 
                                required 
                            />
                        </div>
                        
                        <div className="guest-portal-grid-2">
                            <div className="guest-auth-form-group">
                                <label className="guest-auth-form-label">Category</label>
                                <select 
                                    name="category" 
                                    className="guest-auth-select"
                                    value={ticketForm.category} 
                                    onChange={handleTicketInputChange}
                                >
                                    <option>General</option>
                                    <option>Billing</option>
                                    <option>Technical</option>
                                    <option>Logistics</option>
                                </select>
                            </div>
                            
                            <div className="guest-auth-form-group">
                                <label className="guest-auth-form-label">Priority</label>
                                <select 
                                    name="priority" 
                                    className="guest-auth-select"
                                    value={ticketForm.priority} 
                                    onChange={handleTicketInputChange}
                                >
                                    <option value="CRITICAL">Critical</option>
                                    <option value="HIGH">High</option>
                                    <option value="MEDIUM">Medium</option>
                                    <option value="LOW">Low</option>
                                </select>
                            </div>
                        </div>
                        
                        <button 
                            type="submit" 
                            className="guest-auth-primary-btn" 
                            disabled={creating}
                            style={{ marginTop: '1rem' }}
                        >
                            {creating ? 'Submitting…' : 'Submit Ticket'}
                        </button>
                    </form>
                </article>

                {/* Tickets Overview Card */}
                <article className="guest-portal-card" data-animate="fade-up" data-delay="0.12">
                    <h2><FaTicketAlt /> Your Tickets</h2>
                    {loadingTickets ? (
                        <div className="guest-empty">Loading your tickets…</div>
                    ) : tickets.length === 0 ? (
                        <div className="guest-empty">
                            <FaComments style={{ fontSize: '2rem', marginBottom: '1rem', opacity: 0.5 }} />
                            <p>You haven't created any tickets yet.</p>
                            <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>Create your first ticket to get started!</p>
                        </div>
                    ) : (
                        <ul className="guest-ticket-list">
                            {tickets.map((ticket) => (
                                <li key={ticket.id}>
                                    <Link to={`/guest/portal/tickets/${ticket.id}`}>
                                        <span className={`guest-status guest-status--${ticket.status?.toLowerCase()}`}>
                                            {statusLabels[ticket.status] || ticket.status}
                                        </span>
                                        <strong>{ticket.subject}</strong>
                                        <div className="guest-meta">
                                            <small>Category: {ticket.category || '—'}</small>
                                            <small>Priority: {ticket.priority || '—'}</small>
                                        </div>
                                        <small>Updated {ticket.updatedAt ? new Date(ticket.updatedAt).toLocaleString() : 'recently'}</small>
                                        {ticket.ratingScore && (
                                            <span className="guest-rating"><FaStar /> {ticket.ratingScore}/5</span>
                                        )}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </article>

                {/* Quick Stats Card */}
                <article className="guest-portal-card" data-animate="fade-up" data-delay="0.16">
                    <h2><FaChartBar /> Quick Stats</h2>
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            padding: '1rem',
                            background: 'var(--guest-blue-light)',
                            borderRadius: '12px',
                            border: '1px solid rgba(70, 193, 235, 0.3)'
                        }}>
                            <span>Active Tickets</span>
                            <strong style={{ fontSize: '1.5rem', color: 'var(--guest-blue)' }}>
                                {activeTickets.length}
                            </strong>
                        </div>
                        
                        <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            padding: '1rem',
                            background: 'var(--guest-green-light)',
                            borderRadius: '12px',
                            border: '1px solid rgba(16, 185, 129, 0.3)'
                        }}>
                            <span>Total Tickets</span>
                            <strong style={{ fontSize: '1.5rem', color: 'var(--guest-green)' }}>
                                {tickets.length}
                            </strong>
                        </div>
                        
                        <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            padding: '1rem',
                            background: 'var(--guest-gold-light)',
                            borderRadius: '12px',
                            border: '1px solid rgba(214, 163, 41, 0.3)'
                        }}>
                            <span>Rated Tickets</span>
                            <strong style={{ fontSize: '1.5rem', color: 'var(--guest-gold)' }}>
                                {ratedTickets.length}
                            </strong>
                        </div>
                    </div>
                </article>

                {/* Recent Feedback Card */}
                <article className="guest-portal-card" data-animate="fade-up" data-delay="0.2">
                    <h2><FaStar /> Recent Feedback</h2>
                    {ratedTickets.length === 0 ? (
                        <div className="guest-empty">
                            <FaStar style={{ fontSize: '2rem', marginBottom: '1rem', opacity: 0.5 }} />
                            <p>You haven't rated any tickets yet.</p>
                            <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>Ratings help us improve our service!</p>
                        </div>
                    ) : (
                        <ul className="guest-rating-list">
                            {ratedTickets.slice(0, 5).map((ticket) => (
                                <li key={ticket.id}>
                                    <div className="guest-rating-row">
                                        <span className="guest-rating"><FaStar /> {ticket.ratingScore}/5</span>
                                        <small>{ticket.ratedAt ? new Date(ticket.ratedAt).toLocaleDateString() : ''}</small>
                                    </div>
                                    <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>
                                        {ticket.ratingComment || 'No comment provided.'}
                                    </p>
                                    <small style={{ color: 'var(--reporting-text-muted)' }}>
                                        Re: {ticket.subject}
                                    </small>
                                </li>
                            ))}
                        </ul>
                    )}
                </article>
            </section>
        </div>
    );
};

export default GuestPortalDashboardPage;