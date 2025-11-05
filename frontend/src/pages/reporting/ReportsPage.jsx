import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FaChartPie,
    FaClipboardList,
    FaProjectDiagram,
    FaMoneyBillWave,
    FaBoxes,
    FaTicketAlt,
    FaClock,
    FaChartLine,
    FaFileInvoiceDollar,
    FaExclamationTriangle,
    FaDollarSign,
    FaWarehouse,
    FaTruck,
    FaChartBar,
    FaCheckCircle
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext.jsx';
import './ReportingStyles.css';

const reportCategories = {
    dashboard: {
        title: 'Dashboard Overview',
        description: 'Real-time KPIs across every business unit in a single glance.',
        icon: FaChartPie,
        accent: 'blue',
        reports: [
            {
                title: 'Executive Dashboard',
                description: 'Real-time KPIs and visualisations across all modules.',
                icon: FaChartPie,
                accent: 'blue',
                path: '/dashboard',
                permission: null,
                badge: 'Quick View'
            }
        ]
    },
    operations: {
        title: 'Operations Reports',
        description: 'Monitor project delivery, completion trends, and operational risks.',
        icon: FaProjectDiagram,
        accent: 'purple',
        reports: [
            {
                title: 'Project Performance',
                description: 'Analyse project status, completion rates, and duration metrics.',
                icon: FaProjectDiagram,
                accent: 'purple',
                path: '/reports/operations/project-performance',
                permission: 'PROJECT_READ',
                badge: 'Trending'
            },
            {
                title: 'Project Delays',
                description: 'Identify overdue projects, blockers, and delay reasons.',
                icon: FaExclamationTriangle,
                accent: 'gold',
                path: '/reports/operations/project-delays',
                permission: 'PROJECT_READ'
            },
            {
                title: 'Completion Trends',
                description: 'Track monthly or weekly completion patterns over time.',
                icon: FaChartLine,
                accent: 'green',
                path: '/reports/operations/completion-trends',
                permission: 'PROJECT_READ',
                badge: 'New'
            }
        ]
    },
    finance: {
        title: 'Finance Reports',
        description: 'Understand expenditure velocity, variances, and requisition status.',
        icon: FaMoneyBillWave,
        accent: 'green',
        reports: [
            {
                title: 'Requisitions by Status',
                description: 'Track pending, approved, and fulfilled requisitions.',
                icon: FaClipboardList,
                accent: 'green',
                path: '/reports/finance/requisitions-status',
                permission: 'FINANCE_READ'
            },
            {
                title: 'Expenditure Trends',
                description: 'View monthly spending analysis and forward forecasts.',
                icon: FaChartLine,
                accent: 'blue',
                path: '/reports/finance/expenditure-trends',
                permission: 'FINANCE_READ',
                badge: 'Trending'
            },
            {
                title: 'Budget vs Actual',
                description: 'Compare budgeted costs against actual spending by project.',
                icon: FaDollarSign,
                accent: 'gold',
                path: '/reports/finance/budget-vs-actual',
                permission: 'FINANCE_READ'
            },
            {
                title: 'Project Costing',
                description: 'Review total estimated material costs per project.',
                icon: FaFileInvoiceDollar,
                accent: 'green',
                path: '/reports/project-costs',
                permission: 'FINANCE_READ'
            }
        ]
    },
    inventory: {
        title: 'Inventory Reports',
        description: 'Balance stock levels, supplier performance, and movement velocity.',
        icon: FaBoxes,
        accent: 'blue',
        reports: [
            {
                title: 'Inventory Valuation',
                description: 'Current stock quantities, prices, and total holding values.',
                icon: FaWarehouse,
                accent: 'blue',
                path: '/reports/inventory-valuation',
                permission: 'ITEM_READ'
            },
            {
                title: 'Stock Movement',
                description: 'Track stock in/out movements and reorder frequency.',
                icon: FaChartBar,
                accent: 'purple',
                path: '/reports/inventory/stock-movement',
                permission: 'ITEM_READ',
                badge: 'New'
            },
            {
                title: 'Supplier Performance',
                description: 'Delivery times, lead accuracy, and reliability insights.',
                icon: FaTruck,
                accent: 'green',
                path: '/reports/inventory/supplier-performance',
                permission: 'ITEM_READ',
                badge: 'Coming Soon'
            }
        ]
    },
    support: {
        title: 'Technical Support',
        description: 'Keep customer promises with SLA visibility and ticket analytics.',
        icon: FaTicketAlt,
        accent: 'red',
        reports: [
            {
                title: 'Support Ticket Summary',
                description: 'Overview of tickets by status, category, and department.',
                icon: FaTicketAlt,
                accent: 'red',
                path: '/reports/support-summary',
                permission: 'TICKET_MANAGE'
            },
            {
                title: 'SLA Compliance',
                description: 'Response and resolution time compliance by priority.',
                icon: FaCheckCircle,
                accent: 'green',
                path: '/reports/support/sla-compliance',
                permission: 'TICKET_MANAGE',
                badge: 'New'
            },
            {
                title: 'Ticket Volume Trends',
                description: 'Historical ticket volume, drivers, and seasonal patterns.',
                icon: FaChartLine,
                accent: 'blue',
                path: '/reports/support/ticket-trends',
                permission: 'TICKET_MANAGE',
                badge: 'New'
            }
        ]
    }
};

const badgeToneMap = {
    New: 'success',
    Trending: 'warning',
    'Quick View': 'info',
    'Coming Soon': 'neutral'
};

