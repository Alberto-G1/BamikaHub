// src/pages/RoleForm.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaSave, FaShieldAlt, FaLayerGroup, FaKey } from 'react-icons/fa';
import api from '../../api/api.js';
import { toast } from 'react-toastify';
import './RolesStyles.css';

const RoleForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditMode = Boolean(id);

    const [roleName, setRoleName] = useState('');
    const [groupedPermissions, setGroupedPermissions] = useState({});
    const [selectedPermissions, setSelectedPermissions] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const fetchPermissions = api.get('/roles/permissions');

        let fetchRole = Promise.resolve();
        if (isEditMode) {
            fetchRole = api.get(`/roles/${id}`);
        }

        Promise.all([fetchPermissions, fetchRole])
            .then(([permissionsRes, roleRes]) => {
                setGroupedPermissions(permissionsRes.data.grouped || {});

                if (isEditMode && roleRes) {
                    setRoleName(roleRes.data.name || '');
                    const initialPermissionIds = new Set((roleRes.data.permissions || []).map(permission => permission.id));
                    setSelectedPermissions(initialPermissionIds);
                }
            })
            .catch(() => {
                toast.error('Failed to load role data.');
            })
            .finally(() => setLoading(false));

    }, [id, isEditMode]);

    const sortedGroupEntries = useMemo(() => {
        return Object.entries(groupedPermissions || {}).sort(([groupA], [groupB]) => {
            return groupA.localeCompare(groupB);
        });
    }, [groupedPermissions]);

    const selectedCount = selectedPermissions.size;

    const totalPermissionCount = useMemo(() => {
        return sortedGroupEntries.reduce((total, [, permissions]) => total + permissions.length, 0);
    }, [sortedGroupEntries]);

    const handlePermissionChange = (permissionId) => {
        const newSelection = new Set(selectedPermissions);
        if (newSelection.has(permissionId)) {
            newSelection.delete(permissionId);
        } else {
            newSelection.add(permissionId);
        }
        setSelectedPermissions(newSelection);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!roleName.trim()) {
            toast.warn('Please provide a role name.');
            return;
        }

        const payload = {
            name: roleName.trim(),
            permissionIds: Array.from(selectedPermissions),
        };

        setSubmitting(true);
        try {
            if (isEditMode) {
                await api.put(`/roles/${id}`, payload);
                toast.success(`Role '${payload.name}' updated successfully.`);
            } else {
                await api.post('/roles', payload);
                toast.success(`Role '${payload.name}' created successfully.`);
            }
            navigate('/roles');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save role.');
        } finally {
            setSubmitting(false);
        }
    };

    const formatGroupName = (groupName) => {
        if (!groupName) return 'Permissions';
        return groupName.replace(/[_-]/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase());
    };

    const bannerSubtitle = isEditMode
        ? 'Update the permissions and responsibilities attached to this access profile.'
        : 'Craft a focused permission set to quickly onboard new teams with the right capabilities.';

    const bannerMetrics = [
        {
            label: 'Selected',
            value: selectedCount,
            icon: <FaShieldAlt />,
            modifier: 'roles-banner__meta-icon--blue'
        },
        {
            label: 'Permission Sets',
            value: sortedGroupEntries.length,
            icon: <FaLayerGroup />,
            modifier: 'roles-banner__meta-icon--gold'
        },
        {
            label: 'Available',
            value: totalPermissionCount,
            icon: <FaKey />,
            modifier: 'roles-banner__meta-icon--green'
        }
    ];

    return (
        <section className="roles-page">
            {loading ? (
                <div className="roles-loading" data-animate="fade-up">
                    <span className="roles-spinner" aria-hidden="true" />
                    <p>Loading role...</p>
                </div>
            ) : (
                <>
                    <div className="roles-banner" data-animate="fade-up">
                        <div className="roles-banner__content">
                            <div className="roles-banner__info">
                                <span className="roles-banner__eyebrow">
                                    <FaShieldAlt />
                                    Access Control
                                </span>
                                <h1 className="roles-banner__title">{isEditMode ? 'Edit Role' : 'Create Role'}</h1>
                                <p className="roles-banner__subtitle">{bannerSubtitle}</p>
                            </div>
                            <div className="roles-banner__actions">
                                <button
                                    type="button"
                                    className="roles-btn roles-btn--ghost"
                                    onClick={() => navigate('/roles')}
                                    disabled={submitting}
                                >
                                    <FaArrowLeft />
                                    Back to roles
                                </button>
                            </div>
                        </div>
                        <div className="roles-banner__meta">
                            {bannerMetrics.map((metric) => (
                                <div key={metric.label} className="roles-banner__meta-item">
                                    <div className={`roles-banner__meta-icon ${metric.modifier}`} aria-hidden="true">
                                        {metric.icon}
                                    </div>
                                    <div className="roles-banner__meta-content">
                                        <span className="roles-banner__meta-label">{metric.label}</span>
                                        <span className="roles-banner__meta-value">{metric.value}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <form className="roles-form" onSubmit={handleSubmit}>
                        <section className="roles-form__section" data-animate="fade-up" data-delay="0.08">
                            <header className="roles-form__header">
                                <h2 className="roles-form__title">Role Details</h2>
                                <p className="roles-form__subtitle">
                                    Give this role a clear identity so teammates understand its purpose instantly.
                                </p>
                            </header>

                            <div className="roles-form__grid">
                                <div className="roles-form__group">
                                    <label htmlFor="roleName">Role Name</label>
                                    <input
                                        id="roleName"
                                        className="roles-input-field"
                                        type="text"
                                        placeholder="e.g. Operations Manager"
                                        value={roleName}
                                        onChange={(event) => setRoleName(event.target.value)}
                                        required
                                        disabled={submitting}
                                    />
                                </div>
                            </div>
                        </section>

                        <section className="roles-form__section" data-animate="fade-up" data-delay="0.12">
                            <header className="roles-form__header">
                                <h2 className="roles-form__title">Permissions Matrix</h2>
                                <p className="roles-form__subtitle">
                                    Activate the capabilities this role should control. Toggle a permission to add or remove
                                    it from the bundle instantly.
                                </p>
                            </header>

                            <div className="roles-permission-grid" aria-live="polite">
                                {sortedGroupEntries.length === 0 ? (
                                    <div className="roles-empty-inline">No permissions available yet.</div>
                                ) : (
                                    sortedGroupEntries.map(([groupName, permissions], groupIndex) => (
                                        <article
                                            key={groupName}
                                            className="roles-permission-card"
                                            style={{ animationDelay: `${groupIndex * 0.04}s` }}
                                        >
                                            <div className="roles-permission-card__header">
                                                <span className="roles-permission-card__icon" aria-hidden="true">
                                                    <FaLayerGroup />
                                                </span>
                                                <div>
                                                    <h3 className="roles-permission-card__title">{formatGroupName(groupName)}</h3>
                                                    <p className="roles-permission-card__subtitle">
                                                        {permissions.length} capability{permissions.length === 1 ? '' : 'ies'}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="roles-permission-list">
                                                {permissions.map((permission) => {
                                                    const isChecked = selectedPermissions.has(permission.id);
                                                    return (
                                                        <label
                                                            key={permission.id}
                                                            className={`roles-permission-toggle${
                                                                isChecked ? ' roles-permission-toggle--active' : ''
                                                            }`}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={isChecked}
                                                                onChange={() => handlePermissionChange(permission.id)}
                                                                disabled={submitting}
                                                            />
                                                            <span className="roles-permission-toggle__label">{permission.name}</span>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        </article>
                                    ))
                                )}
                            </div>
                        </section>

                        <footer className="roles-form__footer" data-animate="fade-up" data-delay="0.16">
                            <button type="submit" className="roles-btn roles-btn--green" disabled={submitting || !roleName.trim()}>
                                <FaSave />
                                {submitting ? 'Saving...' : 'Save role'}
                            </button>
                            <button
                                type="button"
                                className="roles-btn roles-btn--secondary"
                                onClick={() => navigate('/roles')}
                                disabled={submitting}
                            >
                                Cancel
                            </button>
                        </footer>
                    </form>
                </>
            )}
        </section>
    );
};

export default RoleForm;