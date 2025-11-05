import React, { useState, useEffect, useMemo } from 'react';
import { FaArrowLeft, FaEnvelope, FaUndo, FaUserCircle, FaUserShield, FaUserTag, FaUsers } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import api from '../../api/api.js';
import { toast } from 'react-toastify';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import './UserManagementPage.css';

const DeactivatedUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [dialogConfig, setDialogConfig] = useState({ open: false });
    const navigate = useNavigate();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await api.get('/users/deactivated');
            setUsers(response.data);
        } catch (err) {
            setError('Failed to fetch deactivated users.');
            toast.error('Failed to fetch deactivated users.');
        } finally {
            setLoading(false);
        }
    };

    const closeDialog = () => setDialogConfig(prev => ({ ...prev, open: false }));

    const bannerMetrics = useMemo(() => {
        const withEmail = users.filter(user => Boolean(user.email)).length;
        const withRole = users.filter(user => Boolean(user.role?.name)).length;
        return [
            {
                label: 'Deactivated Accounts',
                value: users.length.toLocaleString(),
                icon: FaUsers,
                modifier: 'users-banner__meta-icon--blue'
            },
            {
                label: 'With Contact Email',
                value: withEmail.toLocaleString(),
                icon: FaEnvelope,
                modifier: 'users-banner__meta-icon--gold'
            },
            {
                label: 'Keep Assigned Role',
                value: withRole.toLocaleString(),
                icon: FaUserTag,
                modifier: 'users-banner__meta-icon--teal'
            }
        ];
    }, [users]);

    const requestReactivate = user => {
        const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
        setDialogConfig({
            open: true,
            tone: 'success',
            title: 'Reactivate User',
            message: `Reactivate ${fullName}?`,
            detail: 'They will regain access to the system immediately.',
            confirmLabel: 'Reactivate',
            cancelLabel: 'Cancel',
            onConfirm: () => handleReactivate(user),
        });
    };

    const handleReactivate = async user => {
        closeDialog();
        const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
        try {
            await api.post(`/users/${user.id}/reactivate`);
            toast.success(`User '${fullName}' has been reactivated.`);
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to reactivate user.');
        }
    };

    if (loading) {
        return (
            <section className="users-page">
                <div className="users-loading">
                    <span className="users-spinner" aria-hidden="true" />
                    <p>Loading deactivated users...</p>
                </div>
            </section>
        );
    }

    return (
        <section className="users-page">
            <div className="users-banner users-banner--compact" data-animate="fade-up">
                <div className="users-banner__content">
                    <div className="users-banner__info">
                        <span className="users-banner__eyebrow">
                            <FaUserShield aria-hidden="true" />
                            Account Recovery
                        </span>
                        <h1 className="users-banner__title">Deactivated Users</h1>
                        <p className="users-banner__subtitle">Review inactive accounts and bring team members back when needed.</p>
                    </div>

                    <div className="users-banner__actions">
                        <button type="button" className="users-secondary-btn" onClick={() => navigate('/users')}>
                            <FaArrowLeft />
                            <span>Back to Active Users</span>
                        </button>
                    </div>
                </div>

                <div className="users-banner__meta">
                    {bannerMetrics.map(metric => {
                        const MetricIcon = metric.icon;
                        return (
                            <div key={metric.label} className="users-banner__meta-item">
                                <div className={`users-banner__meta-icon ${metric.modifier}`} aria-hidden="true">
                                    <MetricIcon />
                                </div>
                                <div className="users-banner__meta-content">
                                    <span className="users-banner__meta-label">{metric.label}</span>
                                    <span className="users-banner__meta-value">{metric.value}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {error && (
                <div className="users-error" role="alert" data-animate="fade-up" data-delay="0.05">
                    {error}
                </div>
            )}

            <div className="users-table-container" data-animate="fade-up" data-delay="0.08">
                {users.length === 0 ? (
                    <div className="users-empty-state">There are no deactivated users.</div>
                ) : (
                    <div className="users-table-scroll">
                        <table className="users-table">
                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th className="users-actions-header">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user, index) => {
                                    const userFullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unnamed user';
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
                                                        <div className="users-name-sub">{user.email || 'No email provided'}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>{user.email || '—'}</td>
                                            <td>{user.role?.name || '—'}</td>
                                            <td>
                                                <div className="users-actions">
                                                    <button
                                                        type="button"
                                                        className="users-icon-btn users-icon-btn--success"
                                                        onClick={() => requestReactivate(user)}
                                                        aria-label="Reactivate user"
                                                        title="Reactivate user"
                                                    >
                                                        <FaUndo />
                                                    </button>
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

export default DeactivatedUsers;