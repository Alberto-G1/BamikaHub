import React from 'react';
import { Container, Card, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FaFileInvoiceDollar, FaChartLine, FaClipboardList, FaProjectDiagram, FaTicketAlt } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext.jsx';

const ReportsPage = () => {
    const navigate = useNavigate();
    const { hasPermission } = useAuth();

    const reports = [
        {
            title: "Inventory Valuation",
            description: "View the current quantity, unit price, and total value of all items in stock.",
            icon: <FaClipboardList size={40} className="text-primary" />,
            path: "/reports/inventory-valuation",
            permission: "ITEM_READ"
        },
        {
            title: "Project Costing",
            description: "Analyze the total estimated cost of materials for each project based on approved requisitions.",
            icon: <FaProjectDiagram size={40} className="text-primary" />,
            path: "/reports/project-costs",
            permission: "PROJECT_READ"
        },
        {
            title: "Support Ticket Summary",
            description: "Get an overview of support tickets by status and category.",
            icon: <FaTicketAlt size={40} className="text-primary" />,
            path: "/reports/support-summary",
            permission: "TICKET_MANAGE"
        }
    ];

    return (
        <Container>
            <div className="mb-4">
                <h2>Reports & Analytics</h2>
                <p className="text-muted">Select a report to view detailed insights and analytics.</p>
            </div>
            <Row xs={1} md={2} lg={3} className="g-4">
                {reports.map((report, index) => (
                    hasPermission(report.permission) && (
                        <Col key={index}>
                            <Card className="h-100 shadow-sm inventory-card" onClick={() => navigate(report.path)}>
                                <Card.Body className="text-center">
                                    <div className="mb-3">{report.icon}</div>
                                    <Card.Title as="h5">{report.title}</Card.Title>
                                    <Card.Text className="small text-muted">{report.description}</Card.Text>
                                </Card.Body>
                            </Card>
                        </Col>
                    )
                ))}
            </Row>
        </Container>
    );
};

export default ReportsPage;