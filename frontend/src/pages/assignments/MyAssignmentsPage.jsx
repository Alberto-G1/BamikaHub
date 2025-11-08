import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaFilter, FaSearch, FaCheckCircle, FaClock, FaExclamationTriangle, FaProjectDiagram, FaChartLine } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/api';
import { toast } from 'react-toastify';
import './AssignmentsStyles.css';
import '../reporting/ReportingStyles.css';

const MyAssignmentsPage = () => {
    const navigate = useNavigate();
    const { hasPermission } = useAuth();
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [statistics, setStatistics] = useState(null);

    useEffect(() => {
        fetchMyAssignments();
        fetchStatistics();
    }, []);

    const fetchMyAssignments = async () => {
        try {
            setLoading(true);
            const response = await api.get('/assignments/my-assignments');
            setAssignments(response.data);
        } catch (error) {
            console.error('Error fetching assignments:', error);
            toast.error('Failed to load assignments');
        } finally {
            setLoading(false);
        }
    };

    const fetchStatistics = async () => {
        try {
            const response = await api.get('/assignments/statistics');
            setStatistics(response.data);
        } catch (error) {
            console.error('Error fetching statistics:', error);
        }
    };

    const filteredAssignments = assignments.filter(assignment => {
        let statusMatch = true;
        if (filter === 'pending') statusMatch = assignment.status === 'PENDING';
        else if (filter === 'in_progress') statusMatch = assignment.status === 'IN_PROGRESS';
        else if (filter === 'completed') statusMatch = assignment.status === 'COMPLETED';
        else if (filter === 'overdue') statusMatch = assignment.overdue;

        const searchMatch = assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           assignment.description?.toLowerCase().includes(searchTerm.toLowerCase());

        return statusMatch && searchMatch;
    });

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

    const getDaysRemainingDisplay = (assignment) => {
        if (assignment.status === 'COMPLETED') return 'Completed';
        if (assignment.overdue) return <span className="reporting-text--negative">Overdue</span>;
        
        const days = assignment.daysRemaining;
        if (days < 0) return <span className="reporting-text--negative">Overdue</span>;
        if (days === 0) return <span className="reporting-text--warning">Due Today</span>;
        if (days === 1) return <span className="reporting-text--warning">1 day left</span>;
        return `${days} days left`;
    };

    return (
        <section className="reporting-page">
            {/* Header */}
            <div className="reporting-back" data-animate="fade-up">
                <p className="reporting-back__title">Assignments • My Tasks</p>
            </div>

            {/* Banner */}
            <div className="reporting-banner reporting-banner--compact" data-animate="fade-up" data-delay="0.04">
                <div className="reporting-banner__content">
                    <div className="reporting-banner__info">
                        <span className="reporting-banner__eyebrow">
                            <FaProjectDiagram /> My Assignments
                        </span>
                        <h1 className="reporting-banner__title">My Assignments</h1>
                        <p className="reporting-banner__subtitle">
                            Track and manage your assigned tasks and responsibilities
                        </p>
                    </div>
                    {hasPermission('ASSIGNMENT_CREATE') && (
                        <div className="reporting-banner__actions">
                            <button 
                                className="reporting-btn reporting-btn--gold"
                                onClick={() => navigate('/assignments/create')}
                            >
                                <FaPlus /> Create Assignment
                            </button>
                        </div>
                    )}
                </div>

                {/* Statistics */}
                {statistics && (
                    <div className="reporting-banner__meta">
                        <div className="reporting-banner__meta-item">
                            <div className="reporting-banner__meta-icon reporting-banner__meta-icon--blue">
                                <FaCheckCircle />
                            </div>
                            <div className="reporting-banner__meta-content">
                                <span className="reporting-banner__meta-label">Total</span>
                                <span className="reporting-banner__meta-value">{statistics.totalAssignments}</span>
                            </div>
                        </div>
                        <div className="reporting-banner__meta-item">
                            <div className="reporting-banner__meta-icon reporting-banner__meta-icon--purple">
                                <FaClock />
                            </div>
                            <div className="reporting-banner__meta-content">
                                <span className="reporting-banner__meta-label">Pending</span>
                                <span className="reporting-banner__meta-value">{statistics.pendingAssignments}</span>
                            </div>
                        </div>
                        <div className="reporting-banner__meta-item">
                            <div className="reporting-banner__meta-icon reporting-banner__meta-icon--green">
                                <FaChartLine />
                            </div>
                            <div className="reporting-banner__meta-content">
                                <span className="reporting-banner__meta-label">In Progress</span>
                                <span className="reporting-banner__meta-value">{statistics.inProgressAssignments}</span>
                            </div>
                        </div>
                        <div className="reporting-banner__meta-item">
                            <div className="reporting-banner__meta-icon reporting-banner__meta-icon--red">
                                <FaExclamationTriangle />
                            </div>
                            <div className="reporting-banner__meta-content">
                                <span className="reporting-banner__meta-label">Overdue</span>
                                <span className="reporting-banner__meta-value">{statistics.overdueAssignments}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Filters */}
            <div className="reporting-filters" data-animate="fade-up" data-delay="0.08">
                <div className="reporting-filters__header">
                    <div className="reporting-filters__header-icon">
                        <FaFilter />
                    </div>
                    <h2 className="reporting-filters__title">Filter Assignments</h2>
                </div>

                <div className="reporting-filters__grid">
                    <div className="reporting-form-group">
                        <label className="reporting-form-label">Status Filter</label>
                        <div className="reporting-tabs">
                            <button
                                className={`reporting-tab ${filter === 'all' ? 'is-active' : ''}`}
                                onClick={() => setFilter('all')}
                            >
                                All
                            </button>
                            <button
                                className={`reporting-tab ${filter === 'pending' ? 'is-active' : ''}`}
                                onClick={() => setFilter('pending')}
                            >
                                Pending
                            </button>
                            <button
                                className={`reporting-tab ${filter === 'in_progress' ? 'is-active' : ''}`}
                                onClick={() => setFilter('in_progress')}
                            >
                                In Progress
                            </button>
                            <button
                                className={`reporting-tab ${filter === 'completed' ? 'is-active' : ''}`}
                                onClick={() => setFilter('completed')}
                            >
                                Completed
                            </button>
                            <button
                                className={`reporting-tab ${filter === 'overdue' ? 'is-active' : ''}`}
                                onClick={() => setFilter('overdue')}
                            >
                                Overdue
                            </button>
                        </div>
                    </div>
                    <div className="reporting-form-group">
                        <label className="reporting-form-label">Search</label>
                        <div className="search-box">
                            <FaSearch className="search-icon" />
                            <input
                                type="text"
                                className="reporting-input"
                                placeholder="Search assignments..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Assignments Grid */}
            <div className="reporting-grid" data-animate="fade-up" data-delay="0.12">
                {loading ? (
                    <div className="reporting-loading">
                        <div className="reporting-spinner" />
                        <p className="reporting-card__subtitle">Loading assignments…</p>
                    </div>
                ) : filteredAssignments.length === 0 ? (
                    <div className="reporting-card">
                        <div className="reporting-empty-state">
                            No assignments found matching your criteria
                        </div>
                    </div>
                ) : (
                    filteredAssignments.map(assignment => {
                        const progress = assignment.progressPercentage || 0;
                        const progressClass = progress >= 80
                            ? 'reporting-progress__bar--high'
                            : progress >= 50
                                ? 'reporting-progress__bar--medium'
                                : 'reporting-progress__bar--low';

                        return (
                            <div 
                                key={assignment.id} 
                                className={`reporting-card reporting-card--interactive reporting-report-card--blue`}
                                onClick={() => {
                                    if (assignment.id) {
                                        navigate(`/assignments/${assignment.id}`);
                                    } else {
                                        toast.error('Assignment ID is missing');
                                    }
                                }}
                            >
                                <div className="reporting-card__header">
                                    <div className="reporting-report-card__icon reporting-report-card__icon--blue">
                                        <FaProjectDiagram />
                                    </div>
                                    <div>
                                        <h3 className="reporting-report-card__title">{assignment.title}</h3>
                                        <p className="reporting-report-card__description">
                                            {assignment.description || 'No description provided'}
                                        </p>
                                    </div>
                                </div>

                                <div className="reporting-card__content">
                                    <div className="assignment-meta">
                                        <div className="meta-item">
                                            <strong>Assigned by:</strong> {assignment.assignerName || '—'}
                                        </div>
                                        <div className="meta-item">
                                            <strong>Due:</strong> {formatDate(assignment.dueDate)}
                                        </div>
                                        <div className="meta-item">
                                            <strong>Time remaining:</strong> {getDaysRemainingDisplay(assignment)}
                                        </div>
                                    </div>

                                    <div className="assignment-badges">
                                        {getPriorityBadge(assignment.priority)}
                                        {getStatusBadge(assignment.status, assignment.overdue)}
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="progress-section">
                                        <div className="progress-header">
                                            <span className="reporting-text--muted">Progress</span>
                                            <span className="reporting-progress__label">{progress}%</span>
                                        </div>
                                        <div className="reporting-progress-wrapper">
                                            <div className="reporting-progress" aria-label={`Completion ${progress}%`}>
                                                <div className={`reporting-progress__bar ${progressClass}`} style={{ width: `${progress}%` }} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </section>
    );
};

export default MyAssignmentsPage;