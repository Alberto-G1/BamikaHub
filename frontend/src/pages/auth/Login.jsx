import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaEnvelope, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext.jsx';
import { toast } from 'react-toastify';
import api from '../../api/api.js';
import logoImg from '../../assets/logo/logo.png';
import loginBgImg from '../../assets/images/login-img.jpg';
import './Auth.css';
import WallOfFamePanel from '../../components/auth/WallOfFamePanel.jsx';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({});
    
    const { login } = useAuth();
    const navigate = useNavigate();

    const validateForm = () => {
        const newErrors = {};
        
        if (!email) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = 'Email is invalid';
        }
        
        if (!password) {
            newErrors.password = 'Password is required';
        } else if (password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            toast.error('Please fix the errors in the form');
            return;
        }

        setIsLoading(true);
        
        try {
            const response = await api.post('/auth/login', { email, password });
            login(response.data);
            toast.success('Login successful! Welcome back.');
            navigate('/dashboard');
        } catch (err) {
            toast.error(
                err.response?.data?.message || 'Login failed. Please check your credentials.'
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-page">
            {/* Animated gradient background */}
            <div className="gradient-bg">
                <div className="gradient-orb orb1"></div>
                <div className="gradient-orb orb2"></div>
                <div className="gradient-orb orb3"></div>
            </div>
            <div className="grid-overlay"></div>

            {/* Main wrapper with split layout */}
            <div className="main-wrapper">
                {/* Left side - Wall of Fame section */}
                <div className="image-section" style={{ backgroundImage: `url(${loginBgImg})` }}>
                    <WallOfFamePanel />
                </div>

                {/* Right side - Form section */}
                <div className="form-section">
                    {/* Logo */}
                    <div className="logo-section">
                        <div className="logo-container">
                            <img src={logoImg} alt="BamikaHub Logo" className="logo-image" />
                        </div>
                        <div className="brand-name">
                            <span className="bamika">Bamika</span>
                            <span className="hub">Hub</span>
                        </div>
                        <p className="tagline">Inventory & Operations</p>
                    </div>

                    {/* Form header */}
                    <div className="form-header">
                        <h1>Log In</h1>
                        <p>Welcome back! Please enter your credentials</p>
                    </div>

                    {/* Login form */}
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Email Address</label>
                            <div className="input-wrapper">
                                <FaEnvelope className="input-icon" />
                                <input
                                    type="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={isLoading}
                                    required
                                />
                            </div>
                            {errors.email && <span className="error-text">{errors.email}</span>}
                        </div>

                        <div className="form-group">
                            <label>Password</label>
                            <div className="input-wrapper">
                                <FaLock className="input-icon" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={isLoading}
                                    required
                                />
                                <span 
                                    className="toggle-password"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                                </span>
                            </div>
                            {errors.password && <span className="error-text">{errors.password}</span>}
                        </div>

                        <button type="submit" className="submit-btn" disabled={isLoading}>
                            <span>{isLoading ? 'Signing In...' : 'Sign In'}</span>
                            {!isLoading && <i className="fas fa-arrow-right"></i>}
                        </button>
                    </form>

                    {/* Footer */}
                    <div className="form-footer">
                        <p>
                            Don't have an account? <Link to="/register">Create Account</Link>
                        </p>
                    </div>

                    <div className="guest-access-block">
                        <p className="guest-access-title">Visiting as a guest?</p>
                        <div className="guest-access-links">
                            <Link to="/guest/register">Create guest profile</Link>
                            <Link to="/guest/magic-link">Request access link</Link>
                            <Link to="/guest/magic-login">Use a magic token</Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Copyright */}
            <div className="copyright">
                © 2025 Bamika Engineering. All rights reserved.
            </div>
        </div>
    );
};

export default Login;