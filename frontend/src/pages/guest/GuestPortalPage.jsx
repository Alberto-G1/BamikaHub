import React, { useEffect, useMemo, useState } from 'react';
import { FaSync, FaUserPlus, FaUsers, FaTicketAlt } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import api from '../../api/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import './GuestPortal.css';

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
        lastMessageAt: ticket.lastMessageAt
    })), [tickets]);

    return (
        <div className="guest-portal-page">
            <div className="guest-portal-header">
                <div>
                    <h1>Guest Support Portal</h1>
                    <p>Manage guest accounts and track guest tickets from a single workspace.</p>
                </div>
                <div className="guest-portal-actions">
                    <button className="guest-portal-refresh" onClick={() => fetchTickets(statusFilter)} disabled={loadingTickets}>
                        <FaSync /> Refresh Tickets
                    </button>
                </div>
            </div>

            {canManageGuests && (
                <section className="guest-portal-card" data-section="guests">
                    <div className="guest-section-header">
                        <div className="guest-section-title">
                            <FaUsers /> Guest Accounts
                        </div>
                        <span className="guest-section-meta">{guests.length} records</span>
                    </div>
                    <div className="guest-section-content">
                        <form className="guest-form" onSubmit={handleCreateGuest}>
                            <h3><FaUserPlus /> Create Guest Account</h3>
                            <div className="guest-form-grid">
                                <label>
                                    Full Name
                                    <input type="text" name="fullName" value={guestForm.fullName} onChange={handleGuestInputChange} required />
                                </label>
                                <label>
                                    Email
                                    <input type="email" name="email" value={guestForm.email} onChange={handleGuestInputChange} required />
                                </label>
                                <label>
                                    Phone Number
                                    <input type="text" name="phoneNumber" value={guestForm.phoneNumber} onChange={handleGuestInputChange} required />
                                </label>
                                <label>
                                    Company
                                    <input type="text" name="companyName" value={guestForm.companyName} onChange={handleGuestInputChange} />
                                </label>
                                <label>
                                    Category
                                    <input type="text" name="category" value={guestForm.category} onChange={handleGuestInputChange} />
                                </label>
                            </div>
                            <button type="submit" className="guest-primary" disabled={creatingGuest}>
                                {creatingGuest ? 'Creating…' : 'Create Guest'}
                            </button>
                        </form>

                        <div className="guest-table-wrapper">
                            {loadingGuests ? (
                                <div className="guest-loading">Loading guest accounts…</div>
                            ) : guests.length === 0 ? (
                                <div className="guest-empty">No guest accounts registered yet.</div>
                            ) : (
                                <table className="guest-table">
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
                            )}
                        </div>
                    </div>
                </section>
            )}

            {canViewTickets && (
                <section className="guest-portal-card" data-section="tickets">
                    <div className="guest-section-header">
                        <div className="guest-section-title">
                            <FaTicketAlt /> Guest Tickets
                        </div>
                        <div className="guest-ticket-controls">
                            <label>
                                Status filter
                                <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                                    <option value="">All statuses</option>
                                    <option value="PENDING">Pending</option>
                                    <option value="IN_PROGRESS">In Progress</option>
                                    <option value="AWAITING_GUEST">Awaiting Guest</option>
                                    <option value="RESOLVED">Resolved</option>
                                    <option value="CLOSED">Closed</option>
                                </select>
                            </label>
                        </div>
                    </div>

                    <div className="guest-table-wrapper">
                        {loadingTickets ? (
                            <div className="guest-loading">Loading tickets…</div>
                        ) : ticketSummaries.length === 0 ? (
                            <div className="guest-empty">No guest tickets yet.</div>
                        ) : (
                            <table className="guest-table guest-table--tickets">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Subject</th>
                                        <th>Guest</th>
                                        <th>Status</th>
                                        <th>Assigned</th>
                                        <th>Updated</th>
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
                        )}
                    </div>

                    {canManageTickets && (
                        <div className="guest-ticket-footer">
                            <p>Need to log an issue on behalf of a guest? Use the ticket detail screen to capture internal responses and updates.</p>
                        </div>
                    )}
                </section>
            )}
        </div>
    );
};

export default GuestPortalPage;
