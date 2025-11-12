import React, { useEffect, useMemo, useState } from 'react';
import { FaSync, FaUserPlus, FaUsers, FaTicketAlt } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import api from '../../api/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import ThemeToggle from '../../components/common/ThemeToggle';
import './GuestStyles.css';

const defaultGuestForm = {
    fullName: '',
    email: '',
    phoneNumber: '',
    companyName: '',
    category: ''
};

const statusLabels = {
    PENDING_APPROVAL: 'Pending Approval',
    ACTIVE: 'Active',
    SUSPENDED: 'Suspended',
    DEACTIVATED: 'Deactivated'
};

const GuestPortalPage = () => {
    const navigate = useNavigate();
    const { hasPermission } = useAuth();
    const canManageGuests = hasPermission('GUEST_USER_MANAGE');
    const canViewTickets = hasPermission('GUEST_TICKET_VIEW');
    const canManageTickets = hasPermission('GUEST_TICKET_MANAGE');

    const [guests, setGuests] = useState([]);
    const [tickets, setTickets] = useState([]);
    const [loadingGuests, setLoadingGuests] = useState(false);
    const [loadingTickets, setLoadingTickets] = useState(false);
    const [guestForm, setGuestForm] = useState(defaultGuestForm);
    const [creatingGuest, setCreatingGuest] = useState(false);
    const [statusFilter, setStatusFilter] = useState('');

    useEffect(() => {
        if (canManageGuests || canViewTickets) {
            fetchGuests();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [canManageGuests, canViewTickets]);

    useEffect(() => {
        if (canViewTickets) {
            fetchTickets(statusFilter);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [canViewTickets, statusFilter]);

    const fetchGuests = async () => {
        setLoadingGuests(true);
        try {
            const response = await api.get('/guest/users');
            setGuests(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            toast.error('Unable to load guest accounts.');
        } finally {
            setLoadingGuests(false);
        }
    };

    const fetchTickets = async (statusValue = '') => {
        setLoadingTickets(true);
        try {
            const params = {};
            if (statusValue) {
                params.status = statusValue;
            }
            const response = await api.get('/guest/tickets', { params });
            setTickets(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            toast.error('Unable to load guest tickets.');
        } finally {
            setLoadingTickets(false);
        }
    };

    const handleGuestInputChange = (event) => {
        const { name, value } = event.target;
        setGuestForm((previous) => ({ ...previous, [name]: value }));
    };

    const handleCreateGuest = async (event) => {
        event.preventDefault();
        setCreatingGuest(true);
        try {
            await api.post('/guest/users', guestForm);
            toast.success('Guest account created successfully.');
            setGuestForm(defaultGuestForm);
            fetchGuests();
        } catch (error) {
            const message = error.response?.data?.message || 'Unable to create guest account.';
            toast.error(message);
        } finally {
            setCreatingGuest(false);
        }
    };

    const handleStatusChange = async (guestId, status) => {
        try {
            await api.post(`/guest/users/${guestId}/status`, { status });
            toast.success('Guest status updated.');
            fetchGuests();
            fetchTickets(statusFilter);
        } catch (error) {
            const message = error.response?.data?.message || 'Unable to update guest status.';
            toast.error(message);
        }
    };

    const ticketSummaries = useMemo(() => tickets.map((ticket) => ({
        id: ticket.id,
        subject: ticket.subject,
        guestName: ticket.guestName,
        status: ticket.status,
        assignedStaffName: ticket.assignedStaffName,
        updatedAt: ticket.updatedAt,
        lastMessageAt: ticket.lastMessageAt,
        ratingScore: ticket.ratingScore,
        ratingComment: ticket.ratingComment
    })), [tickets]);

    return (
        <div className="guest-portal-page">
            <header className="guest-portal-header" data-animate="fade-up">
                <div>
                    <h1>Guest Support Portal</h1>
                    <p>Manage guest accounts and track guest tickets from a single workspace.</p>
                </div>
                <div className="guest-portal-header-actions">
                    <ThemeToggle />
                    <button className="guest-portal-logout" onClick={() => fetchTickets(statusFilter)} disabled={loadingTickets}>
                        <FaSync /> Refresh Tickets
                    </button>
                </div>
            </header>

            {canManageGuests && (
                <section className="guest-portal-card" data-animate="fade-up" data-delay="0.08">
                    <h2>
                        <FaUsers /> Guest Accounts
                        <span style={{ fontSize: '0.9rem', fontWeight: '400', marginLeft: '1rem', color: 'var(--guest-text-muted)' }}>
                            ({guests.length} records)
                        </span>
                    </h2>
                    <div>
                        <form className="guest-portal-form" onSubmit={handleCreateGuest}>
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                                <FaUserPlus /> Create Guest Account
                            </h3>
                            <div className="guest-portal-grid-2">
                                <div className="guest-auth-form-group">
                                    <label className="guest-auth-form-label">Full Name</label>
                                    <input 
                                        type="text" 
                                        className="guest-auth-input"
                                        name="fullName" 
                                        value={guestForm.fullName} 
                                        onChange={handleGuestInputChange} 
                                        required 
                                    />
                                </div>
                                <div className="guest-auth-form-group">
                                    <label className="guest-auth-form-label">Email</label>
                                    <input 
                                        type="email" 
                                        className="guest-auth-input"
                                        name="email" 
                                        value={guestForm.email} 
                                        onChange={handleGuestInputChange} 
                                        required 
                                    />
                                </div>
                                <div className="guest-auth-form-group">
                                    <label className="guest-auth-form-label">Phone Number</label>
                                    <input 
                                        type="text" 
                                        className="guest-auth-input"
                                        name="phoneNumber" 
                                        value={guestForm.phoneNumber} 
                                        onChange={handleGuestInputChange} 
                                        required 
                                    />
                                </div>
                                <div className="guest-auth-form-group">
                                    <label className="guest-auth-form-label">Company</label>
                                    <input 
                                        type="text" 
                                        className="guest-auth-input"
                                        name="companyName" 
                                        value={guestForm.companyName} 
                                        onChange={handleGuestInputChange} 
                                    />
                                </div>
                                <div className="guest-auth-form-group">
                                    <label className="guest-auth-form-label">Category</label>
                                    <input 
                                        type="text" 
                                        className="guest-auth-input"
                                        name="category" 
                                        value={guestForm.category} 
                                        onChange={handleGuestInputChange} 
                                    />
                                </div>
                            </div>
                            <button type="submit" className="guest-auth-primary-btn" disabled={creatingGuest}>
                                <FaUserPlus /> {creatingGuest ? 'Creating…' : 'Create Guest'}
                            </button>
                        </form>

                        <div style={{ marginTop: '2rem' }}>
                            {loadingGuests ? (
                                <div className="guest-empty">Loading guest accounts…</div>
                            ) : guests.length === 0 ? (
                                <div className="guest-empty">No guest accounts registered yet.</div>
                            ) : (
                                <div style={{ overflowX: 'auto' }}>
                                <table style={{ 
                                    width: '100%', 
                                    borderCollapse: 'collapse',
                                    background: 'var(--guest-surface-secondary)',
                                    borderRadius: '12px',
                                    overflow: 'hidden'
                                }}>
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Email</th>
                                            <th>Phone</th>
                                            <th>Company</th>
                                            <th>Status</th>
                                            <th>Tickets</th>
                                            {canManageGuests && <th>Actions</th>}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {guests.map((guest) => (
                                            <tr key={guest.id}>
                                                <td>{guest.fullName}</td>
                                                <td>{guest.email}</td>
                                                <td>{guest.phoneNumber || '—'}</td>
                                                <td>{guest.companyName || '—'}</td>
                                                <td>
                                                    <span className={`guest-status guest-status--${guest.status?.toLowerCase()}`}>
                                                        {statusLabels[guest.status] || guest.status}
                                                    </span>
                                                </td>
                                                <td>{guest.ticketCount ?? 0}</td>
                                                {canManageGuests && (
                                                    <td>
                                                        <select value={guest.status || 'PENDING_APPROVAL'} onChange={(event) => handleStatusChange(guest.id, event.target.value)}>
                                                            {Object.keys(statusLabels).map((statusKey) => (
                                                                <option key={statusKey} value={statusKey}>{statusLabels[statusKey]}</option>
                                                            ))}
                                                        </select>
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            )}

            {canViewTickets && (
                <section className="guest-portal-card" data-animate="fade-up" data-delay="0.12">
                    <h2>
                        <FaTicketAlt /> Guest Tickets
                    </h2>
                    
                    <div className="guest-auth-form-group" style={{ marginBottom: '1.5rem' }}>
                        <label className="guest-auth-form-label">Status Filter</label>
                        <select 
                            className="guest-auth-select"
                            value={statusFilter} 
                            onChange={(event) => setStatusFilter(event.target.value)}
                        >
                            <option value="">All statuses</option>
                            <option value="PENDING">Pending</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="AWAITING_GUEST">Awaiting Guest</option>
                            <option value="RESOLVED">Resolved</option>
                            <option value="CLOSED">Closed</option>
                        </select>
                    </div>

                    <div>
                        {loadingTickets ? (
                            <div className="guest-empty">Loading tickets…</div>
                        ) : ticketSummaries.length === 0 ? (
                            <div className="guest-empty">No guest tickets yet.</div>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                            <table style={{ 
                                width: '100%', 
                                borderCollapse: 'collapse',
                                background: 'var(--guest-surface-secondary)',
                                borderRadius: '12px',
                                overflow: 'hidden'
                            }}>
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Subject</th>
                                        <th>Guest</th>
                                        <th>Status</th>
                                        <th>Assigned</th>
                                        <th>Updated</th>
                                        <th>Rating</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {ticketSummaries.map((ticket) => (
                                        <tr key={ticket.id}>
                                            <td>#{ticket.id}</td>
                                            <td>{ticket.subject}</td>
                                            <td>{ticket.guestName || '—'}</td>
                                            <td><span className={`guest-status guest-status--${ticket.status?.toLowerCase()}`}>{ticket.status}</span></td>
                                            <td>{ticket.assignedStaffName || 'Unassigned'}</td>
                                            <td>{ticket.updatedAt ? new Date(ticket.updatedAt).toLocaleString() : '—'}</td>
                                            <td>{ticket.ratingScore ? `${ticket.ratingScore}/5` : '—'}</td>
                                            <td>
                                                <button
                                                    className="guest-secondary"
                                                    onClick={() => navigate(`/support/guest/tickets/${ticket.id}`)}
                                                >
                                                    View
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            </div>
                        )}
                    </div>

                    {canManageTickets && (
                        <div style={{ 
                            marginTop: '1.5rem', 
                            padding: '1rem', 
                            background: 'var(--guest-blue-light)', 
                            borderRadius: '12px',
                            border: '1px solid var(--guest-blue)'
                        }}>
                            <p style={{ margin: 0, color: 'var(--guest-text-primary)' }}>
                                Need to log an issue on behalf of a guest? Use the ticket detail screen to capture internal responses and updates.
                            </p>
                        </div>
                    )}
                </section>
            )}
        </div>
    );
};

export default GuestPortalPage;
