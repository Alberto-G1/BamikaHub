// src/pages/RoleForm.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaSave, FaShieldAlt, FaLayerGroup } from 'react-icons/fa';
import api from '../../api/api.js';
import { toast } from 'react-toastify';
import './RoleForm.css';

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

    if (loading) {
        return (
            <section className="roles-page roles-form-page">
                <div className="roles-loading">
                    <span className="roles-spinner" aria-hidden="true" />
                    <p>Loading role...</p>
                </div>
            </section>
        );
    }

    return (
        <section className="roles-page roles-form-page">
            <div className="roles-banner roles-banner--form" data-animate="fade-up">
                <div className="roles-banner__content">
                    <div className="roles-banner__eyebrow">Access Control</div>
                    <h2 className="roles-banner__title">{isEditMode ? 'Edit Role' : 'Create Role'}</h2>
                    <p className="roles-banner__subtitle">{bannerSubtitle}</p>

                    <div className="roles-banner__meta">
                        <div className="roles-banner__meta-item">
                            <span className="roles-meta-label">Selected</span>
                            <span className="roles-meta-value">{selectedCount}</span>
                        </div>
                        <div className="roles-banner__meta-item">
                            <span className="roles-meta-label">Permission Sets</span>
                            <span className="roles-meta-value">{sortedGroupEntries.length}</span>
                        </div>
                        <div className="roles-banner__meta-item">
                            <span className="roles-meta-label">Available</span>
                            <span className="roles-meta-value">{totalPermissionCount}</span>
                        </div>
                    </div>
                </div>

                <div className="roles-banner__actions">
                    <div className="roles-banner__icon" aria-hidden="true">
                        <FaShieldAlt />
                    </div>
                    <button
                        type="button"
                        className="roles-ghost-btn"
                        onClick={() => navigate('/roles')}
                        disabled={submitting}
                    >
                        <FaArrowLeft aria-hidden="true" />
                        <span>Back to roles</span>
                    </button>
                </div>
            </div>

            <form className="roles-form-layout" onSubmit={handleSubmit}>
                <section className="roles-form-block" data-animate="fade-up" data-delay="0.05">
                    <header className="roles-form-block__header">
                        <h3 className="roles-form-block__title">Role Details</h3>
                        <p className="roles-form-block__subtitle">
                            Give this role a clear identity so teammates understand its purpose instantly.
                        </p>
                    </header>

                    <div className="roles-form-grid roles-form-grid--single">
                        <div className="roles-form-group roles-form-group--full">
                            <label htmlFor="roleName">Role Name</label>
                            <input
                                id="roleName"
                                className="roles-input"
                                type="text"
                                placeholder="e.g. Operations Manager"
                                value={roleName}
                                onChange={event => setRoleName(event.target.value)}
                                required
                                disabled={submitting}
                            />
                        </div>
                    </div>
                </section>

                <section className="roles-form-block" data-animate="fade-up" data-delay="0.1">
                    <header className="roles-form-block__header">
                        <h3 className="roles-form-block__title">Permissions Matrix</h3>
                        <p className="roles-form-block__subtitle">
                            Activate the capabilities this role should control. Toggle a permission to add or remove it
                            from the bundle instantly.
                        </p>
                    </header>

                    <div className="roles-permission-clusters" aria-live="polite">
                        {sortedGroupEntries.length === 0 ? (
                            <div className="roles-empty-state roles-empty-state--inline">No permissions available yet.</div>
                        ) : (
                            sortedGroupEntries.map(([groupName, permissions], groupIndex) => (
                                <article
                                    key={groupName}
                                    className="roles-permission-cluster"
                                    style={{ animationDelay: `${groupIndex * 0.04}s` }}
                                >
                                    <div className="roles-permission-cluster__heading">
                                        <span className="roles-permission-cluster__icon" aria-hidden="true">
                                            <FaLayerGroup />
                                        </span>
                                        <div>
                                            <h4 className="roles-permission-cluster__title">{formatGroupName(groupName)}</h4>
                                            <p className="roles-permission-cluster__subtitle">
                                                {permissions.length} capability{permissions.length === 1 ? '' : 'ies'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="roles-permission-cluster__list">
                                        {permissions.map(permission => {
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
                                                    <span className="roles-permission-toggle__indicator" aria-hidden="true" />
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

                <footer className="roles-form-footer" data-animate="fade-up" data-delay="0.15">
                    <button type="submit" className="roles-primary-btn" disabled={submitting || !roleName.trim()}>
                        <FaSave aria-hidden="true" />
                        <span>{submitting ? 'Saving...' : 'Save Role'}</span>
                    </button>
                    <button
                        type="button"
                        className="roles-secondary-btn"
                        onClick={() => navigate('/roles')}
                        disabled={submitting}
                    >
                        Cancel
                    </button>
                </footer>
            </form>
        </section>
    );
};

export default RoleForm;