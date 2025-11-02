import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaSave, FaUserEdit, FaUserPlus, FaUserCircle } from 'react-icons/fa';
import api from '../../api/api.js';
import { toast } from 'react-toastify';
import './UserManagementPage.css';

const UserForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditMode = Boolean(id);

    // UPDATED: Form state to match the backend entity
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [roleId, setRoleId] = useState('');
    const [statusId, setStatusId] = useState('');
    const [version, setVersion] = useState(0);

    // Data for select dropdowns
    const [roles, setRoles] = useState([]);
    const [statuses, setStatuses] = useState([]);

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        // Fetch supporting data (roles, statuses)
        const fetchSupportData = async () => {
            try {
                const [rolesRes, statusesRes] = await Promise.all([
                    api.get('/roles'),
                    api.get('/statuses')
                ]);
                setRoles(rolesRes.data);
                setStatuses(statusesRes.data.filter(s => s.name !== 'PENDING'));
            } catch (error) {
                toast.error(error.response?.data?.message || 'Failed to load roles and statuses.');
            }
        };

        const fetchUserData = async () => {
            if (isEditMode) {
                try {
                    const res = await api.get(`/users/${id}`);
                    const userData = res.data;
                    
                    // UPDATED: Populate all the new state fields
                    setFirstName(userData.firstName);
                    setLastName(userData.lastName);
                    setUsername(userData.username);
                    setEmail(userData.email);
                    setRoleId(userData.role.id);
                    setStatusId(userData.status.id);
                    setVersion(userData.version);
                } catch (error) {
                    toast.error(error.response?.data?.message || 'Failed to load user data.');
                    navigate('/users');
                }
            }
        };
        
        const loadAllData = async () => {
            setLoading(true);
            await fetchSupportData();
            await fetchUserData();
            setLoading(false);
        };
        
        loadAllData();
    }, [id, isEditMode, navigate]);

    const handleSubmit = async event => {
        event.preventDefault();
        setSubmitting(true);

        try {
            if (isEditMode) {
                const payload = { firstName, lastName, username, email, roleId, statusId, version };
                await api.put(`/users/${id}`, payload);
                toast.success('User updated successfully!');
            } else {
                const payload = { firstName, lastName, username, email, password, roleId };
                await api.post('/users', payload);
                toast.success('User created successfully!');
            }
            navigate('/users');
        } catch (err) {
            toast.error(err.response?.data?.message || 'An error occurred.');
        } finally {
            setSubmitting(false);
        }
    };

    const pageTitle = isEditMode ? 'Update User Profile' : 'Create New User';
    const pageSubtitle = isEditMode
        ? 'Modify user details, roles, and current status.'
        : 'Provide user information and assign a role to grant access.';

    const heroIcon = isEditMode ? <FaUserEdit /> : <FaUserPlus />;
    const profileDisplayName = useMemo(() => {
        const name = `${firstName || ''} ${lastName || ''}`.trim();
        return name || 'Not yet provided';
    }, [firstName, lastName]);

    const selectedRoleName = useMemo(() => {
        if (!roleId) return 'Not assigned';
        const match = roles.find(role => String(role.id) === String(roleId));
        return match?.name || 'Not assigned';
    }, [roles, roleId]);

    const selectedStatusName = useMemo(() => {
        if (!statusId) return 'Not assigned';
        const match = statuses.find(status => String(status.id) === String(statusId));
        return match?.name || 'Not assigned';
    }, [statuses, statusId]);

    const profileInitials = useMemo(() => {
        const firstInitial = (firstName || '').trim().charAt(0);
        const lastInitial = (lastName || '').trim().charAt(0);
        const combined = `${firstInitial}${lastInitial}`.toUpperCase();
        return combined || '';
    }, [firstName, lastName]);

    const bannerEyebrow = isEditMode ? 'User Admin' : 'User Onboarding';
    const profileEmailDisplay = email || 'Email not provided yet';
    const profileUsernameDisplay = username ? `@${username}` : 'Username pending';
    const previewStatus = isEditMode ? selectedStatusName : 'Pending activation';
    const previewAccountTag = isEditMode ? 'Existing account' : 'New account draft';

    if (loading) {
        return (
            <section className="users-page users-form-page">
                <div className="users-loading">
                    <span className="users-spinner" aria-hidden="true" />
                    <p>Loading user data...</p>
                </div>
            </section>
        );
    }

    return (
        <section className="users-page users-form-page">
            <div className="users-banner users-banner--compact" data-animate="fade-up">
                <div className="users-banner__content">
                    <div className="users-banner__eyebrow">{bannerEyebrow}</div>
                    <h2 className="users-banner__title">{pageTitle}</h2>
                    <p className="users-banner__subtitle">{pageSubtitle}</p>

                    {isEditMode ? (
                        <div className="users-banner__meta">
                            <div className="users-banner__meta-item">
                                <span className="users-meta-label">Full Name</span>
                                <span className="users-meta-value">{profileDisplayName}</span>
                            </div>
                            <div className="users-banner__meta-item">
                                <span className="users-meta-label">Role</span>
                                <span className="users-meta-value">{selectedRoleName}</span>
                            </div>
                            <div className="users-banner__meta-item">
                                <span className="users-meta-label">Status</span>
                                <span className="users-meta-value">{selectedStatusName}</span>
                            </div>
                        </div>
                    ) : (
                        <div className="users-banner__meta">
                            <div className="users-banner__meta-item">
                                <span className="users-meta-label">Role Options</span>
                                <span className="users-meta-value">{roles.length}</span>
                            </div>
                            <div className="users-banner__meta-item">
                                <span className="users-meta-label">Status Presets</span>
                                <span className="users-meta-value">{statuses.length || '—'}</span>
                            </div>
                            <div className="users-banner__meta-item">
                                <span className="users-meta-label">Setup Flow</span>
                                <span className="users-meta-value">Profile &rarr; Access</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="users-banner__actions">
                    <div className="users-banner__icon" aria-hidden="true">
                        {heroIcon}
                    </div>
                    <button type="button" className="users-secondary-btn" onClick={() => navigate('/users')}>
                        <FaArrowLeft aria-hidden="true" />
                        <span>Back to User Management</span>
                    </button>
                </div>
            </div>

            <form className="users-form-shell" onSubmit={handleSubmit} data-animate="fade-up" data-delay="0.08">
                <div className="users-form-section">
                    <div className="users-form-section__header">
                        <h3 className="users-form-section__title">Profile Details</h3>
                        <p className="users-form-section__description">
                            Provide the core identity information used throughout Bamika Hub.
                        </p>
                    </div>
                    <div className="users-form-section__body users-form-section__body--profile">
                        <div className="users-form-grid users-form-grid--grow">
                        <div className="users-form-group">
                            <label htmlFor="firstName">First Name</label>
                            <input
                                id="firstName"
                                className="users-input"
                                type="text"
                                value={firstName}
                                onChange={event => setFirstName(event.target.value)}
                                required
                                autoComplete="given-name"
                                disabled={submitting}
                            />
                        </div>

                        <div className="users-form-group">
                            <label htmlFor="lastName">Last Name</label>
                            <input
                                id="lastName"
                                className="users-input"
                                type="text"
                                value={lastName}
                                onChange={event => setLastName(event.target.value)}
                                required
                                autoComplete="family-name"
                                disabled={submitting}
                            />
                        </div>

                        <div className="users-form-group">
                            <label htmlFor="username">Username</label>
                            <input
                                id="username"
                                className="users-input"
                                type="text"
                                value={username}
                                onChange={event => setUsername(event.target.value)}
                                required
                                autoComplete="username"
                                disabled={submitting}
                            />
                        </div>

                        <div className="users-form-group">
                            <label htmlFor="email">Email</label>
                            <input
                                id="email"
                                className="users-input"
                                type="email"
                                value={email}
                                onChange={event => setEmail(event.target.value)}
                                required
                                autoComplete="email"
                                disabled={submitting}
                            />
                        </div>
                        </div>

                        <aside className="users-profile-preview" aria-live="polite">
                            <div className="users-profile-preview__header">
                                <div className="users-profile-preview__avatar" aria-hidden="true">
                                    {profileInitials ? (
                                        profileInitials
                                    ) : (
                                        <FaUserCircle className="users-profile-preview__avatar-icon" />
                                    )}
                                </div>
                                <div className="users-profile-preview__summary">
                                    <p className="users-profile-preview__name">{profileDisplayName}</p>
                                    <p className="users-profile-preview__email">{profileEmailDisplay}</p>
                                </div>
                            </div>

                            <div className="users-profile-preview__tags">
                                <span className="users-profile-preview__tag">Step 1 - Profile</span>
                                <span className="users-profile-preview__tag">{previewAccountTag}</span>
                            </div>

                            <ul className="users-profile-preview__meta">
                                <li className="users-profile-preview__meta-item">
                                    <span className="users-profile-preview__meta-label">Username</span>
                                    <span className="users-profile-preview__meta-value">{profileUsernameDisplay}</span>
                                </li>
                                <li className="users-profile-preview__meta-item">
                                    <span className="users-profile-preview__meta-label">Role</span>
                                    <span className="users-profile-preview__meta-value">{selectedRoleName}</span>
                                </li>
                                <li className="users-profile-preview__meta-item">
                                    <span className="users-profile-preview__meta-label">Status</span>
                                    <span className="users-profile-preview__meta-value">{previewStatus}</span>
                                </li>
                            </ul>

                            <p className="users-profile-preview__note">
                                This snapshot updates as you complete the fields on the left. Use it to double-check
                                identity and access details before saving.
                            </p>
                        </aside>
                    </div>
                </div>

                {!isEditMode && (
                    <div className="users-form-section">
                        <div className="users-form-section__header">
                            <h3 className="users-form-section__title">Credentials</h3>
                            <p className="users-form-section__description">
                                Set a temporary password. The user will be asked to update it on first login.
                            </p>
                        </div>
                        <div className="users-form-grid">
                            <div className="users-form-group users-form-group--full">
                                <label htmlFor="password">Password</label>
                                <input
                                    id="password"
                                    className="users-input"
                                    type="password"
                                    value={password}
                                    onChange={event => setPassword(event.target.value)}
                                    required
                                    placeholder="Enter initial password"
                                    autoComplete="new-password"
                                    disabled={submitting}
                                />
                            </div>
                        </div>
                    </div>
                )}

                <div className="users-form-section">
                    <div className="users-form-section__header">
                        <h3 className="users-form-section__title">Access Controls</h3>
                        <p className="users-form-section__description">
                            Assign permissions and activation status for this account.
                        </p>
                    </div>
                    <div className="users-form-grid">
                        <div className="users-form-group">
                            <label htmlFor="role">Role</label>
                            <select
                                id="role"
                                className="users-select"
                                value={roleId || ''}
                                onChange={event => setRoleId(event.target.value)}
                                required
                                disabled={submitting}
                            >
                                <option value="" disabled>Select a role...</option>
                                {roles.map(role => (
                                    <option key={role.id} value={role.id}>
                                        {role.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {isEditMode && (
                            <div className="users-form-group">
                                <label htmlFor="status">Status</label>
                                <select
                                    id="status"
                                    className="users-select"
                                    value={statusId || ''}
                                    onChange={event => setStatusId(event.target.value)}
                                    required
                                    disabled={submitting}
                                >
                                    <option value="" disabled>Select a status...</option>
                                    {statuses.map(status => (
                                        <option key={status.id} value={status.id}>
                                            {status.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                </div>

                <div className="users-form-actions">
                    <button type="submit" className="users-primary-btn" disabled={submitting}>
                        <FaSave aria-hidden="true" />
                        <span>{submitting ? 'Saving...' : 'Save User'}</span>
                    </button>
                    <button
                        type="button"
                        className="users-secondary-btn"
                        onClick={() => navigate('/users')}
                        disabled={submitting}
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </section>
    );
};

export default UserForm;