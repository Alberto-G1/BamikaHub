import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FaArrowLeft,
    FaProjectDiagram,
    FaFilter,
    FaChartLine,
    FaClock,
    FaCheckCircle,
    FaExclamationCircle
} from 'react-icons/fa';
import api from '../../api/api.js';
import { toast } from 'react-toastify';
import './ReportingStyles.css';

const defaultFilters = {
    startDate: '',
    endDate: '',
    status: '',
    projectId: ''
};

const statusToneMap = {
    PLANNING: 'info',
    IN_PROGRESS: 'warning',
    ON_HOLD: 'warning',
    COMPLETED: 'success',
    CANCELLED: 'danger',
    ARCHIVED: 'neutral'
};

const sanitiseFilters = (filters) => (
    Object.fromEntries(
        Object.entries(filters).filter(([, value]) => value !== '' && value !== null && value !== undefined)
    )
);

const ProjectPerformanceReport = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);
    const [filters, setFilters] = useState(defaultFilters);

    useEffect(() => {
        let isMounted = true;
        const params = sanitiseFilters(filters);

        const load = async () => {
            setLoading(true);
            try {
                const response = await api.get('/reports/operations/project-performance', { params });
                if (isMounted) {
                    const payload = Array.isArray(response.data) ? response.data : [];
                    setData(payload);
                }
            } catch (error) {
                if (isMounted) {
                    toast.error('Failed to load project performance data');
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        load();

        return () => {
            isMounted = false;
        };
    }, [filters]);

    const handleFilterChange = (event) => {
        const { name, value } = event.target;
        setFilters((prev) => ({ ...prev, [name]: value }));
    };

    const resetFilters = () => {
        setFilters(defaultFilters);
    };

    const statusBreakdown = useMemo(() => data.reduce((acc, project) => {
        const key = project?.status;
        if (!key) {
            return acc;
        }
        acc[key] = (acc[key] || 0) + 1;
        return acc;
    }, {}), [data]);

    const averageCompletion = useMemo(() => {
        if (data.length === 0) return 0;
        const total = data.reduce((sum, project) => sum + (Number(project?.completionPercentage) || 0), 0);
        return total / data.length;
    }, [data]);

    const averageDuration = useMemo(() => {
        const durations = data
            .map((project) => Number(project?.durationDays))
            .filter((value) => Number.isFinite(value) && value >= 0);
        if (durations.length === 0) return 0;
        return durations.reduce((sum, value) => sum + value, 0) / durations.length;
    }, [data]);

    const activeProjects = useMemo(() => data.filter((project) => !['ARCHIVED', 'CANCELLED'].includes(project?.status)).length, [data]);

    const overdueProjects = useMemo(() => {
        const now = new Date();
        return data.filter((project) => {
            if (!project?.expectedEndDate) return false;
            const end = new Date(project.expectedEndDate);
            if (Number.isNaN(end.getTime())) return false;
            return project.status !== 'COMPLETED' && end < now;
        }).length;
    }, [data]);

    const metrics = [
        { label: 'Active Projects', value: activeProjects.toLocaleString(), accent: 'purple' },
        { label: 'Avg Duration (days)', value: averageDuration.toFixed(1), accent: 'blue' },
        { label: 'Avg Completion', value: `${averageCompletion.toFixed(1)}%`, accent: 'green' },
        { label: 'Overdue Projects', value: overdueProjects.toLocaleString(), accent: 'red' }
    ];

    const getStatusBadge = (status) => {
        if (!status) return null;
        const tone = statusToneMap[status];
        return (
            <span className={`reporting-badge ${tone ? `reporting-badge--${tone}` : ''}`}>
                {status.replace(/_/g, ' ')}
            </span>
        );
    };

    return (
        <section className="reporting-page">
            <div className="reporting-back" data-animate="fade-up">
                <button
                    type="button"
                    className="reporting-btn reporting-btn--secondary reporting-btn--sm"
                    onClick={() => navigate('/reports')}
                >
                    <FaArrowLeft /> Back to Reports
                </button>
                <p className="reporting-back__title">Operations • Project Performance</p>
            </div>

            <div className="reporting-banner reporting-banner--compact" data-animate="fade-up" data-delay="0.04">
                <div className="reporting-banner__content">
                    <div className="reporting-banner__info">
                        <span className="reporting-banner__eyebrow">
                            <FaProjectDiagram /> Delivery Pulse
                        </span>
                        <h1 className="reporting-banner__title">Project Performance Report</h1>
                        <p className="reporting-banner__subtitle">
                            Track health, timelines, and completion momentum for every active project. Use the filters to focus on specific portfolios or time ranges.
                        </p>
                    </div>
                </div>

                <div className="reporting-banner__meta">
                    <div className="reporting-banner__meta-item">
                        <div className="reporting-banner__meta-icon reporting-banner__meta-icon--blue">
                            <FaProjectDiagram />
                        </div>
                        <div className="reporting-banner__meta-content">
                            <span className="reporting-banner__meta-label">Total Projects</span>
                            <span className="reporting-banner__meta-value">{data.length}</span>
                        </div>
                    </div>
                    <div className="reporting-banner__meta-item">
                        <div className="reporting-banner__meta-icon reporting-banner__meta-icon--green">
                            <FaCheckCircle />
                        </div>
                        <div className="reporting-banner__meta-content">
                            <span className="reporting-banner__meta-label">Completed</span>
                            <span className="reporting-banner__meta-value">{statusBreakdown.COMPLETED || 0}</span>
                        </div>
                    </div>
                    <div className="reporting-banner__meta-item">
                        <div className="reporting-banner__meta-icon reporting-banner__meta-icon--purple">
                            <FaChartLine />
                        </div>
                        <div className="reporting-banner__meta-content">
                            <span className="reporting-banner__meta-label">In Progress</span>
                            <span className="reporting-banner__meta-value">{statusBreakdown.IN_PROGRESS || 0}</span>
                        </div>
                    </div>
                    <div className="reporting-banner__meta-item">
                        <div className="reporting-banner__meta-icon reporting-banner__meta-icon--red">
                            <FaExclamationCircle />
                        </div>
                        <div className="reporting-banner__meta-content">
                            <span className="reporting-banner__meta-label">Overdue</span>
                            <span className="reporting-banner__meta-value">{overdueProjects}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="reporting-filters" data-animate="fade-up" data-delay="0.08">
                <div className="reporting-filters__header">
                    <div className="reporting-filters__header-icon">
                        <FaFilter />
                    </div>
                    <h2 className="reporting-filters__title">Filter Parameters</h2>
                </div>

                <div className="reporting-filters__grid">
                    <div className="reporting-form-group">
                        <label className="reporting-form-label" htmlFor="performance-start-date">Start Date</label>
                        <input
                            id="performance-start-date"
                            type="date"
                            name="startDate"
                            value={filters.startDate}
                            onChange={handleFilterChange}
                            className="reporting-input"
                        />
                    </div>
                    <div className="reporting-form-group">
                        <label className="reporting-form-label" htmlFor="performance-end-date">End Date</label>
                        <input
                            id="performance-end-date"
                            type="date"
                            name="endDate"
                            value={filters.endDate}
                            onChange={handleFilterChange}
                            className="reporting-input"
                        />
                    </div>
                    <div className="reporting-form-group">
                        <label className="reporting-form-label" htmlFor="performance-status">Status</label>
                        <select
                            id="performance-status"
                            name="status"
                            value={filters.status}
                            onChange={handleFilterChange}
                            className="reporting-select"
                        >
                            <option value="">All Statuses</option>
                            <option value="PLANNING">Planning</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="ON_HOLD">On Hold</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="CANCELLED">Cancelled</option>
                            <option value="ARCHIVED">Archived</option>
                        </select>
                    </div>
                    <div className="reporting-form-group">
                        <label className="reporting-form-label" htmlFor="performance-project-id">Project ID</label>
                        <input
                            id="performance-project-id"
                            type="text"
                            name="projectId"
                            value={filters.projectId}
                            onChange={handleFilterChange}
                            placeholder="e.g. OPS-104"
                            className="reporting-input"
                        />
                    </div>
                </div>

                <div className="reporting-filters__actions">
                    <button type="button" className="reporting-btn reporting-btn--secondary" onClick={resetFilters}>
                        Reset Filters
                    </button>
                </div>
            </div>

            <div className="reporting-metrics" data-animate="fade-up" data-delay="0.12">
                {metrics.map((metric) => (
                    <div key={metric.label} className={`reporting-metric reporting-metric--${metric.accent}`}>
                        <span className="reporting-metric__label">{metric.label}</span>
                        <span className="reporting-metric__value">{metric.value}</span>
                    </div>
                ))}
            </div>

            <div className="reporting-card" data-animate="fade-up" data-delay="0.16">
                <div className="reporting-card__header">
                    <div>
                        <h2 className="reporting-card__title">Project Overview</h2>
                        <p className="reporting-card__subtitle">Status, schedule, and completion metrics for monitored projects.</p>
                    </div>
                    <span className="reporting-badge reporting-badge--info">{data.length} Records</span>
                </div>

                <div className="reporting-card__content">
                    {loading ? (
                        <div className="reporting-loading">
                            <div className="reporting-spinner" />
                            <p className="reporting-card__subtitle">Fetching project performance…</p>
                        </div>
                    ) : data.length === 0 ? (
                        <div className="reporting-empty-state">
                            No project performance data available for the selected filters.
                        </div>
                    ) : (
                        <div className="reporting-table-container">
                            <table className="reporting-table">
                                <thead>
                                    <tr>
                                        <th>Project ID</th>
                                        <th>Project Name</th>
                                        <th>Status</th>
                                        <th>Start Date</th>
                                        <th>End Date</th>
                                        <th>Duration (Days)</th>
                                        <th>Completion</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.map((project) => {
                                        const duration = Number.isFinite(Number(project?.durationDays)) ? Number(project.durationDays) : null;
                                        const completion = Math.min(100, Math.max(0, Number(project?.completionPercentage) || 0));
                                        const progressClass = completion >= 80
                                            ? 'reporting-progress__bar--high'
                                            : completion >= 50
                                                ? 'reporting-progress__bar--medium'
                                                : 'reporting-progress__bar--low';

                                        return (
                                            <tr key={project.projectId || project.projectName}>
                                                <td>{project.projectId}</td>
                                                <td>{project.projectName}</td>
                                                <td>{getStatusBadge(project.status)}</td>
                                                <td>{project.startDate || '—'}</td>
                                                <td>{project.expectedEndDate || '—'}</td>
                                                <td>{duration !== null ? duration : '—'}</td>
                                                <td>
                                                    <div className="reporting-progress-wrapper">
                                                        <div className="reporting-progress" aria-label={`Completion ${completion}%`}>
                                                            <div className={`reporting-progress__bar ${progressClass}`} style={{ width: `${completion}%` }} />
                                                        </div>
                                                        <span className="reporting-progress__label">{completion.toFixed(0)}%</span>
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
            </div>
        </section>
    );
};

export default ProjectPerformanceReport;
