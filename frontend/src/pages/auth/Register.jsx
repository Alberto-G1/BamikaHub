import React, { useState } from 'react';
import { Form, Button, Card, Container, Row, Col } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/api.js';
import { toast } from 'react-toastify';

const Register = () => {
    // UPDATED: State to match the backend fields
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    
    const navigate = useNavigate();

    // No longer need error/success state, using toast notifications
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            // UPDATED: Send the correct payload with all required fields
            const payload = { firstName, lastName, username, email, password };
            const response = await api.post('/auth/register', payload);
            
            toast.success(response.data || "Registration successful! Awaiting admin approval.");
            
            setTimeout(() => {
                navigate('/login');
            }, 3000); // Redirect to login after 3 seconds
        } catch (err) {
            toast.error(err.response?.data?.message || 'Registration failed. Please try again.');
        }
    };

    return (
        <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
            <div className="w-100" style={{ maxWidth: '500px' }}>
                <Card className="shadow-sm">
                    <Card.Body className="p-4">
                        <h2 className="text-center mb-4">Create Your Account</h2>
                        
                        {/* Old Alert components are removed */}

                        <Form onSubmit={handleSubmit}>
                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3" id="firstName">
                                        <Form.Label>First Name</Form.Label>
                                        <Form.Control type="text" required onChange={(e) => setFirstName(e.target.value)} placeholder="e.g., John" />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                     <Form.Group className="mb-3" id="lastName">
                                        <Form.Label>Last Name</Form.Label>
                                        <Form.Control type="text" required onChange={(e) => setLastName(e.target.value)} placeholder="e.g., Doe" />
                                    </Form.Group>
                                </Col>
                            </Row>

                            <Form.Group className="mb-3" id="username">
                                <Form.Label>Username</Form.Label>
                                <Form.Control type="text" required onChange={(e) => setUsername(e.target.value)} placeholder="Choose a unique username" />
                            </Form.Group>

                            <Form.Group className="mb-3" id="email">
                                <Form.Label>Email</Form.Label>
                                <Form.Control type="email" required onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
                            </Form.Group>

                            <Form.Group className="mb-3" id="password">
                                <Form.Label>Password</Form.Label>
                                <Form.Control type="password" required onChange={(e) => setPassword(e.target.value)} placeholder="Min. 8 characters"/>
                            </Form.Group>

                            <Button className="w-100 mt-3" type="submit" variant="primary">Register</Button>
                        </Form>
                    </Card.Body>
                </Card>
                <div className="w-100 text-center mt-3">
                    Already have an account? <Link to="/login">Log In</Link>
                </div>
            </div>
        </Container>
    );
};

export default Register;