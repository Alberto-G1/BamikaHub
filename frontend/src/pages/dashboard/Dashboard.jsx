import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { 
    FaBoxes, 
    FaExclamationTriangle, 
    FaProjectDiagram, 
    FaUsers, 
    FaUserClock, 
    FaTruck,
    FaChartLine,
    FaChartBar,
    FaChartPie,
    FaTable,
    FaArrowUp,
    FaArrowDown,
    FaDollarSign
} from 'react-icons/fa';
import api from '../../api/api.js';
import { toast } from 'react-toastify';
import SkeletonLoader from '../../components/common/SkeletonLoader.jsx';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, PointElement, LineElement, Filler } from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import './Dashboard.css';

// Register the components you will use from Chart.js
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, PointElement, LineElement, Filler);

/**
 * Dashboard Component
 * 
 * Main dashboard page displaying real-time summary of engineering operations.
 * 
 * Features:
 * - KPI Cards: Total Stock Value, Low Stock Items, Pending User Approvals
 * - Charts: Projects by Status (Bar), Inventory Value by Category (Doughnut)
 * - Table: Top Field Report Activity by project and site
 * 
 * Styling:
 * - Growth-themed colors (Green #10B981, Gold #D6A329, Sky Blue #46C1EB)
 * - Smooth animations with staggered entrance effects
 * - Responsive grid layout (mobile, tablet, desktop)
 * - Dark/light theme support
 * 
 * API Endpoints:
 * - GET /dashboard/summary - Summary statistics for KPI cards
 * - GET /reports/dashboard-charts - Chart data (inventory, projects, field reports)
 * 
 * Dependencies:
 * - Chart.js & react-chartjs-2 for data visualization
 * - React Icons for card icons
 * 
 * @component
 * @example
 * // Used in main routing:
 * <Route path="/dashboard" element={<Dashboard />} />
 */