const ReportsPage = () => {
    const navigate = useNavigate();
    const { hasPermission } = useAuth();
    const [activeTab, setActiveTab] = useState('dashboard');

    const accessibleReportsByCategory = useMemo(() => {
        return Object.entries(reportCategories).reduce((acc, [key, category]) => {
            acc[key] = category.reports.filter((report) => !report.permission || hasPermission(report.permission));
            return acc;
        }, {});
    }, [hasPermission]);

    const totalAccessibleReports = useMemo(() => (
        Object.values(accessibleReportsByCategory).reduce((sum, list) => sum + list.length, 0)
    ), [accessibleReportsByCategory]);

    const newReportsCount = useMemo(() => (
        Object.values(accessibleReportsByCategory)
            .flat()
            .filter((report) => report.badge === 'New')
            .length
    ), [accessibleReportsByCategory]);

    const highlightedReport = accessibleReportsByCategory[activeTab]?.[0] || null;

    const renderReportCards = (categoryKey) => {
        const reports = accessibleReportsByCategory[categoryKey];
        if (!reports || reports.length === 0) {
            return (
                <div className="reporting-empty-state" data-animate="fade-up" data-delay="0.12">
                    You do not have access to reports in this category yet.
                </div>
            );
        }

        return (
            <div className="reporting-grid" data-animate="fade-up" data-delay="0.12">
                {reports.map((report, index) => {
                    const Icon = report.icon;
                    const badgeTone = badgeToneMap[report.badge];
                    return (
                        <button
                            type="button"
                            key={report.title}
                            className={`reporting-card reporting-card--interactive reporting-report-card reporting-report-card--${report.accent || 'blue'}`}
                            onClick={() => navigate(report.path)}
                            style={{ animationDelay: `${0.05 * index}s` }}
                            data-animate="fade-up"
                        >
                            <div className={`reporting-report-card__icon reporting-report-card__icon--${report.accent || 'blue'}`}>
                                <Icon />
                            </div>
                            <div className="reporting-card__content">
                                <div className="reporting-card__header">
                                    <h3 className="reporting-report-card__title">{report.title}</h3>
                                    {report.badge && (
                                        <span className={`reporting-badge ${badgeTone ? `reporting-badge--${badgeTone}` : ''}`}>
                                            {report.badge}
                                        </span>
                                    )}
                                </div>
                                <p className="reporting-report-card__description">{report.description}</p>
                            </div>
                        </button>
                    );
                })}
            </div>
        );
    };

    return (
        <section className="reporting-page">
            <div className="reporting-banner" data-animate="fade-up">
                <div className="reporting-banner__content">
                    <div className="reporting-banner__info">
                        <span className="reporting-banner__eyebrow">
                            <FaChartPie /> Unified Analytics
                        </span>
                        <h1 className="reporting-banner__title">Reports &amp; Analytics</h1>
                        <p className="reporting-banner__subtitle">
                            Explore cross-functional intelligence covering operations, finance, inventory, and support. Choose a stream to dive into curated visualisations and actionable insights.
                        </p>
                        {highlightedReport && (
                            <div className="reporting-banner__actions">
                                <button
                                    type="button"
                                    className="reporting-btn reporting-btn--gold"
                                    onClick={() => navigate(highlightedReport.path)}
                                >
                                    Open {highlightedReport.title}
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="reporting-banner__meta">
                    <div className="reporting-banner__meta-item">
                        <div className="reporting-banner__meta-icon reporting-banner__meta-icon--blue">
                            <FaChartPie />
                        </div>
                        <div className="reporting-banner__meta-content">
                            <span className="reporting-banner__meta-label">Categories</span>
                            <span className="reporting-banner__meta-value">{Object.keys(reportCategories).length}</span>
                        </div>
                    </div>
                    <div className="reporting-banner__meta-item">
                        <div className="reporting-banner__meta-icon reporting-banner__meta-icon--green">
                            <FaClipboardList />
                        </div>
                        <div className="reporting-banner__meta-content">
                            <span className="reporting-banner__meta-label">Accessible Reports</span>
                            <span className="reporting-banner__meta-value">{totalAccessibleReports}</span>
                        </div>
                    </div>
                    <div className="reporting-banner__meta-item">
                        <div className="reporting-banner__meta-icon reporting-banner__meta-icon--purple">
                            <FaChartLine />
                        </div>
                        <div className="reporting-banner__meta-content">
                            <span className="reporting-banner__meta-label">New Dashboards</span>
                            <span className="reporting-banner__meta-value">{newReportsCount}</span>
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

            <div className="reporting-tabs" data-animate="fade-up" data-delay="0.08">
                {Object.entries(reportCategories).map(([key, category]) => {
                    const CategoryIcon = category.icon;
                    return (
                        <button
                            key={key}
                            type="button"
                            className={`reporting-tab ${activeTab === key ? 'is-active' : ''}`}
                            onClick={() => setActiveTab(key)}
                        >
                            <CategoryIcon />
                            <span>{category.title}</span>
                        </button>
                    );
                })}
            </div>

            <div data-animate="fade-up" data-delay="0.1">
                <div className="reporting-card reporting-card--stretch">
                    <div className="reporting-card__content">
                        <h2 className="reporting-card__title">{reportCategories[activeTab].title}</h2>
                        <p className="reporting-card__subtitle">{reportCategories[activeTab].description}</p>
                        {renderReportCards(activeTab)}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ReportsPage;