import React, { useState, useEffect, useMemo } from 'react';
import {
    FaEdit,
    FaTrash,
    FaPlus,
    FaShieldAlt,
    FaSearch,
    FaUsersCog,
    FaKey,
    FaLayerGroup
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import api from '../../api/api.js';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext.jsx';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import './RolesStyles.css';


const RoleManagement = () => {
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [dialogConfig, setDialogConfig] = useState({ open: false });
    const navigate = useNavigate();
    const { hasPermission } = useAuth();


    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        setError('');
        try {
            const rolesRes = await api.get('/roles');
            setRoles(rolesRes.data);
        } catch (err) {
            setError('Failed to fetch roles. Please try again.');
            toast.error('Unable to load roles.');
        } finally {
            setLoading(false);
        }
    };
    
    const summary = useMemo(() => {
        const totalPermissions = roles.reduce((total, role) => total + (role.permissions?.length || 0), 0);
        const withPermissions = roles.filter(role => (role.permissions?.length || 0) > 0).length;
        const average = roles.length ? Math.round(totalPermissions / roles.length) : 0;

        return {
            totalRoles: roles.length,
            totalPermissions,
            averagePerRole: average,
            withPermissions,
        };
    }, [roles]);

    const filteredRoles = useMemo(() => {
        const query = searchTerm.trim().toLowerCase();
        if (!query) return roles;

        return roles.filter(role => {
            const nameMatch = role.name?.toLowerCase().includes(query);
            if (nameMatch) return true;
            return role.permissions?.some(permission => permission.name?.toLowerCase().includes(query));
        });
    }, [roles, searchTerm]);

    const closeDialog = () => setDialogConfig(prev => ({ ...prev, open: false }));

    const confirmDelete = role => {
        setDialogConfig({
            open: true,
            tone: 'danger',
            title: 'Delete Role',
            message: `Delete the role '${role.name}'?`,
            detail: 'This will remove the role and its permission assignments permanently.',
            confirmLabel: 'Delete',
            cancelLabel: 'Cancel',
            onConfirm: () => handleDelete(role.id),
        });
    };

    const handleDelete = async (roleId) => {
        closeDialog();
        try {
            await api.delete(`/roles/${roleId}`);
            toast.success('Role deleted successfully!');
            fetchData(); // Refetch data
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to delete role.');
        }
    };

    const metrics = [
        {
            label: 'Total Roles',
            value: summary.totalRoles,
            icon: <FaUsersCog />,
            modifier: 'roles-banner__meta-icon--blue'
        },
        {
            label: 'Total Permissions',
            value: summary.totalPermissions,
            icon: <FaKey />,
            modifier: 'roles-banner__meta-icon--gold'
        },
        {
            label: 'Average Per Role',
            value: summary.averagePerRole,
            icon: <FaLayerGroup />,
            modifier: 'roles-banner__meta-icon--green'
        },
        {
            label: 'Roles With Access',
            value: summary.withPermissions,
            icon: <FaShieldAlt />,
            modifier: 'roles-banner__meta-icon--red'
        }
    ];

    const cardVariants = ['blue', 'gold', 'green', 'purple', 'red'];

    return (
        <section className="roles-page">
            {loading ? (
                <div className="roles-loading" data-animate="fade-up">
                    <span className="roles-spinner" aria-hidden="true" />
                    <p>Loading roles...</p>
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
                                <h1 className="roles-banner__title">Roles &amp; Permissions</h1>
                                <p className="roles-banner__subtitle">
                                    Curate who can access what by tailoring permission bundles for each team profile.
                                    Empower governance without sacrificing speed.
                                </p>
                            </div>
                            <div className="roles-banner__actions">
                                {hasPermission('ROLE_CREATE') && (
                                    <button
                                        type="button"
                                        className="roles-btn roles-btn--gold"
                                        onClick={() => navigate('/roles/new')}
                                    >
                                        <FaPlus />
                                        Add role
                                    </button>
                                )}
                                <button
                                    type="button"
                                    className="roles-btn roles-btn--ghost"
                                    onClick={fetchData}
                                    disabled={loading}
                                >
                                    Refresh
                                </button>
                            </div>
                        </div>
                        <div className="roles-banner__meta">
                            {metrics.map((metric) => (
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

                    <div className="roles-filters" data-animate="fade-up" data-delay="0.08">
                        <div className="roles-filters__header">
                            <h2 className="roles-filters__title">Role Directory</h2>
                            {error && <div className="roles-error" role="alert">{error}</div>}
                        </div>
                        <div className="roles-filters__controls">
                            <div className="roles-input-wrap">
                                <FaSearch aria-hidden="true" />
                                <input
                                    className="roles-input"
                                    type="text"
                                    placeholder="Search by role name or permission"
                                    value={searchTerm}
                                    onChange={(event) => setSearchTerm(event.target.value)}
                                />
                            </div>
                            {searchTerm && (
                                <button
                                    type="button"
                                    className="roles-btn roles-btn--ghost roles-btn--icon"
                                    onClick={() => setSearchTerm('')}
                                >
                                    Clear
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="roles-grid" data-animate="fade-up" data-delay="0.12">
                        {filteredRoles.length === 0 ? (
                            <div className="roles-empty-state">No roles match your current filters.</div>
                        ) : (
                            filteredRoles.map((role, index) => {
                                const permissions = role.permissions || [];
                                const previewPermissions = permissions.slice(0, 3);
                                const remainingCount = Math.max(permissions.length - previewPermissions.length, 0);

                                return (
                                    <article
                                        key={role.id}
                                        className="roles-card"
                                        style={{ animationDelay: `${index * 0.04}s` }}
                                        data-variant={cardVariants[index % cardVariants.length]}
                                    >
                                        <header className="roles-card__header">
                                            <div className="roles-card__icon" aria-hidden="true">
                                                <FaShieldAlt />
                                            </div>
                                            <div>
                                                <h3 className="roles-card__title">{role.name}</h3>
                                                <p className="roles-card__subtitle">
                                                    {permissions.length} permission{permissions.length === 1 ? '' : 's'} assigned
                                                </p>
                                            </div>
                                        </header>

                                        {permissions.length > 0 ? (
                                            <ul className="roles-card__chips" aria-label="Permission preview">
                                                {previewPermissions.map((permission) => (
                                                    <li key={permission.id} className="roles-card__chip">
                                                        {permission.name}
                                                    </li>
                                                ))}
                                                {remainingCount > 0 && (
                                                    <li className="roles-card__chip roles-card__chip--muted">
                                                        +{remainingCount} more
                                                    </li>
                                                )}
                                            </ul>
                                        ) : (
                                            <p className="roles-card__empty">No permissions assigned yet.</p>
                                        )}

                                        <footer className="roles-card__actions">
                                            {hasPermission('ROLE_UPDATE') && (
                                                <button
                                                    type="button"
                                                    className="roles-btn roles-btn--secondary roles-btn--icon"
                                                    onClick={() => navigate(`/roles/edit/${role.id}`)}
                                                    aria-label={`Edit ${role.name}`}
                                                >
                                                    <FaEdit />
                                                    Edit
                                                </button>
                                            )}
                                            {hasPermission('ROLE_DELETE') && (
                                                <button
                                                    type="button"
                                                    className="roles-btn roles-btn--danger roles-btn--icon"
                                                    onClick={() => confirmDelete(role)}
                                                    aria-label={`Delete ${role.name}`}
                                                >
                                                    <FaTrash />
                                                    Delete
                                                </button>
                                            )}
                                        </footer>
                                    </article>
                                );
                            })
                        )}
                    </div>
                </>
            )}

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

export default RoleManagement;