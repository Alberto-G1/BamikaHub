import React, { useState } from 'react';
import { Container, Card, Row, Col, Tabs, Tab, Badge } from 'react-bootstrap';
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

const ReportsPage = () => {
    const navigate = useNavigate();
    const { hasPermission } = useAuth();
    const [activeTab, setActiveTab] = useState('dashboard');

    const reportCategories = {
        dashboard: {
            title: 'Dashboard Overview',
            icon: <FaChartPie />,
            reports: [
                {
                    title: "Executive Dashboard",
                    description: "Real-time KPIs and visualizations across all modules",
                    icon: <FaChartPie size={40} className="text-primary" />,
                    path: "/dashboard",
                    permission: null,
                    badge: "Quick View"
                }
            ]
        },
        operations: {
            title: 'Operations Reports',
            icon: <FaProjectDiagram />,
            reports: [
                {
                    title: "Project Performance",
                    description: "Analyze project status, completion rates, and duration metrics",
                    icon: <FaProjectDiagram size={40} className="text-info" />,
                    path: "/reports/operations/project-performance",
                    permission: "PROJECT_READ",
                    badge: "Trending"
                },
                {
                    title: "Project Delays",
                    description: "Identify overdue projects and delay causes",
                    icon: <FaExclamationTriangle size={40} className="text-warning" />,
                    path: "/reports/operations/project-delays",
                    permission: "PROJECT_READ"
                },
                {
                    title: "Completion Trends",
                    description: "Monthly/weekly project completion trends over time",
                    icon: <FaChartLine size={40} className="text-success" />,
                    path: "/reports/operations/completion-trends",
                    permission: "PROJECT_READ",
                    badge: "New"
                }
            ]
        },
        finance: {
            title: 'Finance Reports',
            icon: <FaMoneyBillWave />,
            reports: [
                {
                    title: "Requisitions by Status",
                    description: "Track pending, approved, and fulfilled requisitions",
                    icon: <FaClipboardList size={40} className="text-success" />,
                    path: "/reports/finance/requisitions-status",
                    permission: "FINANCE_READ"
                },
                {
                    title: "Expenditure Trends",
                    description: "Monthly spending analysis and forecasting",
                    icon: <FaChartLine size={40} className="text-success" />,
                    path: "/reports/finance/expenditure-trends",
                    permission: "FINANCE_READ",
                    badge: "Trending"
                },
                {
                    title: "Budget vs Actual",
                    description: "Compare budgeted costs against actual spending by project",
                    icon: <FaDollarSign size={40} className="text-danger" />,
                    path: "/reports/finance/budget-vs-actual",
                    permission: "FINANCE_READ"
                },
                {
                    title: "Project Costing",
                    description: "Total estimated material costs per project",
                    icon: <FaFileInvoiceDollar size={40} className="text-success" />,
                    path: "/reports/project-costs",
                    permission: "FINANCE_READ"
                }
            ]
        },
        inventory: {
            title: 'Inventory Reports',
            icon: <FaBoxes />,
            reports: [
                {
                    title: "Inventory Valuation",
                    description: "Current stock quantities, prices, and total values",
                    icon: <FaWarehouse size={40} className="text-primary" />,
                    path: "/reports/inventory-valuation",
                    permission: "ITEM_READ"
                },
                {
                    title: "Stock Movement",
                    description: "Track stock in/out movements and reorder frequency",
                    icon: <FaChartBar size={40} className="text-primary" />,
                    path: "/reports/inventory/stock-movement",
                    permission: "ITEM_READ",
                    badge: "New"
                },
                {
                    title: "Supplier Performance",
                    description: "Delivery times and reliability ratings",
                    icon: <FaTruck size={40} className="text-info" />,
                    path: "/reports/inventory/supplier-performance",
                    permission: "ITEM_READ",
                    badge: "Coming Soon"
                }
            ]
        },
        support: {
            title: 'Technical Support',
            icon: <FaTicketAlt />,
            reports: [
                {
                    title: "Support Ticket Summary",
                    description: "Overview of tickets by status and category",
                    icon: <FaTicketAlt size={40} className="text-danger" />,
                    path: "/reports/support-summary",
                    permission: "TICKET_MANAGE"
                },
                {
                    title: "SLA Compliance",
                    description: "Response and resolution time compliance by priority",
                    icon: <FaCheckCircle size={40} className="text-success" />,
                    path: "/reports/support/sla-compliance",
                    permission: "TICKET_MANAGE",
                    badge: "New"
                },
                {
                    title: "Ticket Volume Trends",
                    description: "Historical ticket volume and seasonal patterns",
                    icon: <FaChartLine size={40} className="text-danger" />,
                    path: "/reports/support/ticket-trends",
                    permission: "TICKET_MANAGE",
                    badge: "New"
                }
            ]
        }
    };

    const renderReportCards = (category) => {
        return reportCategories[category].reports.map((report, index) => {
            if (report.permission && !hasPermission(report.permission)) {
                return null;
            }

            return (
                <Col key={index}>
                    <Card 
                        className="h-100 shadow-sm inventory-card position-relative"
                        onClick={() => navigate(report.path)}
                        style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                    >
                        {report.badge && (
                            <Badge 
                                bg={report.badge === 'New' ? 'success' : report.badge === 'Trending' ? 'warning' : 'secondary'}
                                className="position-absolute top-0 end-0 m-2"
                            >
                                {report.badge}
                            </Badge>
                        )}
                        <Card.Body className="text-center">
                            <div className="mb-3">{report.icon}</div>
                            <Card.Title as="h5" className="mb-2">{report.title}</Card.Title>
                            <Card.Text className="small text-muted">{report.description}</Card.Text>
                        </Card.Body>
                    </Card>
                </Col>
            );
        });
    };

    return (
        <Container fluid>
            <Card className="shadow-sm mb-4">
                <Card.Header>
                    <div className="d-flex align-items-center">
                        <FaChartPie size={24} className="me-3 text-primary" />
                        <div>
                            <h3 className="mb-0">Reports & Analytics</h3>
                            <small className="text-muted">
                                Multi-dimensional reporting across Operations, Finance, Inventory, and Support
                            </small>
                        </div>
                    </div>
                </Card.Header>
            </Card>

            <Tabs
                activeKey={activeTab}
                onSelect={(k) => setActiveTab(k)}
                className="mb-4"
                justify
            >
                {Object.entries(reportCategories).map(([key, category]) => (
                    <Tab
                        key={key}
                        eventKey={key}
                        title={
                            <span>
                                {category.icon} <span className="ms-2 d-none d-md-inline">{category.title}</span>
                            </span>
                        }
                    >
                        <Row xs={1} md={2} lg={3} xl={4} className="g-4 mt-2">
                            {renderReportCards(key)}
                        </Row>
                    </Tab>
                ))}
            </Tabs>
        </Container>
    );
};

export default ReportsPage;