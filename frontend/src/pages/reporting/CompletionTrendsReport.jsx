import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FaArrowLeft,
    FaChartLine,
    FaFilter,
    FaCalendarAlt,
    FaClock
} from 'react-icons/fa';
import api from '../../api/api.js';
import { toast } from 'react-toastify';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import './ReportingStyles.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const defaultFilters = {
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 12)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    aggregationLevel: 'MONTHLY'
};

const aggregationLabels = {
    DAILY: 'Daily',
    WEEKLY: 'Weekly',
    MONTHLY: 'Monthly'
};

const formatDate = (value) => {
    if (!value) return '—';
    return new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    }).format(new Date(value));
};

const CompletionTrendsReport = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(null);
    const [filters, setFilters] = useState(defaultFilters);

    useEffect(() => {
        let isMounted = true;
        const load = async () => {
            setLoading(true);
            try {
                const response = await api.get('/reports/operations/project-completion-trend', { params: filters });
                if (isMounted) {
                    setData(response.data || null);
                }
            } catch (error) {
                if (isMounted) {
                    toast.error('Failed to load completion trends');
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

    const dataPoints = data?.dataPoints ?? [];

    const totalCompleted = useMemo(() => dataPoints.reduce((sum, point) => sum + (Number(point?.count) || 0), 0), [dataPoints]);
    const periodsTracked = dataPoints.length;
    const averagePerPeriod = periodsTracked > 0 ? totalCompleted / periodsTracked : 0;
    const peakPeriod = useMemo(() => dataPoints.reduce((peak, point) => {
        if (!point) return peak;
        if (!peak || (Number(point.count) || 0) > (Number(peak.count) || 0)) {
            return point;
        }
        return peak;
    }, null), [dataPoints]);

    const metrics = [
        { label: 'Total Completed', value: totalCompleted.toLocaleString(), accent: 'green' },
        { label: 'Average / Period', value: averagePerPeriod.toFixed(1), accent: 'blue' },
        { label: 'Peak Period', value: peakPeriod ? peakPeriod.period : '—', accent: 'purple' },
        { label: 'Peak Completions', value: peakPeriod ? Number(peakPeriod.count || 0).toLocaleString() : '—', accent: 'gold' }
    ];

    const chartData = useMemo(() => ({
        labels: dataPoints.map((point) => point.period),
        datasets: [
            {
                label: 'Completed Projects',
                data: dataPoints.map((point) => Number(point?.count) || 0),
                borderColor: 'rgba(16, 185, 129, 1)',
                backgroundColor: 'rgba(16, 185, 129, 0.18)',
                tension: 0.35,
                fill: true,
                pointRadius: 5,
                pointBackgroundColor: '#ffffff',
                pointBorderWidth: 2
            }
        ]
    }), [dataPoints]);

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            mode: 'index',
            intersect: false
        },
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
                    label: (context) => `Completed: ${context.formattedValue}`
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    stepSize: Math.max(1, Math.ceil(totalCompleted / Math.max(periodsTracked, 1))),
                    precision: 0
                }
            },
            x: {
                grid: {
                    display: false
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
                <p className="reporting-back__title">Operations • Completion Trends</p>
            </div>

            <div className="reporting-banner reporting-banner--compact" data-animate="fade-up" data-delay="0.04">
                <div className="reporting-banner__content">
                    <div className="reporting-banner__info">
                        <span className="reporting-banner__eyebrow">
                            <FaChartLine /> Delivery Momentum
                        </span>
                        <h1 className="reporting-banner__title">Project Completion Trends</h1>
                        <p className="reporting-banner__subtitle">
                            Visualise completion velocity across projects and spot periods of acceleration or slowdown. Use the aggregation controls to zoom in on specific time horizons.
                        </p>
                    </div>
                </div>

                <div className="reporting-banner__meta">
                    <div className="reporting-banner__meta-item">
                        <div className="reporting-banner__meta-icon reporting-banner__meta-icon--blue">
                            <FaCalendarAlt />
                        </div>
                        <div className="reporting-banner__meta-content">
                            <span className="reporting-banner__meta-label">Tracking Window</span>
                            <span className="reporting-banner__meta-value">{`${formatDate(filters.startDate)} → ${formatDate(filters.endDate)}`}</span>
                        </div>
                    </div>
                    <div className="reporting-banner__meta-item">
                        <div className="reporting-banner__meta-icon reporting-banner__meta-icon--purple">
                            <FaFilter />
                        </div>
                        <div className="reporting-banner__meta-content">
                            <span className="reporting-banner__meta-label">Aggregation</span>
                            <span className="reporting-banner__meta-value">{aggregationLabels[filters.aggregationLevel]}</span>
                        </div>
                    </div>
                    <div className="reporting-banner__meta-item">
                        <div className="reporting-banner__meta-icon reporting-banner__meta-icon--green">
                            <FaChartLine />
                        </div>
                        <div className="reporting-banner__meta-content">
                            <span className="reporting-banner__meta-label">Data Points</span>
                            <span className="reporting-banner__meta-value">{periodsTracked}</span>
                        </div>
                    </div>
                    <div className="reporting-banner__meta-item">
                        <div className="reporting-banner__meta-icon reporting-banner__meta-icon--gold">
                            <FaClock />
                        </div>
                        <div className="reporting-banner__meta-content">
                            <span className="reporting-banner__meta-label">Last Refreshed</span>
                            <span className="reporting-banner__meta-value">{new Date().toLocaleDateString()}</span>
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
                        <label className="reporting-form-label" htmlFor="completion-start-date">Start Date</label>
                        <input
                            id="completion-start-date"
                            type="date"
                            name="startDate"
                            value={filters.startDate}
                            onChange={handleFilterChange}
                            className="reporting-input"
                        />
                    </div>
                    <div className="reporting-form-group">
                        <label className="reporting-form-label" htmlFor="completion-end-date">End Date</label>
                        <input
                            id="completion-end-date"
                            type="date"
                            name="endDate"
                            value={filters.endDate}
                            onChange={handleFilterChange}
                            className="reporting-input"
                        />
                    </div>
                    <div className="reporting-form-group">
                        <label className="reporting-form-label" htmlFor="completion-aggregation">Aggregation</label>
                        <select
                            id="completion-aggregation"
                            name="aggregationLevel"
                            value={filters.aggregationLevel}
                            onChange={handleFilterChange}
                            className="reporting-select"
                        >
                            {Object.entries(aggregationLabels).map(([value, label]) => (
                                <option key={value} value={value}>{label}</option>
                            ))}
                        </select>
                    </div>
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
                        <h2 className="reporting-card__title">Completion Velocity</h2>
                        <p className="reporting-card__subtitle">Charting the number of projects completed per {aggregationLabels[filters.aggregationLevel].toLowerCase()} interval.</p>
                    </div>
                    <span className="reporting-badge reporting-badge--info">{aggregationLabels[filters.aggregationLevel]}</span>
                </div>

                <div className="reporting-card__content">
                    {loading ? (
                        <div className="reporting-loading">
                            <div className="reporting-spinner" />
                            <p className="reporting-card__subtitle">Loading trend analysis…</p>
                        </div>
                    ) : dataPoints.length === 0 ? (
                        <div className="reporting-empty-state">
                            No completion activity recorded for the selected period.
                        </div>
                    ) : (
                        <div className="reporting-chart">
                            <Line data={chartData} options={chartOptions} />
                        </div>
                    )}
                </div>
            </div>

            <div className="reporting-card" data-animate="fade-up" data-delay="0.2">
                <div className="reporting-card__header">
                    <div>
                        <h2 className="reporting-card__title">Period Insights</h2>
                        <p className="reporting-card__subtitle">Detailed breakdown of completions by reporting interval.</p>
                    </div>
                </div>

                <div className="reporting-card__content">
                    {loading ? (
                        <div className="reporting-loading">
                            <div className="reporting-spinner" />
                            <p className="reporting-card__subtitle">Preparing period data…</p>
                        </div>
                    ) : dataPoints.length === 0 ? (
                        <div className="reporting-empty-state">
                            Adjust the filters to see completion activity details.
                        </div>
                    ) : (
                        <div className="reporting-table-container">
                            <table className="reporting-table">
                                <thead>
                                    <tr>
                                        <th>Period</th>
                                        <th>Completed Projects</th>
                                        <th>Δ vs Previous</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {dataPoints.map((point, index) => {
                                        const currentCount = Number(point?.count) || 0;
                                        const previousCount = Number(dataPoints[index - 1]?.count) || 0;
                                        const delta = index === 0 ? 0 : currentCount - previousCount;
                                        const deltaClass = delta >= 0 ? 'reporting-text--positive' : 'reporting-text--negative';

                                        return (
                                            <tr key={point.period || index}>
                                                <td>{point.period}</td>
                                                <td>{currentCount.toLocaleString()}</td>
                                                <td>
                                                    <span className={delta === 0 ? '' : deltaClass}>
                                                        {delta > 0 ? `+${delta}` : delta}
                                                    </span>
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

export default CompletionTrendsReport;
