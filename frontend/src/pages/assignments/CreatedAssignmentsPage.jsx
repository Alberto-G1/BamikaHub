import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaEye, FaProjectDiagram, FaCheckCircle, FaChartLine, FaClock, FaExclamationCircle } from 'react-icons/fa';
import api from '../../api/api';
import { toast } from 'react-toastify';
import './AssignmentsStyles.css';
import '../reporting/ReportingStyles.css';

const CreatedAssignmentsPage = () => {
    const navigate = useNavigate();
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        inProgress: 0,
        completed: 0,
        overdue: 0
    });

    useEffect(() => {
        fetchCreatedAssignments();
    }, []);

    const fetchCreatedAssignments = async () => {
        try {
            setLoading(true);
            const response = await api.get('/assignments/created-by-me');
            setAssignments(response.data);
            calculateStats(response.data);
        } catch (error) {
            console.error('Error fetching assignments:', error);
            toast.error('Failed to load assignments');
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (data) => {
        const stats = {
            total: data.length,
            pending: data.filter(a => a.status === 'PENDING').length,
            inProgress: data.filter(a => a.status === 'IN_PROGRESS').length,
            completed: data.filter(a => a.status === 'COMPLETED').length,
            overdue: data.filter(a => a.overdue).length
        };
        setStats(stats);
    };

    const getPriorityBadge = (priority) => {
        const badgeMap = {
            LOW: { variant: 'info', text: 'Low' },
            MEDIUM: { variant: 'neutral', text: 'Medium' },
            HIGH: { variant: 'warning', text: 'High' },
            URGENT: { variant: 'danger', text: 'Urgent' }
        };
        const badge = badgeMap[priority] || badgeMap.MEDIUM;
        return <span className={`reporting-badge reporting-badge--${badge.variant}`}>{badge.text}</span>;
    };

    const getStatusBadge = (status, overdue) => {
        if (overdue) return <span className="reporting-badge reporting-badge--danger">Overdue</span>;
        
        const badgeMap = {
            PENDING: { variant: 'neutral', text: 'Pending' },
            IN_PROGRESS: { variant: 'info', text: 'In Progress' },
            UNDER_REVIEW: { variant: 'info', text: 'Under Review' },
            COMPLETED: { variant: 'success', text: 'Completed' },
            CANCELLED: { variant: 'neutral', text: 'Cancelled' }
        };
        const badge = badgeMap[status] || badgeMap.PENDING;
        return <span className={`reporting-badge reporting-badge--${badge.variant}`}>{badge.text}</span>;
    };

    const formatDate = (dateString) => {
        if (!dateString) return '—';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '—';
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    return (
        <section className="reporting-page">
            {/* Header */}
            <div className="reporting-back" data-animate="fade-up">
                <p className="reporting-back__title">Assignments • Created by Me</p>
            </div>

            {/* Banner */}
            <div className="reporting-banner reporting-banner--compact" data-animate="fade-up" data-delay="0.04">
                <div className="reporting-banner__content">
                    <div className="reporting-banner__info">
                        <span className="reporting-banner__eyebrow">
                            <FaProjectDiagram /> Assignment Management
                        </span>
                        <h1 className="reporting-banner__title">Assignments Created by Me</h1>
                        <p className="reporting-banner__subtitle">
                            Manage and track assignments you've delegated to team members
                        </p>
                    </div>
                    <div className="reporting-banner__actions">
                        <button 
                            className="reporting-btn reporting-btn--gold"
                            onClick={() => navigate('/assignments/create')}
                        >
                            <FaPlus /> Create Assignment
                        </button>
                    </div>
                </div>

                {/* Statistics */}
                <div className="reporting-banner__meta">
                    <div className="reporting-banner__meta-item">
                        <div className="reporting-banner__meta-icon reporting-banner__meta-icon--blue">
                            <FaProjectDiagram />
                        </div>
                        <div className="reporting-banner__meta-content">
                            <span className="reporting-banner__meta-label">Total</span>
                            <span className="reporting-banner__meta-value">{stats.total}</span>
                        </div>
                    </div>
                    <div className="reporting-banner__meta-item">
                        <div className="reporting-banner__meta-icon reporting-banner__meta-icon--purple">
                            <FaChartLine />
                        </div>
                        <div className="reporting-banner__meta-content">
                            <span className="reporting-banner__meta-label">In Progress</span>
                            <span className="reporting-banner__meta-value">{stats.inProgress}</span>
                        </div>
                    </div>
                    <div className="reporting-banner__meta-item">
                        <div className="reporting-banner__meta-icon reporting-banner__meta-icon--green">
                            <FaCheckCircle />
                        </div>
                        <div className="reporting-banner__meta-content">
                            <span className="reporting-banner__meta-label">Completed</span>
                            <span className="reporting-banner__meta-value">{stats.completed}</span>
                        </div>
                    </div>
                    <div className="reporting-banner__meta-item">
                        <div className="reporting-banner__meta-icon reporting-banner__meta-icon--red">
                            <FaExclamationCircle />
                        </div>
                        <div className="reporting-banner__meta-content">
                            <span className="reporting-banner__meta-label">Overdue</span>
                            <span className="reporting-banner__meta-value">{stats.overdue}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Assignments Table */}
            <div className="reporting-card" data-animate="fade-up" data-delay="0.08">
                <div className="reporting-card__header">
                    <h2 className="reporting-card__title">My Created Assignments</h2>
                    <p className="reporting-card__subtitle">Overview of all assignments you have created</p>
                </div>

                <div className="reporting-card__content">
                    {loading ? (
                        <div className="reporting-loading">
                            <div className="reporting-spinner" />
                            <p className="reporting-card__subtitle">Loading assignments…</p>
                        </div>
                    ) : assignments.length === 0 ? (
                        <div className="reporting-empty-state">
                            No assignments created yet. Create your first assignment to get started.
                        </div>
                    ) : (
                        <div className="reporting-table-container">
                            <table className="reporting-table">
                                <thead>
                                    <tr>
                                        <th>Title</th>
                                        <th>Assigned To</th>
                                        <th>Priority</th>
                                        <th>Status</th>
                                        <th>Progress</th>
                                        <th>Due Date</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {assignments.map(assignment => {
                                        const progress = assignment.progressPercentage || 0;
                                        const progressClass = progress >= 80
                                            ? 'reporting-progress__bar--high'
                                            : progress >= 50
                                                ? 'reporting-progress__bar--medium'
                                                : 'reporting-progress__bar--low';

                                        return (
                                            <tr key={assignment.id}>
                                                <td>
                                                    <strong>{assignment.title || '—'}</strong>
                                                </td>
                                                <td>{assignment.assigneeName || '—'}</td>
                                                <td>{getPriorityBadge(assignment.priority)}</td>
                                                <td>{getStatusBadge(assignment.status, assignment.overdue)}</td>
                                                <td>
                                                    <div className="reporting-progress-wrapper">
                                                        <div className="reporting-progress" aria-label={`Completion ${progress}%`}>
                                                            <div className={`reporting-progress__bar ${progressClass}`} style={{ width: `${progress}%` }} />
                                                        </div>
                                                        <span className="reporting-progress__label">{progress}%</span>
                                                    </div>
                                                </td>
                                                <td>{formatDate(assignment.dueDate)}</td>
                                                <td>
                                                    <button
                                                        className="reporting-btn reporting-btn--secondary reporting-btn--sm"
                                                        onClick={() => {
                                                            if (assignment.id) {
                                                                navigate(`/assignments/${assignment.id}`);
                                                            } else {
                                                                toast.error('Assignment ID is missing');
                                                            }
                                                        }}
                                                    >
                                                        <FaEye /> View
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};

export default CreatedAssignmentsPage;