import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaPlusCircle, FaSignOutAlt, FaStar } from 'react-icons/fa';
import { toast } from 'react-toastify';
import guestApi from '../../api/guestApi.js';
import { useGuestAuth } from '../../context/GuestAuthContext.jsx';
import './GuestPortalSelf.css';

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
            // ignore but inform user if necessary
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

    return (
        <div className="guest-self-portal">
            <header className="guest-self-portal__header">
                <div>
                    <h1>Guest Portal</h1>
                    <p>Welcome back{profile?.fullName ? `, ${profile.fullName}` : ''}! Manage your support experience here.</p>
                </div>
                <button className="guest-self-portal__logout" onClick={logoutGuest}>
                    <FaSignOutAlt /> Sign out
                </button>
            </header>

            <section className="guest-self-portal__grid">
                <article className="guest-self-portal__card">
                    <h2><FaPlusCircle /> Raise a Ticket</h2>
                    <form onSubmit={handleCreateTicket} className="guest-self-portal__form">
                        <label>
                            Subject
                            <input name="subject" value={ticketForm.subject} onChange={handleTicketInputChange} required />
                        </label>
                        <label>
                            Description
                            <textarea name="description" rows="4" value={ticketForm.description} onChange={handleTicketInputChange} required />
                        </label>
                        <div className="guest-self-grid-2">
                            <label>
                                Category
                                <select name="category" value={ticketForm.category} onChange={handleTicketInputChange}>
                                    <option>General</option>
                                    <option>Billing</option>
                                    <option>Technical</option>
                                    <option>Logistics</option>
                                </select>
                            </label>
                            <label>
                                Priority
                                <select name="priority" value={ticketForm.priority} onChange={handleTicketInputChange}>
                                    <option value="CRITICAL">Critical</option>
                                    <option value="HIGH">High</option>
                                    <option value="MEDIUM">Medium</option>
                                    <option value="LOW">Low</option>
                                </select>
                            </label>
                        </div>
                        <button type="submit" className="guest-self-primary" disabled={creating}>
                            {creating ? 'Submitting…' : 'Submit Ticket'}
                        </button>
                    </form>
                </article>

                <article className="guest-self-portal__card">
                    <h2>Your Tickets</h2>
                    {loadingTickets ? (
                        <div className="guest-self-empty">Loading your tickets…</div>
                    ) : tickets.length === 0 ? (
                        <div className="guest-self-empty">You haven&apos;t created any tickets yet.</div>
                    ) : (
                        <ul className="guest-self-ticket-list">
                            {tickets.map((ticket) => (
                                <li key={ticket.id}>
                                    <Link to={`/guest/portal/tickets/${ticket.id}`}>
                                        <span className={`guest-status guest-status--${ticket.status?.toLowerCase()}`}>{statusLabels[ticket.status] || ticket.status}</span>
                                        <strong>{ticket.subject}</strong>
                                        <div className="guest-self-meta">
                                            <small>Category: {ticket.category || '—'}</small>
                                            <small>Priority: {ticket.priority || '—'}</small>
                                        </div>
                                        <small>Updated {ticket.updatedAt ? new Date(ticket.updatedAt).toLocaleString() : 'recently'}</small>
                                        {ticket.ratingScore && (
                                            <span className="guest-self-rating"><FaStar /> {ticket.ratingScore}/5</span>
                                        )}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </article>

                <article className="guest-self-portal__card">
                    <h2>Recent Feedback</h2>
                    {ratedTickets.length === 0 ? (
                        <div className="guest-self-empty">You haven&apos;t rated any tickets yet.</div>
                    ) : (
                        <ul className="guest-self-rating-list">
                            {ratedTickets.map((ticket) => (
                                <li key={ticket.id}>
                                    <div className="guest-self-rating-row">
                                        <span><FaStar /> {ticket.ratingScore}/5</span>
                                        <small>{ticket.ratedAt ? new Date(ticket.ratedAt).toLocaleDateString() : ''}</small>
                                    </div>
                                    <p>{ticket.ratingComment || 'No comment provided.'}</p>
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
