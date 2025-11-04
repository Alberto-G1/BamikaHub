import React, { useState, useEffect, useMemo } from 'react';
import { FaPlus, FaSearch, FaProjectDiagram, FaArchive, FaMapMarkerAlt, FaUsers, FaCalendarAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import api from '../../api/api.js';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext.jsx';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import './OperationsStyles.css';

// Helper to get status badge class
const getStatusBadgeClass = (status) => {
    switch (status) {
        case 'IN_PROGRESS': return 'operations-badge--in-progress';
        case 'COMPLETED': return 'operations-badge--completed';
        case 'PLANNING': return 'operations-badge--planning';
        case 'ON_HOLD': return 'operations-badge--on-hold';
        case 'CANCELLED': return 'operations-badge--cancelled';
        default: return 'operations-badge--planning';
    }
};

const formatStatus = (status) => {
    return status ? status.replace('_', ' ') : 'Unknown';
};

const ProjectPage = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { hasPermission } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [dialogConfig, setDialogConfig] = useState({ open: false });

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        setLoading(true);
        try {
            const response = await api.get('/projects');
            setProjects(response.data);
        } catch (err) {
            toast.error('Failed to fetch projects.');
        } finally {
            setLoading(false);
        }
    };

    const closeDialog = () => setDialogConfig(prev => ({ ...prev, open: false }));

    const confirmArchive = (project, event) => {
        event.stopPropagation();
        setDialogConfig({
            open: true,
            tone: 'warning',
            title: 'Archive Project',
            message: `Archive project "${project.name}"?`,
            detail: 'This will move the project to the archived projects list. You can restore it later if needed.',
            confirmLabel: 'Archive',
            cancelLabel: 'Cancel',
            onConfirm: () => handleArchive(project.id),
        });
    };

    const handleArchive = async (projectId) => {
        closeDialog();
        try {
            await api.post(`/projects/${projectId}/archive`);
            toast.success("Project archived successfully.");
            fetchProjects();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to archive project.");
        }
    };

    const filteredProjects = useMemo(() => {
        if (!projects) return [];
        return projects.filter(project =>
            project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            project.clientName.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [projects, searchQuery]);

    const summary = useMemo(() => {
        const totalSites = projects.reduce((total, p) => total + (p.sites?.length || 0), 0);
        const totalEngineers = projects.reduce((total, p) => total + (p.assignedEngineers?.length || 0), 0);
        const inProgress = projects.filter(p => p.status === 'IN_PROGRESS').length;
        return { totalProjects: projects.length, totalSites, totalEngineers, inProgress };
    }, [projects]);

    if (loading) {
        return (
            <section className="operations-page">
                <div className="operations-loading">
                    <span className="operations-spinner" aria-hidden="true" />
                    <p>Loading projects...</p>
                </div>
            </section>
        );
    }

    return (
        <section className="operations-page">
            {/* Hero Banner */}
            <div className="operations-banner" data-animate="fade-up">
                <div className="operations-banner__content">
                    <div className="operations-banner__info">
                        <div className="operations-banner__eyebrow">Project Management</div>
                        <h2 className="operations-banner__title">Active Projects</h2>
                        <p className="operations-banner__subtitle">
                            Track and manage all active construction projects, sites, and field operations in real-time.
                        </p>

                        <div className="operations-banner__meta">
                            <div className="operations-banner__meta-item">
                                <span className="operations-meta-label">Total Projects</span>
                                <span className="operations-meta-value">{summary.totalProjects}</span>
                            </div>
                            <div className="operations-banner__meta-item">
                                <span className="operations-meta-label">In Progress</span>
                                <span className="operations-meta-value">{summary.inProgress}</span>
                            </div>
                            <div className="operations-banner__meta-item">
                                <span className="operations-meta-label">Total Sites</span>
                                <span className="operations-meta-value">{summary.totalSites}</span>
                            </div>
                            <div className="operations-banner__meta-item">
                                <span className="operations-meta-label">Engineers</span>
                                <span className="operations-meta-value">{summary.totalEngineers}</span>
                            </div>
                        </div>
                    </div>

                    <div className="operations-banner__actions">
                        {hasPermission('PROJECT_READ') && (
                            <button
                                className="operations-btn operations-btn--secondary"
                                onClick={() => navigate('/projects/archived')}
                            >
                                <FaArchive aria-hidden="true" />
                                <span>View Archived</span>
                            </button>
                        )}
                        {hasPermission('PROJECT_CREATE') && (
                            <button
                                className="operations-btn operations-btn--gold"
                                onClick={() => navigate('/projects/new')}
                            >
                                <FaPlus aria-hidden="true" />
                                <span>New Project</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="operations-toolbar" data-animate="fade-up" data-delay="0.08">
                <div className="operations-search">
                    <FaSearch className="operations-search__icon" aria-hidden="true" />
                    <input
                        type="text"
                        className="operations-search__input"
                        placeholder="Search by project name or client..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Project Grid */}
            {filteredProjects.length > 0 ? (
                <div className="operations-grid" data-animate="fade-up" data-delay="0.12">
                    {filteredProjects.map(project => (
                        <div
                            key={project.id}
                            className="operations-card"
                            onClick={() => navigate(`/projects/${project.id}`)}
                        >
                            <div className="operations-card__header">
                                <div>
                                    <h3 className="operations-card__title">{project.name}</h3>
                                    <p className="operations-card__subtitle">
                                        <FaProjectDiagram aria-hidden="true" style={{ marginRight: '0.4rem' }} />
                                        {project.clientName}
                                    </p>
                                </div>
                                <span className={`operations-badge ${getStatusBadgeClass(project.status)}`}>
                                    {formatStatus(project.status)}
                                </span>
                            </div>

                            <div className="operations-card__body">
                                <div className="operations-card__meta">
                                    <div className="operations-card__meta-item">
                                        <span className="operations-card__meta-label">
                                            <FaCalendarAlt aria-hidden="true" /> Start Date
                                        </span>
                                        <span className="operations-card__meta-value">
                                            {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'N/A'}
                                        </span>
                                    </div>
                                    <div className="operations-card__meta-item">
                                        <span className="operations-card__meta-label">
                                            <FaMapMarkerAlt aria-hidden="true" /> Sites
                                        </span>
                                        <span className="operations-card__meta-value">
                                            {project.sites?.length || 0}
                                        </span>
                                    </div>
                                    <div className="operations-card__meta-item">
                                        <span className="operations-card__meta-label">
                                            <FaUsers aria-hidden="true" /> Engineers
                                        </span>
                                        <span className="operations-card__meta-value">
                                            {project.assignedEngineers?.length || 0}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="operations-card__footer">
                                <div></div>
                                {project.status === 'COMPLETED' && hasPermission('PROJECT_DELETE') && (
                                    <button
                                        className="operations-btn operations-btn--secondary operations-btn--icon"
                                        title="Archive Project"
                                        onClick={(e) => confirmArchive(project, e)}
                                    >
                                        <FaArchive aria-hidden="true" />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="operations-empty" data-animate="fade-up" data-delay="0.12">
                    <div className="operations-empty__icon">
                        <FaProjectDiagram aria-hidden="true" />
                    </div>
                    <h3 className="operations-empty__title">No Projects Found</h3>
                    <p className="operations-empty__subtitle">
                        {searchQuery 
                            ? `No projects match "${searchQuery}". Try adjusting your search.`
                            : 'Start by creating your first project to begin tracking operations.'}
                    </p>
                    {hasPermission('PROJECT_CREATE') && !searchQuery && (
                        <button
                            className="operations-btn operations-btn--gold"
                            onClick={() => navigate('/projects/new')}
                        >
                            <FaPlus aria-hidden="true" />
                            <span>Create First Project</span>
                        </button>
                    )}
                </div>
            )}

            {/* Confirm Dialog */}
            <ConfirmDialog
                open={dialogConfig.open}
                title={dialogConfig.title}
                message={dialogConfig.message}
                detail={dialogConfig.detail}
                tone={dialogConfig.tone}
                confirmLabel={dialogConfig.confirmLabel}
                cancelLabel={dialogConfig.cancelLabel}
                onConfirm={dialogConfig.onConfirm}
                onCancel={closeDialog}
            />
        </section>
    );
};

export default ProjectPage;
