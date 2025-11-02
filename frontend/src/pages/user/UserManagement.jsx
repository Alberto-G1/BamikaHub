import React, { useState, useEffect, useMemo } from 'react';
import { FaEdit, FaPlus, FaCheck, FaTimes, FaSearch, FaUserCircle, FaArchive } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import api from '../../api/api.js';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext.jsx';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import './UserManagementPage.css';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { hasPermission } = useAuth();

    const [statusFilter, setStatusFilter] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [dialogConfig, setDialogConfig] = useState({ open: false });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await api.get('/users');
            setUsers(response.data);
        } catch (err) {
            setError('Failed to fetch users. Please try again.');
            toast.error('Failed to fetch users.');
        } finally {
            setLoading(false);
        }
    };

    const closeDialog = () => setDialogConfig(prev => ({ ...prev, open: false }));

    const requestAction = (type, user) => {
        const userFullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;

        if (type === 'deactivate') {
            setDialogConfig({
                open: true,
                tone: 'warn',
                title: 'Deactivate User',
                message: `Deactivate ${userFullName}?`,
                detail: 'They will be moved to the deactivated list and can be restored later.',
                confirmLabel: 'Deactivate',
                cancelLabel: 'Keep Active',
                onConfirm: () => performDeactivate(user),
            });
            return;
        }

        if (type === 'approve') {
            setDialogConfig({
                open: true,
                tone: 'success',
                title: 'Approve User',
                message: `Approve ${userFullName}?`,
                detail: 'They will immediately gain access with the Staff role.',
                confirmLabel: 'Approve',
                cancelLabel: 'Cancel',
                onConfirm: () => performApprove(user),
            });
            return;
        }

        if (type === 'reject') {
            setDialogConfig({
                open: true,
                tone: 'danger',
                title: 'Reject Registration',
                message: `Reject ${userFullName}?`,
                detail: 'This permanently removes their registration request.',
                confirmLabel: 'Reject',
                cancelLabel: 'Keep Pending',
                onConfirm: () => performReject(user),
            });
        }
    };

    const performApprove = async user => {
        closeDialog();
        const defaultStaffRoleId = 3;
        try {
            await api.post(`/users/${user.id}/approve`, defaultStaffRoleId, {
                headers: { 'Content-Type': 'application/json' },
            });
            toast.success('User approved successfully!');
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to approve user.');
        }
    };

    const performReject = async user => {
        closeDialog();
        try {
            await api.delete(`/users/${user.id}`);
            const nameOrEmail = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
            toast.info(`Registration for ${nameOrEmail} has been rejected.`);
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to reject user.');
        }
    };

    const performDeactivate = async user => {
        closeDialog();
        try {
            await api.post(`/users/${user.id}/deactivate`);
            const nameOrEmail = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
            toast.warn(`User '${nameOrEmail}' has been deactivated.`);
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to deactivate user.');
        }
    };

    const totals = useMemo(() => {
        const summary = { total: users.length, active: 0, pending: 0, suspended: 0 };
        users.forEach(user => {
            const statusName = user.status?.name;
            if (statusName === 'ACTIVE') summary.active += 1;
            if (statusName === 'PENDING') summary.pending += 1;
            if (statusName === 'SUSPENDED') summary.suspended += 1;
        });
        return summary;
    }, [users]);

    const filteredUsers = useMemo(() => {
        return users
            .filter(user => {
                if (statusFilter === 'ALL') return true;
                return user.status?.name === statusFilter;
            })
            .filter(user => {
                const term = searchQuery.trim().toLowerCase();
                if (!term) return true;
                const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
                return (
                    fullName.toLowerCase().includes(term) ||
                    (user.username && user.username.toLowerCase().includes(term)) ||
                    (user.email && user.email.toLowerCase().includes(term))
                );
            });
    }, [users, statusFilter, searchQuery]);

    if (loading) {
        return (
            <section className="users-page">
                <div className="users-loading">
                    <span className="users-spinner" aria-hidden="true" />
                    <p>Loading users...</p>
                </div>
            </section>
        );
    }

    return (
        <section className="users-page">
            <div className="users-banner" data-animate="fade-up">
                <div className="users-banner__content">
                    <div className="users-banner__eyebrow">User Admin</div>
                    <h2 className="users-banner__title">User Management</h2>
                    <p className="users-banner__subtitle">
                        Manage approvals, roles, and access for every member of your organization.
                    </p>

                    <div className="users-banner__meta">
                        <div className="users-banner__meta-item">
                            <span className="users-meta-label">Total</span>
                            <span className="users-meta-value">{totals.total}</span>
                        </div>
                        <div className="users-banner__meta-item">
                            <span className="users-meta-label">Active</span>
                            <span className="users-meta-value">{totals.active}</span>
                        </div>
                        <div className="users-banner__meta-item">
                            <span className="users-meta-label">Pending</span>
                            <span className="users-meta-value">{totals.pending}</span>
                        </div>
                    </div>
                </div>

                <div className="users-banner__actions">
                    <button type="button" className="users-secondary-btn" onClick={() => navigate('/users/deactivated')}>
                        <FaArchive />
                        <span>View Deactivated</span>
                    </button>
                    {hasPermission('USER_CREATE') && (
                        <button type="button" className="users-primary-btn" onClick={() => navigate('/users/new')}>
                            <FaPlus />
                            <span>Add User</span>
                        </button>
                    )}
                </div>
            </div>

            <div className="users-toolbar" data-animate="fade-up" data-delay="0.05">
                <div className="users-filter-panel">
                    <label className="users-control">
                        <span className="users-label">Filter by Status</span>
                        <select
                            className="users-select"
                            value={statusFilter}
                            onChange={event => setStatusFilter(event.target.value)}
                        >
                            <option value="ALL">All</option>
                            <option value="PENDING">Pending</option>
                            <option value="ACTIVE">Active</option>
                            <option value="SUSPENDED">Suspended</option>
                        </select>
                    </label>

                    <label className="users-control">
                        <span className="users-label">Search</span>
                        <div className="users-input-wrapper">
                            <FaSearch />
                            <input
                                className="users-input"
                                type="text"
                                placeholder="Search by name, username, or email"
                                value={searchQuery}
                                onChange={event => setSearchQuery(event.target.value)}
                            />
                        </div>
                    </label>
                </div>

                {error && <div className="users-error" role="alert">{error}</div>}
            </div>

            <div className="users-table-container" data-animate="fade-up" data-delay="0.1">
                {filteredUsers.length === 0 ? (
                    <div className="users-empty-state">No users match your current filters.</div>
                ) : (
                    <div className="users-table-scroll">
                        <table className="users-table">
                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th>Status</th>
                                    <th>Joined</th>
                                    <th className="users-actions-header">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map((user, index) => {
                                    const userFullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unnamed user';
                                    const joinedOn = user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—';
                                    const statusColor = user.status?.color || '#10B981';

                                    return (
                                        <tr key={user.id} style={{ animationDelay: `${index * 0.03}s` }}>
                                            <td className="users-user-cell">
                                                <div className="users-name-cell">
                                                    {user.profilePictureUrl ? (
                                                        <img
                                                            src={`http://localhost:8080${user.profilePictureUrl}`}
                                                            alt={`${userFullName}'s avatar`}
                                                            className="users-avatar"
                                                        />
                                                    ) : (
                                                        <FaUserCircle className="users-avatar--placeholder" aria-hidden="true" />
                                                    )}
                                                    <div>
                                                        <div className="users-name">{userFullName}</div>
                                                        <div className="users-name-sub">{user.username ? `@${user.username}` : 'No username'}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>{user.email || '—'}</td>
                                            <td>{user.role?.name || '—'}</td>
                                            <td>
                                                <span
                                                    className="users-status-pill"
                                                    style={{ backgroundColor: statusColor }}
                                                >
                                                    {user.status?.name || '—'}
                                                </span>
                                            </td>
                                            <td>{joinedOn}</td>
                                            <td>
                                                <div className="users-actions">
                                                    {user.status?.name === 'PENDING' ? (
                                                        <>
                                                            {hasPermission('USER_APPROVE') && (
                                                                <button
                                                                    type="button"
                                                                    className="users-icon-btn users-icon-btn--success"
                                                                    onClick={() => requestAction('approve', user)}
                                                                    aria-label="Approve user"
                                                                    title="Approve user"
                                                                >
                                                                    <FaCheck />
                                                                </button>
                                                            )}
                                                            {hasPermission('USER_DELETE') && (
                                                                <button
                                                                    type="button"
                                                                    className="users-icon-btn users-icon-btn--danger"
                                                                    onClick={() => requestAction('reject', user)}
                                                                    aria-label="Reject registration"
                                                                    title="Reject registration"
                                                                >
                                                                    <FaTimes />
                                                                </button>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <>
                                                            {hasPermission('USER_UPDATE') && (
                                                                <button
                                                                    type="button"
                                                                    className="users-icon-btn users-icon-btn--warning"
                                                                    onClick={() => navigate(`/users/edit/${user.id}`)}
                                                                    aria-label="Edit user"
                                                                    title="Edit user"
                                                                >
                                                                    <FaEdit />
                                                                </button>
                                                            )}
                                                            {hasPermission('USER_DELETE') && (
                                                                <button
                                                                    type="button"
                                                                    className="users-icon-btn users-icon-btn--danger"
                                                                    onClick={() => requestAction('deactivate', user)}
                                                                    aria-label="Deactivate user"
                                                                    title="Deactivate user"
                                                                >
                                                                    <FaArchive />
                                                                </button>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <ConfirmDialog
                open={dialogConfig.open}
                tone={dialogConfig.tone}
                title={dialogConfig.title || ''}
                message={dialogConfig.message || ''}
                detail={dialogConfig.detail}
                confirmLabel={dialogConfig.confirmLabel}
                cancelLabel={dialogConfig.cancelLabel}
                onConfirm={dialogConfig.onConfirm}
                onCancel={closeDialog}
            />
        </section>
    );
};

export default UserManagement;