// Reusable currency formatter for Ugandan Shillings (UGX)
const formatCurrency = (amount) => {
    if (amount === null || amount === undefined || isNaN(amount)) return 'USh 0';
    return new Intl.NumberFormat('en-UG', {
        style: 'currency',
        currency: 'UGX',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};

const Dashboard = () => {
    const { user, hasPermission } = useAuth();
    const [summaryData, setSummaryData] = useState(null);
    const [chartData, setChartData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [financeTrend, setFinanceTrend] = useState(null);
    const [stockOutSummary, setStockOutSummary] = useState(null);
    const [limitedView, setLimitedView] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [myTickets, setMyTickets] = useState(null);
    const [assignments, setAssignments] = useState(null);
    const [personalLoading, setPersonalLoading] = useState(false);

    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true);
            try {
                // Fetch both summary cards and chart data in parallel for performance
                const [summaryRes, chartsRes, trendRes, stockOutRes] = await Promise.all([
                    api.get('/dashboard/summary'),
                    api.get('/reports/dashboard-charts'),
                    api.get('/reports/finance/performance-trend?aggregationLevel=MONTHLY'),
                    api.get('/reports/inventory/stock-out-revenue')
                ]);
                setSummaryData(summaryRes.data);
                setChartData(chartsRes.data);
                setFinanceTrend(trendRes.data);
                setStockOutSummary(stockOutRes.data);
            } catch (error) {
                // If it's an authorization / permission issue for this endpoint (non-admin users),
                // don't show a global error toast. Instead switch to a limited dashboard view
                // and load lighter-weight, user-specific info such as recent notifications.
                const status = error?.response?.status;
                // Treat 401/403 as permission-limited. Also treat 400 from certain
                // reporting endpoints as a non-fatal 'limited view' (some users
                // experience 400 for finance endpoints when filters/permissions differ).
                if (status === 401 || status === 403 || status === 400) {
                    setLimitedView(true);
                    try {
                        setPersonalLoading(true);

                        // Use consolidated personal summary endpoint for efficiency
                        const summaryRes = await api.get('/dashboard/personal-summary', { params: { page: 0, size: 5 } });
                        const summary = summaryRes?.data || {};

                        const notifData = Array.isArray(summary.notifications)
                            ? summary.notifications
                            : [];
                        const ticketData = Array.isArray(summary.tickets)
                            ? summary.tickets
                            : [];
                        const assignmentData = Array.isArray(summary.assignments)
                            ? summary.assignments
                            : [];

                        setNotifications(notifData);
                        setMyTickets(ticketData);
                        setAssignments(assignmentData);
                    } catch (pErr) {
                        // Fallback to best-effort individual fetches if consolidated endpoint is unavailable
                        console.warn('Personal summary endpoint failed, falling back to individual fetches', pErr);
                        try {
                            const notifRes = await api.get('/notifications', { params: { page: 0, size: 5 } });
                            const notifData = Array.isArray(notifRes.data?.content) ? notifRes.data.content : (Array.isArray(notifRes.data) ? notifRes.data : []);
                            setNotifications(notifData);
                        } catch (nerr) {
                            console.error('Failed to load notifications for limited dashboard view', nerr);
                        }

                        try {
                            const tRes = await api.get('/support/tickets', { params: { submittedById: user?.id || user?.userId, page: 0, size: 5 } });
                            const tickets = Array.isArray(tRes.data?.content) ? tRes.data.content : (Array.isArray(tRes.data) ? tRes.data : []);
                            setMyTickets(tickets);
                        } catch (tErr) {
                            // ignore
                        }

                        try {
                            const aRes = await api.get('/assignments/my-assignments');
                            const assigns = Array.isArray(aRes.data) ? aRes.data : (Array.isArray(aRes.data?.content) ? aRes.data.content : []);
                            setAssignments(assigns.slice ? assigns.slice(0,5) : assigns);
                        } catch (aErr) {
                            // ignore
                        }
                    } finally {
                        setPersonalLoading(false);
                    }
                } else if (!error?.response) {
                    // Network error or no response from server
                    toast.error('Network error: Failed to reach dashboard API.');
                } else if (status >= 500) {
                    // Real server error
                    toast.error('Failed to load dashboard data. Server error occurred.');
                } else {
                    // Other non-permission errors: show a generic message
                    toast.error('Failed to load dashboard data.');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const inventoryChartData = useMemo(() => {
        if (!chartData || !chartData.inventoryValueByCategory) return { labels: [], datasets: [] };
        return {
            labels: chartData.inventoryValueByCategory.map(c => c.categoryName),
            datasets: [{
                label: 'Stock Value (UGX)',
                data: chartData.inventoryValueByCategory.map(c => c.totalValue),
                backgroundColor: [
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(245, 158, 11, 0.8)',
                    'rgba(16, 185, 129, 0.8)',
                    'rgba(147, 51, 234, 0.8)',
                    'rgba(239, 68, 68, 0.8)',
                    'rgba(139, 92, 246, 0.8)',
                    'rgba(14, 165, 233, 0.8)'
                ],
                borderColor: '#ffffff',
                borderWidth: 2,
            }],
        };
    }, [chartData]);

    const projectChartData = useMemo(() => {
        if (!chartData || !chartData.projectsByStatus) return { labels: [], datasets: [] };
        return {
            labels: chartData.projectsByStatus.map(p => p.status.replace(/_/g, ' ')),
            datasets: [{
                label: '# of Projects',
                data: chartData.projectsByStatus.map(p => p.count),
                backgroundColor: 'rgba(59, 130, 246, 0.7)',
                borderColor: 'rgba(59, 130, 246, 1)',
                borderWidth: 2,
                borderRadius: 8,
            }],
        };
    }, [chartData]);

    const financeLineData = useMemo(() => {
        if (!financeTrend || !financeTrend.dataPoints) return { labels: [], datasets: [] };
        const labels = financeTrend.dataPoints.map(p => p.period);
        const revenue = financeTrend.dataPoints.map(p => p.revenue || 0);
        const expenditure = financeTrend.dataPoints.map(p => p.expenditure || 0);
        const net = financeTrend.dataPoints.map(p => p.net || 0);
        return {
            labels,
            datasets: [
                {
                    label: 'Revenue',
                    data: revenue,
                    borderColor: 'rgb(16, 185, 129)',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    fill: true,
                    tension: 0.4,
                    borderWidth: 3,
                },
                {
                    label: 'Expenditure',
                    data: expenditure,
                    borderColor: 'rgb(239, 68, 68)',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    fill: true,
                    tension: 0.4,
                    borderWidth: 3,
                },
                {
                    label: 'Net',
                    data: net,
                    borderColor: 'rgb(59, 130, 246)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    fill: false,
                    tension: 0.4,
                    borderWidth: 3,
                    borderDash: [5, 5],
                }
            ]
        };
    }, [financeTrend]);

    const fieldReportLeaders = useMemo(() => {
        if (!chartData || !chartData.fieldReportsBySite) return [];
        return chartData.fieldReportsBySite;
    }, [chartData]);

    if (loading) {
        return (
            <section className="reporting-page">
                <div className="reporting-loading">
                    <div className="reporting-spinner" />
                    <p className="reporting-card__subtitle">Loading dashboard data...</p>
                </div>
            </section>
        );
    }

    // Determine if the current user likely has access to full dashboard data
    const canViewFullDashboard = typeof hasPermission === 'function' ? (
        hasPermission('FINANCE_READ') || hasPermission('ITEM_READ') || hasPermission('PROJECT_READ')
    ) : false;

    // Welcome banner (shown to all users). The quick stat cards are only shown
    // when the user can view the full dashboard and summary/chart data is present.
    const WelcomeBanner = (
        <>
            {/* Welcome Banner */}
            <div className="reporting-banner reporting-banner--compact" data-animate="fade-up" data-delay="0.04">
                <div className="reporting-banner__content">
                    <div className="reporting-banner__info">
                        <span className="reporting-banner__eyebrow">
                            <FaChartLine /> Operational Overview
                        </span>
                        <h1 className="reporting-banner__title">
                            Welcome back, {user ? user.email.split('@')[0] : 'Guest'}!
                        </h1>
                        <p className="reporting-banner__subtitle">
                            Real-time summary of your engineering operations and performance metrics
                        </p>
                    </div>
                </div>

                {/* Quick Stats: only visible to users with dashboard access and data */}
                {canViewFullDashboard && summaryData && chartData && (
                    <div className="reporting-banner__meta">
                        <div className="reporting-banner__meta-item">
                            <div className="reporting-banner__meta-icon reporting-banner__meta-icon--blue">
                                <FaBoxes />
                            </div>
                            <div className="reporting-banner__meta-content">
                                <span className="reporting-banner__meta-label">Total Stock Value</span>
                                <span className="reporting-banner__meta-value">
                                    {formatCurrency(summaryData.totalStockValue)}
                                </span>
                            </div>
                        </div>
                        <div className="reporting-banner__meta-item">
                            <div className="reporting-banner__meta-icon reporting-banner__meta-icon--green">
                                <FaProjectDiagram />
                            </div>
                            <div className="reporting-banner__meta-content">
                                <span className="reporting-banner__meta-label">Active Projects</span>
                                <span className="reporting-banner__meta-value">
                                    {chartData.projectsByStatus?.find(p => p.status === 'IN_PROGRESS')?.count || 0}
                                </span>
                            </div>
                        </div>
                        <div className="reporting-banner__meta-item">
                            <div className="reporting-banner__meta-icon reporting-banner__meta-icon--purple">
                                <FaUsers />
                            </div>
                            <div className="reporting-banner__meta-content">
                                <span className="reporting-banner__meta-label">Team Members</span>
                                <span className="reporting-banner__meta-value">
                                    {summaryData.totalUsers || 0}
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );

    if (!summaryData || !chartData) {
        // If we already detected limitedView via 401/403, or the user is authenticated
        // but lacks dashboard-related permissions, show the limited dashboard instead
            if (limitedView || (user && !canViewFullDashboard)) {
            // Render a simplified dashboard for non-admin users where the main
            // admin summary endpoints are not available. Show profile, recent
            // notifications and helpful quick links.
            return (
                <section className="reporting-page dashboard-page">
                    <div className="reporting-back" data-animate="fade-up">
                        <p className="reporting-back__title">Dashboard • Overview</p>
                    </div>

                    {WelcomeBanner}

                    <div className="reporting-card" data-animate="fade-up">
                        <div className="reporting-card__header">
                            <h2 className="reporting-card__title"><FaChartLine /> Your Dashboard</h2>
                            <p className="reporting-card__subtitle">A personalized view — limited by your permissions</p>
                        </div>
                        <div className="reporting-card__content">
                            <div className="grid-2-up" style={{gap: '1rem'}}>
                                <div className="reporting-card small-card">
                                    <div className="reporting-card__header">
                                        <h3 className="reporting-card__title">Profile</h3>
                                    </div>
                                    <div className="reporting-card__content">
                                        <p><strong>{user?.fullName || user?.email || 'You'}</strong></p>
                                        <p className="reporting-text--muted">Role: {user?.role || user?.roles?.join(', ') || 'User'}</p>
                                        <p className="reporting-text--muted">Email: {user?.email}</p>
                                    </div>
                                </div>

                                <div className="reporting-card small-card">
                                    <div className="reporting-card__header">
                                        <h3 className="reporting-card__title">Recent Notifications</h3>
                                    </div>
                                    <div className="reporting-card__content">
                                        {notifications.length === 0 ? (
                                            <p className="reporting-text--muted">No recent notifications</p>
                                        ) : (
                                            <ul className="notification-list" style={{margin:0,padding:0,listStyle:'none'}}>
                                                {notifications.map((n) => (
                                                    <li key={n.id} style={{padding: '0.5rem 0', borderBottom: '1px solid rgba(0,0,0,0.04)'}}>
                                                        <div className="fw-semibold">{n.title || n.message}</div>
                                                        <small className="reporting-text--muted">{new Date(n.createdAt || n.createdOn || n.date || Date.now()).toLocaleString()}</small>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                        <div style={{marginTop: '0.75rem'}}>
                                            <a href="/notifications" className="reporting-link">View all notifications</a>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid-2-up" style={{gap: '1rem', marginTop: '1rem'}}>
                                <div className="reporting-card small-card">
                                    <div className="reporting-card__header">
                                        <h3 className="reporting-card__title">My Open Tickets</h3>
                                    </div>
                                    <div className="reporting-card__content">
                                        {(!myTickets || myTickets.length === 0) ? (
                                            <p className="reporting-text--muted">You have no open tickets. <a href="/support/new">Create a ticket</a></p>
                                        ) : (
                                            <ul className="personal-list" style={{margin:0,padding:0,listStyle:'none'}}>
                                                {myTickets.map(t => (
                                                    <li key={t.id} className="personal-item">
                                                        <a href={t.link || `/support/tickets/${t.id}`} className="fw-semibold">{t.subject || t.title || `Ticket #${t.id}`}</a>
                                                        <div className="reporting-text--muted small">{t.status || t.state} • {new Date(t.lastUpdated || t.updatedAt || t.updatedOn || Date.now()).toLocaleString()}</div>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                        <div style={{marginTop: '0.75rem'}}>
                                            <a href="/support/tickets" className="reporting-link">View all tickets</a>
                                        </div>
                                    </div>
                                </div>

                                <div className="reporting-card small-card">
                                    <div className="reporting-card__header">
                                        <h3 className="reporting-card__title">Assigned Items</h3>
                                    </div>
                                    <div className="reporting-card__content">
                                        {(!assignments || assignments.length === 0) ? (
                                            <p className="reporting-text--muted">No assigned items.</p>
                                        ) : (
                                            <ul className="personal-list" style={{margin:0,padding:0,listStyle:'none'}}>
                                                {assignments.map(a => (
                                                    <li key={a.itemId || a.id} className="personal-item">
                                                        <div className="fw-semibold">{a.itemName || a.name}</div>
                                                        <div className="reporting-text--muted small">Qty: {a.quantityAssigned || a.quantity || 1} {a.dueDate ? `• due ${new Date(a.dueDate).toLocaleDateString()}` : ''}</div>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                        <div style={{marginTop: '0.75rem'}}>
                                            <a href="/inventory/assignments" className="reporting-link">View all assignments</a>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div style={{marginTop: '1rem'}}>
                                <h4 className="reporting-card__title">Quick Links</h4>
                                <div className="quick-links">
                                    <a className="quick-link outline-primary" href="/support/tickets">
                                        <FaTruck className="quick-link-icon" />
                                        My Support Tickets
                                    </a>
                                    <a className="quick-link outline-secondary" href="/notifications">
                                        <FaUserClock className="quick-link-icon" />
                                        Notifications
                                    </a>
                                    <a className="quick-link outline-info" href="/profile">
                                        <FaUsers className="quick-link-icon" />
                                        My Profile
                                    </a>
                                    <a className="quick-link outline-success" href="/assignments">
                                        <FaProjectDiagram className="quick-link-icon" />
                                        My Assignments
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            );
        }

        // If we reach here, it's a genuine failure to load dashboard for a user who
        // should have access — show the error empty state and a suggestion to retry.
        return (
            <section className="reporting-page">
                {WelcomeBanner}
                <div className="reporting-card">
                    <div className="reporting-empty-state">
                        <FaExclamationTriangle className="empty-icon" />
                        <h3>Unable to Load Dashboard</h3>
                        <p>Could not load dashboard summary. Please try refreshing the page or contact support.</p>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="reporting-page dashboard-page">
            {/* Header */}
            <div className="reporting-back" data-animate="fade-up">
                <p className="reporting-back__title">Dashboard • Overview</p>
            </div>

            {/* Welcome Banner */}
            <div className="reporting-banner reporting-banner--compact" data-animate="fade-up" data-delay="0.04">
                <div className="reporting-banner__content">
                    <div className="reporting-banner__info">
                        <span className="reporting-banner__eyebrow">
                            <FaChartLine /> Operational Overview
                        </span>
                        <h1 className="reporting-banner__title">
                            Welcome back, {user ? user.email.split('@')[0] : 'Guest'}!
                        </h1>
                        <p className="reporting-banner__subtitle">
                            Real-time summary of your engineering operations and performance metrics
                        </p>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="reporting-banner__meta">
                    <div className="reporting-banner__meta-item">
                        <div className="reporting-banner__meta-icon reporting-banner__meta-icon--blue">
                            <FaBoxes />
                        </div>
                        <div className="reporting-banner__meta-content">
                            <span className="reporting-banner__meta-label">Total Stock Value</span>
                            <span className="reporting-banner__meta-value">
                                {formatCurrency(summaryData.totalStockValue)}
                            </span>
                        </div>
                    </div>
                    <div className="reporting-banner__meta-item">
                        <div className="reporting-banner__meta-icon reporting-banner__meta-icon--green">
                            <FaProjectDiagram />
                        </div>
                        <div className="reporting-banner__meta-content">
                            <span className="reporting-banner__meta-label">Active Projects</span>
                            <span className="reporting-banner__meta-value">
                                {chartData.projectsByStatus?.find(p => p.status === 'IN_PROGRESS')?.count || 0}
                            </span>
                        </div>
                    </div>
                    <div className="reporting-banner__meta-item">
                        <div className="reporting-banner__meta-icon reporting-banner__meta-icon--purple">
                            <FaUsers />
                        </div>
                        <div className="reporting-banner__meta-content">
                            <span className="reporting-banner__meta-label">Team Members</span>
                            <span className="reporting-banner__meta-value">
                                {summaryData.totalUsers || 0}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* KPI Metrics Grid */}
            <div className="dashboard-metrics-grid" data-animate="fade-up" data-delay="0.08">
                {/* Total Stock Value */}
                <div className="reporting-metric reporting-metric--blue">
                    <div className="metric-header">
                        <FaBoxes className="metric-icon" />
                        <span className="metric-label">Total Stock Value</span>
                    </div>
                    <div className="metric-value">{formatCurrency(summaryData.totalStockValue)}</div>
                    <div className="metric-trend positive">
                        <FaArrowUp /> Stable
                    </div>
                </div>

                {/* Low Stock Items */}
                <div className="reporting-metric reporting-metric--red">
                    <div className="metric-header">
                        <FaExclamationTriangle className="metric-icon" />
                        <span className="metric-label">Low Stock Items</span>
                    </div>
                    <div className="metric-value">{summaryData.lowStockItems}</div>
                    <div className="metric-trend warning">
                        <FaExclamationTriangle /> Needs Attention
                    </div>
                </div>

                {/* Pending User Approvals */}
                <div className="reporting-metric reporting-metric--gold">
                    <div className="metric-header">
                        <FaUserClock className="metric-icon" />
                        <span className="metric-label">Pending Approvals</span>
                    </div>
                    <div className="metric-value">{summaryData.pendingUsers}</div>
                    <div className="metric-trend neutral">
                        <FaUserClock /> Awaiting Action
                    </div>
                </div>

                {/* Additional Stock Metrics */}
                {stockOutSummary && (hasPermission ? (typeof hasPermission === 'function' ? hasPermission('FINANCE_READ') || hasPermission('ITEM_READ') : true) : true) && (
                    <>
                        <div className="reporting-metric reporting-metric--green">
                            <div className="metric-header">
                                <FaTruck className="metric-icon" />
                                <span className="metric-label">Stock-Out Revenue</span>
                            </div>
                            <div className="metric-value">{formatCurrency(stockOutSummary.totalRevenue)}</div>
                            <div className="metric-trend positive">
                                <FaArrowUp /> Active
                            </div>
                        </div>

                        <div className="reporting-metric reporting-metric--purple">
                            <div className="metric-header">
                                <FaBoxes className="metric-icon" />
                                <span className="metric-label">Items Taken Out</span>
                            </div>
                            <div className="metric-value">{stockOutSummary.totalQuantityOut}</div>
                            <div className="metric-trend positive">
                                <FaArrowUp /> Movement
                            </div>
                        </div>

                        <div className="reporting-metric reporting-metric--blue">
                            <div className="metric-header">
                                <FaDollarSign className="metric-icon" />
                                <span className="metric-label">Gross Margin</span>
                            </div>
                            <div className="metric-value">{formatCurrency(stockOutSummary.totalMargin)}</div>
                            <div className="metric-trend positive">
                                <FaArrowUp /> Profitable
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Charts Section */}
            <div className="dashboard-charts-grid" data-animate="fade-up" data-delay="0.12">
                {/* Projects by Status */}
                <div className="reporting-card chart-card">
                    <div className="reporting-card__header">
                        <h2 className="reporting-card__title">
                            <FaChartBar /> Projects by Status
                        </h2>
                        <p className="reporting-card__subtitle">Current distribution of project progress</p>
                    </div>
                    <div className="reporting-card__content">
                        <div className="chart-container">
                            <Bar 
                                data={projectChartData} 
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: {
                                        legend: {
                                            display: false
                                        },
                                        tooltip: {
                                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                            titleColor: '#ffffff',
                                            bodyColor: '#ffffff'
                                        }
                                    },
                                    scales: {
                                        y: {
                                            beginAtZero: true,
                                            grid: {
                                                color: 'rgba(0, 0, 0, 0.1)'
                                            }
                                        },
                                        x: {
                                            grid: {
                                                display: false
                                            }
                                        }
                                    }
                                }} 
                            />
                        </div>
                    </div>
                </div>

                {/* Inventory by Category */}
                <div className="reporting-card chart-card">
                    <div className="reporting-card__header">
                        <h2 className="reporting-card__title">
                            <FaChartPie /> Inventory Value by Category
                        </h2>
                        <p className="reporting-card__subtitle">Breakdown of stock value across categories</p>
                    </div>
                    <div className="reporting-card__content">
                        <div className="chart-container">
                            <Doughnut 
                                data={inventoryChartData} 
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: {
                                        legend: {
                                            position: 'bottom',
                                            labels: {
                                                padding: 20,
                                                usePointStyle: true
                                            }
                                        },
                                        tooltip: {
                                            callbacks: {
                                                label: function(context) {
                                                    const value = context.parsed;
                                                    return ` ${context.label}: ${formatCurrency(value)}`;
                                                }
                                            }
                                        }
                                    }
                                }} 
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Finance Performance Chart */}
            {financeTrend && (
                <div className="reporting-card" data-animate="fade-up" data-delay="0.16">
                    <div className="reporting-card__header">
                        <h2 className="reporting-card__title">
                            <FaChartLine /> Finance Performance Trend
                        </h2>
                        <p className="reporting-card__subtitle">Monthly revenue, expenditure, and net performance</p>
                    </div>
                    <div className="reporting-card__content">
                        <div className="chart-container-large">
                            <Line 
                                data={financeLineData} 
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: {
                                        legend: {
                                            position: 'top',
                                            labels: {
                                                usePointStyle: true,
                                                padding: 20
                                            }
                                        },
                                        tooltip: {
                                            mode: 'index',
                                            intersect: false,
                                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                            titleColor: '#ffffff',
                                            bodyColor: '#ffffff'
                                        }
                                    },
                                    scales: {
                                        y: {
                                            beginAtZero: true,
                                            grid: {
                                                color: 'rgba(0, 0, 0, 0.1)'
                                            },
                                            ticks: {
                                                callback: function(value) {
                                                    return formatCurrency(value);
                                                }
                                            }
                                        },
                                        x: {
                                            grid: {
                                                display: false
                                            }
                                        }
                                    },
                                    interaction: {
                                        intersect: false,
                                        mode: 'nearest'
                                    }
                                }} 
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Field Report Activity Table */}
            {fieldReportLeaders.length > 0 && (
                <div className="reporting-card" data-animate="fade-up" data-delay="0.2">
                    <div className="reporting-card__header">
                        <h2 className="reporting-card__title">
                            <FaTable /> Top Field Report Activity
                        </h2>
                        <p className="reporting-card__subtitle">Most active projects and sites by report submissions</p>
                    </div>
                    <div className="reporting-card__content">
                        <div className="reporting-table-container">
                            <table className="reporting-table">
                                <thead>
                                    <tr>
                                        <th>Project</th>
                                        <th>Site</th>
                                        <th className="text-end">Reports Submitted</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {fieldReportLeaders.map((entry, index) => (
                                        <tr key={`${entry.projectId || 'project'}-${entry.siteId || 'all'}-${index}`}>
                                            <td>
                                                <strong>{entry.projectName || 'Unassigned Project'}</strong>
                                            </td>
                                            <td>
                                                {entry.projectLevel ? (
                                                    <span className="reporting-text--muted">Whole Project</span>
                                                ) : (
                                                    <>
                                                        <div className="fw-semibold">{entry.siteName}</div>
                                                        {entry.siteLocation && (
                                                            <div className="reporting-text--muted small">
                                                                {entry.siteLocation}
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                            </td>
                                            <td className="text-end">
                                                <span className="reporting-badge reporting-badge--info">
                                                    {entry.reportCount}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Stock-Out Revenue Table */}
            {stockOutSummary && stockOutSummary.items && stockOutSummary.items.length > 0 && (
                <div className="reporting-card" data-animate="fade-up" data-delay="0.24">
                    <div className="reporting-card__header">
                        <h2 className="reporting-card__title">
                            <FaDollarSign /> Top Items by Stock-Out Revenue
                        </h2>
                        <p className="reporting-card__subtitle">Highest revenue-generating items from stock-outs</p>
                    </div>
                    <div className="reporting-card__content">
                        <div className="reporting-table-container">
                            <table className="reporting-table">
                                <thead>
                                    <tr>
                                        <th>Item</th>
                                        <th>SKU</th>
                                        <th className="text-end">Qty Out</th>
                                        <th className="text-end">Revenue</th>
                                        <th className="text-end">COGS</th>
                                        <th className="text-end">Margin</th>
                                        <th className="text-end">Margin %</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stockOutSummary.items.slice(0, 10).map((it) => (
                                        <tr key={it.itemId}>
                                            <td>
                                                <strong>{it.itemName}</strong>
                                            </td>
                                            <td>
                                                <code className="reporting-text--muted">{it.sku}</code>
                                            </td>
                                            <td className="text-end">
                                                <span className="reporting-badge reporting-badge--neutral">
                                                    {it.quantityOut}
                                                </span>
                                            </td>
                                            <td className="text-end">
                                                <strong>{formatCurrency(it.revenue)}</strong>
                                            </td>
                                            <td className="text-end reporting-text--muted">
                                                {formatCurrency(it.cogs)}
                                            </td>
                                            <td className="text-end">
                                                <span className={`${it.margin >= 0 ? 'reporting-text--positive' : 'reporting-text--negative'}`}>
                                                    {formatCurrency(it.margin)}
                                                </span>
                                            </td>
                                            <td className="text-end">
                                                <span className={`reporting-badge ${it.marginPercentage >= 0 ? 'reporting-badge--success' : 'reporting-badge--danger'}`}>
                                                    {(it.marginPercentage || 0).toFixed(1)}%
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
};

export default Dashboard;