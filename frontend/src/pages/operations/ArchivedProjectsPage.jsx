import React, { useState, useEffect } from 'react';
import { FaArrowLeft, FaArchive, FaProjectDiagram, FaCalendarAlt, FaEye } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import api from '../../api/api.js';
import { toast } from 'react-toastify';
import './OperationsStyles.css';

const ArchivedProjectsPage = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchArchivedProjects = async () => {
            setLoading(true);
            try {
                const response = await api.get('/projects/archived');
                setProjects(response.data);
            } catch (err) {
                toast.error('Failed to fetch archived projects.');
            } finally {
                setLoading(false);
            }
        };
        fetchArchivedProjects();
    }, []);

    if (loading) {
        return (
            <section className="operations-page">
                <div className="operations-loading">
                    <span className="operations-spinner" aria-hidden="true" />
                    <p>Loading archived projects...</p>
                </div>
            </section>
        );
    }

    return (
        <section className="operations-page">
            {/* Hero Banner */}
            <div className="operations-banner" data-animate="fade-up">
                <button 
                    type="button" 
                    className="operations-btn operations-btn--blue" 
                    onClick={() => navigate('/projects')}
                    style={{ border: 'none', background: 'transparent', boxShadow: 'none', padding: '0.5rem 0', width: 'fit-content' }}
                >
                    <FaArrowLeft aria-hidden="true" />
                    <span>Back to Active Projects</span>
                </button>

                <div className="operations-banner__content">
                    <div className="operations-banner__info">
                        <div className="operations-banner__eyebrow">Project Archive</div>
                        <h2 className="operations-banner__title">Archived Projects</h2>
                        <p className="operations-banner__subtitle">
                            View and manage completed or archived construction projects for historical reference and reporting.
                        </p>

                        <div className="operations-banner__meta">
                            <div className="operations-banner__meta-item">
                                <span className="operations-meta-label">Total Archived</span>
                                <span className="operations-meta-value">{projects.length}</span>
                            </div>
                            <div className="operations-banner__meta-item">
                                <span className="operations-meta-label">Status</span>
                                <span className="operations-meta-value">Archive</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Project Grid */}
            {projects.length > 0 ? (
                <div className="operations-grid" data-animate="fade-up" data-delay="0.08">
                    {projects.map(project => (
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
                                <span className="operations-badge" style={{
                                    background: 'rgba(148, 163, 184, 0.15)',
                                    color: 'var(--operations-text-muted)',
                                    borderColor: 'rgba(148, 163, 184, 0.3)'
                                }}>
                                    <FaArchive aria-hidden="true" />
                                    Archived
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
                                            <FaCalendarAlt aria-hidden="true" /> End Date
                                        </span>
                                        <span className="operations-card__meta-value">
                                            {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'N/A'}
                                        </span>
                                    </div>
                                </div>

                                {project.description && (
                                    <p style={{
                                        fontSize: '0.9rem',
                                        color: 'var(--operations-text-muted)',
                                        margin: '1rem 0 0',
                                        lineHeight: '1.5',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        display: '-webkit-box',
                                        WebkitLineClamp: '2',
                                        WebkitBoxOrient: 'vertical'
                                    }}>
                                        {project.description}
                                    </p>
                                )}
                            </div>

                            <div className="operations-card__footer">
                                <div></div>
                                <button
                                    className="operations-btn operations-btn--secondary operations-btn--icon"
                                    title="View Details"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/projects/${project.id}`);
                                    }}
                                >
                                    <FaEye aria-hidden="true" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="operations-empty" data-animate="fade-up" data-delay="0.08">
                    <div className="operations-empty__icon">
                        <FaArchive aria-hidden="true" />
                    </div>
                    <h3 className="operations-empty__title">No Archived Projects</h3>
                    <p className="operations-empty__subtitle">
                        There are no archived projects yet. Completed projects will appear here for historical reference.
                    </p>
                    <button
                        className="operations-btn operations-btn--blue"
                        onClick={() => navigate('/projects')}
                    >
                        <FaArrowLeft aria-hidden="true" />
                        <span>Back to Active Projects</span>
                    </button>
                </div>
            )}
        </section>
    );
};

export default ArchivedProjectsPage;
