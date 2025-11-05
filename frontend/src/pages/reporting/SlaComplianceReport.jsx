import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FaArrowLeft,
    FaCheckCircle,
    FaFilter,
    FaClock,
    FaTicketAlt,
    FaChartBar,
    FaExclamationTriangle
} from 'react-icons/fa';
import api from '../../api/api.js';
import { toast } from 'react-toastify';
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import './ReportingStyles.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const defaultFilters = {
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 3)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    priority: '',
    status: ''
};

const formatDate = (value) => {
    if (!value) return '—';
    return new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    }).format(new Date(value));
};

const formatPercentage = (value) => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
        return '—';
    }
    return `${Number(value).toFixed(1)}%`;
};

const SlaComplianceReport = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);
    const [filters, setFilters] = useState(defaultFilters);

    useEffect(() => {
        let isMounted = true;
        const load = async () => {
            setLoading(true);
            try {
                const response = await api.get('/reports/support/sla-compliance', { params: filters });
                if (isMounted) {
                    const payload = Array.isArray(response.data) ? response.data : [];
                    setData(payload);
                }
            } catch (error) {
                if (isMounted) {
                    toast.error('Failed to load SLA compliance data');
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

    const totalTickets = useMemo(() => data.reduce((sum, item) => sum + (Number(item?.totalTickets) || 0), 0), [data]);

    const averageResponseCompliance = useMemo(() => {
        if (data.length === 0) return 0;
        const total = data.reduce((sum, item) => sum + (Number(item?.responseCompliancePercentage) || 0), 0);
        return total / data.length;
    }, [data]);

    const averageResolutionCompliance = useMemo(() => {
        if (data.length === 0) return 0;
        const total = data.reduce((sum, item) => sum + (Number(item?.resolutionCompliancePercentage) || 0), 0);
        return total / data.length;
    }, [data]);

    const urgentTickets = useMemo(() => data
        .filter((item) => item?.priority === 'URGENT')
        .reduce((sum, item) => sum + (Number(item?.totalTickets) || 0), 0), [data]);

    const weightedResponseHours = useMemo(() => {
        if (totalTickets === 0) return 0;
        const total = data.reduce((sum, item) => sum + (Number(item?.averageResponseHours) || 0) * (Number(item?.totalTickets) || 0), 0);
        return total / totalTickets;
    }, [data, totalTickets]);

    const weightedResolutionHours = useMemo(() => {
        if (totalTickets === 0) return 0;
        const total = data.reduce((sum, item) => sum + (Number(item?.averageResolutionHours) || 0) * (Number(item?.totalTickets) || 0), 0);
        return total / totalTickets;
    }, [data, totalTickets]);

    const metrics = [
        { label: 'Total Tickets', value: totalTickets.toLocaleString(), accent: 'purple' },
        { label: 'Avg Response SLA', value: formatPercentage(averageResponseCompliance), accent: 'gold' },
        { label: 'Avg Resolution SLA', value: formatPercentage(averageResolutionCompliance), accent: 'green' },
        { label: 'Urgent Tickets', value: urgentTickets.toLocaleString(), accent: 'red' }
    ];

    const chartData = useMemo(() => ({
        labels: data.map((item) => item.priority),
        datasets: [
            {
                label: 'Response Compliance %',
                data: data.map((item) => Number(item?.responseCompliancePercentage) || 0),
                backgroundColor: 'rgba(245, 158, 11, 0.65)'
            },
            {
                label: 'Resolution Compliance %',
                data: data.map((item) => Number(item?.resolutionCompliancePercentage) || 0),
                backgroundColor: 'rgba(16, 185, 129, 0.65)'
            }
        ]
    }), [data]);

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    usePointStyle: true,
                    padding: 16
                }
            },
            title: {
                display: false
            },
            tooltip: {
                callbacks: {
                    label: (context) => `${context.parsed.y.toFixed(1)}%`
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                max: 100,
                ticks: {
                    callback: (value) => `${value}%`
                }
            }
        }
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
                <p className="reporting-back__title">Support • SLA Compliance</p>
            </div>

            <div className="reporting-banner reporting-banner--compact" data-animate="fade-up" data-delay="0.04">
                <div className="reporting-banner__content">
                    <div className="reporting-banner__info">
                        <span className="reporting-banner__eyebrow">
                            <FaCheckCircle /> Service Reliability
                        </span>
                        <h1 className="reporting-banner__title">SLA Compliance Report</h1>
                        <p className="reporting-banner__subtitle">
                            Understand how well support teams are meeting agreed response and resolution targets across all priority levels.
                        </p>
                    </div>
                </div>

                <div className="reporting-banner__meta">
                    <div className="reporting-banner__meta-item">
                        <div className="reporting-banner__meta-icon reporting-banner__meta-icon--blue">
                            <FaClock />
                        </div>
                        <div className="reporting-banner__meta-content">
                            <span className="reporting-banner__meta-label">Tracking Window</span>
                            <span className="reporting-banner__meta-value">{`${formatDate(filters.startDate)} → ${formatDate(filters.endDate)}`}</span>
                        </div>
                    </div>
                    <div className="reporting-banner__meta-item">
                        <div className="reporting-banner__meta-icon reporting-banner__meta-icon--purple">
                            <FaTicketAlt />
                        </div>
                        <div className="reporting-banner__meta-content">
                            <span className="reporting-banner__meta-label">Tickets Analysed</span>
                            <span className="reporting-banner__meta-value">{totalTickets}</span>
                        </div>
                    </div>
                    <div className="reporting-banner__meta-item">
                        <div className="reporting-banner__meta-icon reporting-banner__meta-icon--gold">
                            <FaChartBar />
                        </div>
                        <div className="reporting-banner__meta-content">
                            <span className="reporting-banner__meta-label">Avg Response (hrs)</span>
                            <span className="reporting-banner__meta-value">{weightedResponseHours.toFixed(1)}</span>
                        </div>
                    </div>
                    <div className="reporting-banner__meta-item">
                        <div className="reporting-banner__meta-icon reporting-banner__meta-icon--green">
                            <FaCheckCircle />
                        </div>
                        <div className="reporting-banner__meta-content">
                            <span className="reporting-banner__meta-label">Avg Resolution (hrs)</span>
                            <span className="reporting-banner__meta-value">{weightedResolutionHours.toFixed(1)}</span>
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
                        <label className="reporting-form-label" htmlFor="sla-start-date">Start Date</label>
                        <input
                            id="sla-start-date"
                            type="date"
                            name="startDate"
                            value={filters.startDate}
                            onChange={handleFilterChange}
                            className="reporting-input"
                        />
                    </div>
                    <div className="reporting-form-group">
                        <label className="reporting-form-label" htmlFor="sla-end-date">End Date</label>
                        <input
                            id="sla-end-date"
                            type="date"
                            name="endDate"
                            value={filters.endDate}
                            onChange={handleFilterChange}
                            className="reporting-input"
                        />
                    </div>
                    <div className="reporting-form-group">
                        <label className="reporting-form-label" htmlFor="sla-priority">Priority</label>
                        <select
                            id="sla-priority"
                            name="priority"
                            value={filters.priority}
                            onChange={handleFilterChange}
                            className="reporting-select"
                        >
                            <option value="">All</option>
                            <option value="LOW">Low</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="HIGH">High</option>
                            <option value="URGENT">Urgent</option>
                        </select>
                    </div>
                    <div className="reporting-form-group">
                        <label className="reporting-form-label" htmlFor="sla-status">Status</label>
                        <select
                            id="sla-status"
                            name="status"
                            value={filters.status}
                            onChange={handleFilterChange}
                            className="reporting-select"
                        >
                            <option value="">All</option>
                            <option value="OPEN">Open</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="RESOLVED">Resolved</option>
                            <option value="CLOSED">Closed</option>
                        </select>
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

            <div className="reporting-card reporting-card--stretch" data-animate="fade-up" data-delay="0.16">
                <div className="reporting-card__header">
                    <div>
                        <h2 className="reporting-card__title">Compliance by Priority</h2>
                        <p className="reporting-card__subtitle">Compare response and resolution SLA adherence for each ticket priority.</p>
                    </div>
                </div>

                <div className="reporting-card__content">
                    {loading ? (
                        <div className="reporting-loading">
                            <div className="reporting-spinner" />
                            <p className="reporting-card__subtitle">Processing SLA metrics…</p>
                        </div>
                    ) : data.length === 0 ? (
                        <div className="reporting-empty-state">
                            No SLA compliance data matched the selected filters.
                        </div>
                    ) : (
                        <div className="reporting-chart">
                            <Bar data={chartData} options={chartOptions} />
                        </div>
                    )}
                </div>
            </div>

            <div className="reporting-card" data-animate="fade-up" data-delay="0.2">
                <div className="reporting-card__header">
                    <div>
                        <h2 className="reporting-card__title">Priority Breakdown</h2>
                        <p className="reporting-card__subtitle">Detailed SLA results with average response and resolution times.</p>
                    </div>
                </div>

                <div className="reporting-card__content">
                    {loading ? (
                        <div className="reporting-loading">
                            <div className="reporting-spinner" />
                            <p className="reporting-card__subtitle">Preparing SLA breakdown…</p>
                        </div>
                    ) : data.length === 0 ? (
                        <div className="reporting-empty-state">
                            Adjust the filters to review SLA results for specific ticket sets.
                        </div>
                    ) : (
                        <div className="reporting-table-container">
                            <table className="reporting-table">
                                <thead>
                                    <tr>
                                        <th>Priority</th>
                                        <th>Total Tickets</th>
                                        <th>Response Met</th>
                                        <th>Resolution Met</th>
                                        <th>Response Compliance %</th>
                                        <th>Resolution Compliance %</th>
                                        <th>Avg Response (hrs)</th>
                                        <th>Avg Resolution (hrs)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.map((item) => {
                                        const responseTone = (Number(item?.responseCompliancePercentage) || 0) >= 80
                                            ? 'reporting-text--positive'
                                            : 'reporting-text--negative';
                                        const resolutionTone = (Number(item?.resolutionCompliancePercentage) || 0) >= 80
                                            ? 'reporting-text--positive'
                                            : 'reporting-text--negative';

                                        return (
                                            <tr key={item.priority}>
                                                <td><strong>{item.priority}</strong></td>
                                                <td>{(Number(item?.totalTickets) || 0).toLocaleString()}</td>
                                                <td>{(Number(item?.responseMetCount) || 0).toLocaleString()}</td>
                                                <td>{(Number(item?.resolutionMetCount) || 0).toLocaleString()}</td>
                                                <td><span className={responseTone}>{formatPercentage(item?.responseCompliancePercentage)}</span></td>
                                                <td><span className={resolutionTone}>{formatPercentage(item?.resolutionCompliancePercentage)}</span></td>
                                                <td>{(Number(item?.averageResponseHours) || 0).toFixed(1)}</td>
                                                <td>{(Number(item?.averageResolutionHours) || 0).toFixed(1)}</td>
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

export default SlaComplianceReport;
