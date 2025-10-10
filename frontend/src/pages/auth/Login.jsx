import React, { useState } from 'react';
import { Form, Button, Card, Container } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import api from '../../api/api.js';
import { toast } from 'react-toastify';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    // We no longer need the [error, setError] state. React-toastify handles it.

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Basic validation
        if (!email || !password) {
            toast.error("Please enter both email and password.");
            return;
        }

        try {
            const response = await api.post('/auth/login', { email, password });
            login(response.data); // Update the auth context with user data
            
            // Show a success toast notification
            toast.success('Login successful!');
            
            navigate('/dashboard'); // Redirect to the dashboard
        } catch (err) {
            // Show an error toast notification using the message from the backend, or a default one
            toast.error(err.response?.data?.message || 'Login failed. Please check your credentials or account status.');
        }
    };

    return (
        <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
            <div className="w-100" style={{ maxWidth: '400px' }}>
                <Card>
                    <Card.Body>
                        <h2 className="text-center mb-4">Log In to BamikaHub IS</h2>
                        
                        {/* The old <Alert> component is now removed. */}

                        <Form onSubmit={handleSubmit}>
                            <Form.Group className="mb-3" id="email">
                                <Form.Label>Email</Form.Label>
                                <Form.Control 
                                    type="email" 
                                    required 
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)} 
                                    placeholder="Enter your email"
                                />
                            </Form.Group>
                            <Form.Group className="mb-3" id="password">
                                <Form.Label>Password</Form.Label>
                                <Form.Control 
                                    type="password" 
                                    required 
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)} 
                                    placeholder="Enter your password"
                                />
                            </Form.Group>
                            <Button className="w-100 mt-3" type="submit" variant="primary">Log In</Button>
                        </Form>
                    </Card.Body>
                </Card>
                <div className="w-100 text-center mt-3">
                    Don't have an account? <Link to="/register">Register here</Link>
                </div>
            </div>
        </Container>
    );
};

export default Login;