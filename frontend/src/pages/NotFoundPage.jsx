import React from 'react';
import { Container, Row, Col, Button, Card } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { FaExclamationTriangle, FaHome, FaArrowLeft } from 'react-icons/fa';

const NotFoundPage = () => {
    const navigate = useNavigate();

    return (
        <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
            <Container>
                <Row className="justify-content-center">
                    <Col md={8} lg={6}>
                        <Card className="text-center shadow-lg border-0">
                            <Card.Body className="p-5">
                                <FaExclamationTriangle size={60} className="text-warning mb-4" />
                                <h1 className="display-1 fw-bold" style={{ color: '#343a40' }}>404</h1>
                                <h2 className="mb-3">Page Not Found</h2>
                                <p className="text-muted mb-4">
                                    Oops! The page you are looking for does not exist, might have been moved, or is temporarily unavailable.
                                </p>
                                <div className="d-flex justify-content-center gap-2">
                                    <Button as={Link} to="/dashboard" variant="primary" size="lg">
                                        <FaHome className="me-2" />
                                        Go to Dashboard
                                    </Button>
                                    <Button variant="outline-secondary" size="lg" onClick={() => navigate(-1)}>
                                        <FaArrowLeft className="me-2" />
                                        Go Back
                                    </Button>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </div>
    );
};

export default NotFoundPage;