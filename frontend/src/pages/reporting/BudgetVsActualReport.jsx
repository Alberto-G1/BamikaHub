import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaDollarSign, FaFilter, FaChartLine, FaClipboardList, FaExclamationTriangle } from 'react-icons/fa';
import api from '../../api/api.js';
import { toast } from 'react-toastify';
import './ReportingStyles.css';

const defaultFilters = {
    startDate: '',
    endDate: '',
    projectId: '',
    status: ''
};

const statusToneMap = {
    UNDER_BUDGET: 'success',
    ON_BUDGET: 'info',
    OVER_BUDGET: 'danger'
};

const sanitiseFilters = (filters) => (
    Object.fromEntries(
        Object.entries(filters).filter(([, value]) => value !== '' && value !== null && value !== undefined)
    )
);

const formatCurrency = (amount) => {
    const numericValue = Number.isFinite(amount) ? amount : Number(amount);
    const safeValue = Number.isFinite(numericValue) ? numericValue : 0;
    return new Intl.NumberFormat('en-UG', {
        style: 'currency',
        currency: 'UGX',
        maximumFractionDigits: 0
    }).format(safeValue);
};

const formatPercentage = (value) => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
        return '—';
    }
    return `${Number(value).toFixed(1)}%`;
};

const BudgetVsActualReport = () => {
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
                const response = await api.get('/reports/finance/budget-vs-actual', { params });
                if (isMounted) {
                    const payload = Array.isArray(response.data) ? response.data : [];
                    setData(payload);
                }
            } catch (error) {
                if (isMounted) {
                    toast.error('Failed to load budget vs actual data');
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

    const totals = useMemo(() => data.reduce((acc, item) => ({
        budgeted: acc.budgeted + (Number(item?.budgetedCost) || 0),
        actual: acc.actual + (Number(item?.actualCost) || 0),
        variance: acc.variance + (Number(item?.variance) || 0)
    }), { budgeted: 0, actual: 0, variance: 0 }), [data]);

    const statusBreakdown = useMemo(() => data.reduce((acc, item) => {
        const key = item?.status;
        if (!key) {
            return acc;
        }
        acc[key] = (acc[key] || 0) + 1;
        return acc;
    }, {}), [data]);

    const varianceAccent = totals.variance >= 0 ? 'green' : 'red';
    const varianceLabel = totals.variance >= 0 ? 'Favourable Variance' : 'Variance Shortfall';

    const metrics = [
        {
            label: 'Projects Analysed',
            value: data.length.toLocaleString(),
            accent: 'purple'
        },
        {
            label: 'Total Budgeted',
            value: formatCurrency(totals.budgeted),
            accent: 'blue'
        },
        {
            label: 'Total Actual',
            value: formatCurrency(totals.actual),
            accent: 'gold'
        },
        {
            label: varianceLabel,
            value: formatCurrency(totals.variance),
            accent: varianceAccent
        }
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
                <p className="reporting-back__title">Finance • Budget vs Actual</p>
            </div>

            <div className="reporting-banner reporting-banner--compact" data-animate="fade-up" data-delay="0.04">
                <div className="reporting-banner__content">
                    <div className="reporting-banner__info">
                        <span className="reporting-banner__eyebrow">
                            <FaDollarSign /> Financial Insight
                        </span>
                        <h1 className="reporting-banner__title">Budget vs Actual Cost Analysis</h1>
                        <p className="reporting-banner__subtitle">
                            Monitor how project spending tracks against planned budgets. Surface variance drivers quickly and highlight opportunities to re-allocate funds.
                        </p>
                    </div>
                </div>

                <div className="reporting-banner__meta">
                    <div className="reporting-banner__meta-item">
                        <div className="reporting-banner__meta-icon reporting-banner__meta-icon--blue">
                            <FaClipboardList />
                        </div>
                        <div className="reporting-banner__meta-content">
                            <span className="reporting-banner__meta-label">Projects Analysed</span>
                            <span className="reporting-banner__meta-value">{data.length}</span>
                        </div>
                    </div>
                    <div className="reporting-banner__meta-item">
                        <div className="reporting-banner__meta-icon reporting-banner__meta-icon--green">
                            <FaChartLine />
                        </div>
                        <div className="reporting-banner__meta-content">
                            <span className="reporting-banner__meta-label">Under Budget</span>
                            <span className="reporting-banner__meta-value">{statusBreakdown.UNDER_BUDGET || 0}</span>
                        </div>
                    </div>
                    <div className="reporting-banner__meta-item">
                        <div className="reporting-banner__meta-icon reporting-banner__meta-icon--purple">
                            <FaChartLine />
                        </div>
                        <div className="reporting-banner__meta-content">
                            <span className="reporting-banner__meta-label">On Budget</span>
                            <span className="reporting-banner__meta-value">{statusBreakdown.ON_BUDGET || 0}</span>
                        </div>
                    </div>
                    <div className="reporting-banner__meta-item">
                        <div className="reporting-banner__meta-icon reporting-banner__meta-icon--red">
                            <FaExclamationTriangle />
                        </div>
                        <div className="reporting-banner__meta-content">
                            <span className="reporting-banner__meta-label">Over Budget</span>
                            <span className="reporting-banner__meta-value">{statusBreakdown.OVER_BUDGET || 0}</span>
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
                        <label className="reporting-form-label" htmlFor="budget-start-date">Start Date</label>
                        <input
                            id="budget-start-date"
                            type="date"
                            name="startDate"
                            value={filters.startDate}
                            onChange={handleFilterChange}
                            className="reporting-input"
                        />
                    </div>
                    <div className="reporting-form-group">
                        <label className="reporting-form-label" htmlFor="budget-end-date">End Date</label>
                        <input
                            id="budget-end-date"
                            type="date"
                            name="endDate"
                            value={filters.endDate}
                            onChange={handleFilterChange}
                            className="reporting-input"
                        />
                    </div>
                    <div className="reporting-form-group">
                        <label className="reporting-form-label" htmlFor="budget-project-id">Project ID</label>
                        <input
                            id="budget-project-id"
                            type="text"
                            name="projectId"
                            value={filters.projectId}
                            onChange={handleFilterChange}
                            placeholder="e.g. PRJ-0021"
                            className="reporting-input"
                        />
                    </div>
                    <div className="reporting-form-group">
                        <label className="reporting-form-label" htmlFor="budget-status">Status</label>
                        <select
                            id="budget-status"
                            name="status"
                            value={filters.status}
                            onChange={handleFilterChange}
                            className="reporting-select"
                        >
                            <option value="">All</option>
                            <option value="PLANNING">Planning</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="CANCELLED">Cancelled</option>
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

            <div className="reporting-card" data-animate="fade-up" data-delay="0.16">
                <div className="reporting-card__header">
                    <div>
                        <h2 className="reporting-card__title">Budget Performance Breakdown</h2>
                        <p className="reporting-card__subtitle">Detailed comparison of budgeted and actual costs for monitored projects.</p>
                    </div>
                    <span className="reporting-badge reporting-badge--info">{data.length} Records</span>
                </div>

                <div className="reporting-card__content">
                    {loading ? (
                        <div className="reporting-loading">
                            <div className="reporting-spinner" />
                            <p className="reporting-card__subtitle">Loading budget insights…</p>
                        </div>
                    ) : data.length === 0 ? (
                        <div className="reporting-empty-state">
                            No budget performance data found for the selected filters.
                        </div>
                    ) : (
                        <div className="reporting-table-container">
                            <table className="reporting-table">
                                <thead>
                                    <tr>
                                        <th>Project</th>
                                        <th>Budgeted Cost</th>
                                        <th>Actual Cost</th>
                                        <th>Variance</th>
                                        <th>Variance %</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.map((item) => {
                                        const varianceValue = Number(item?.variance) || 0;
                                        const varianceClass = varianceValue >= 0 ? 'reporting-text--positive' : 'reporting-text--negative';
                                        const variancePercentageClass = (Number(item?.variancePercentage) || 0) >= 0
                                            ? 'reporting-text--positive'
                                            : 'reporting-text--negative';

                                        return (
                                            <tr key={item.projectId || item.projectName}>
                                                <td>{item.projectName}</td>
                                                <td>{formatCurrency(item.budgetedCost)}</td>
                                                <td>{formatCurrency(item.actualCost)}</td>
                                                <td><span className={varianceClass}>{formatCurrency(varianceValue)}</span></td>
                                                <td><span className={variancePercentageClass}>{formatPercentage(item?.variancePercentage)}</span></td>
                                                <td>{getStatusBadge(item.status)}</td>
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

export default BudgetVsActualReport;
