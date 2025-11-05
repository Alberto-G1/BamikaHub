import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import { toast } from 'react-toastify';
import api from '../../api/api.js';
import logoImg from '../../assets/logo/logo.png';
import loginBgImg from '../../assets/images/login-img.jpg';
import './Auth.css';

const Register = () => {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({});
    
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        
        // Calculate password strength
        if (name === 'password') {
            calculatePasswordStrength(value);
        }
        
        // Clear error for this field when user types
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const calculatePasswordStrength = (password) => {
        let strength = 0;
        if (password.length >= 8) strength += 25;
        if (password.length >= 12) strength += 25;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
        if (/\d/.test(password)) strength += 15;
        if (/[^a-zA-Z\d]/.test(password)) strength += 10;
        setPasswordStrength(Math.min(strength, 100));
    };

    const getStrengthColor = () => {
        if (passwordStrength < 40) return '#ef4444';
        if (passwordStrength < 70) return '#f59e0b';
        return '#10b981';
    };

    const getStrengthText = () => {
        if (passwordStrength < 40) return 'Weak';
        if (passwordStrength < 70) return 'Medium';
        return 'Strong';
    };

    const validateForm = () => {
        const newErrors = {};
        
        if (!formData.firstName?.trim()) {
            newErrors.firstName = 'First name is required';
        }
        
        if (!formData.lastName?.trim()) {
            newErrors.lastName = 'Last name is required';
        }
        
        if (!formData.username?.trim()) {
            newErrors.username = 'Username is required';
        } else if (formData.username.length < 3) {
            newErrors.username = 'Username must be at least 3 characters';
        }
        
        if (!formData.email) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email is invalid';
        }
        
        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters';
        }
        
        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
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
            // Send confirmPassword to backend so server-side validation can compare
            const payload = formData;
            const response = await api.post('/auth/register', payload);
            
            toast.success(
                response.data || 'Registration successful! Awaiting admin approval.'
            );
            
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (err) {
            toast.error(
                err.response?.data?.message || 'Registration failed. Please try again.'
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
                {/* Left side - Image section */}
                <div className="image-section" style={{ backgroundImage: `url(${loginBgImg})` }}>
                    <div className="image-content">
                        <div className="image-icon">🚀</div>
                        <h1 className="image-title">Join Our Team!</h1>
                        <p className="image-description">
                            Create your account and start managing your engineering projects efficiently.
                        </p>
                    </div>
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
                        <h1>Create Account</h1>
                        <p>Join the Bamika Engineering team today</p>
                    </div>

                    {/* Register form */}
                    <form onSubmit={handleSubmit}>
                        <div className="form-row">
                            <div className="form-group">
                                <label>First Name</label>
                                <div className="input-wrapper">
                                    <FaUser className="input-icon" />
                                    <input
                                        type="text"
                                        name="firstName"
                                        placeholder="John"
                                        value={formData.firstName}
                                        onChange={handleChange}
                                        disabled={isLoading}
                                        required
                                    />
                                </div>
                                {errors.firstName && <span className="error-text">{errors.firstName}</span>}
                            </div>

                            <div className="form-group">
                                <label>Last Name</label>
                                <div className="input-wrapper">
                                    <FaUser className="input-icon" />
                                    <input
                                        type="text"
                                        name="lastName"
                                        placeholder="Doe"
                                        value={formData.lastName}
                                        onChange={handleChange}
                                        disabled={isLoading}
                                        required
                                    />
                                </div>
                                {errors.lastName && <span className="error-text">{errors.lastName}</span>}
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Username</label>
                            <div className="input-wrapper">
                                <FaUser className="input-icon" />
                                <input
                                    type="text"
                                    name="username"
                                    placeholder="johndoe"
                                    value={formData.username}
                                    onChange={handleChange}
                                    disabled={isLoading}
                                    required
                                />
                            </div>
                            {errors.username && <span className="error-text">{errors.username}</span>}
                        </div>

                        <div className="form-group">
                            <label>Email Address</label>
                            <div className="input-wrapper">
                                <FaEnvelope className="input-icon" />
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="you@example.com"
                                    value={formData.email}
                                    onChange={handleChange}
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
                                    name="password"
                                    placeholder="Min. 8 characters"
                                    value={formData.password}
                                    onChange={handleChange}
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
                            {formData.password && (
                                <div className="password-strength">
                                    <div 
                                        className="strength-bar" 
                                        style={{ width: `${passwordStrength}%`, backgroundColor: getStrengthColor() }}
                                    ></div>
                                </div>
                            )}
                            {formData.password && (
                                <div className="strength-text" style={{ color: getStrengthColor() }}>
                                    Password Strength: {getStrengthText()}
                                </div>
                            )}
                            {errors.password && <span className="error-text">{errors.password}</span>}
                        </div>

                        <div className="form-group">
                            <label>Confirm Password</label>
                            <div className="input-wrapper">
                                <FaLock className="input-icon" />
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    name="confirmPassword"
                                    placeholder="Re-enter password"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    disabled={isLoading}
                                    required
                                />
                                <span 
                                    className="toggle-password"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                                </span>
                            </div>
                            {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
                        </div>

                        <button type="submit" className="submit-btn" disabled={isLoading}>
                            <span>{isLoading ? 'Creating Account...' : 'Create Account'}</span>
                            {!isLoading && <i className="fas fa-arrow-right"></i>}
                        </button>
                    </form>

                    {/* Footer */}
                    <div className="form-footer">
                        <p>
                            Already have an account? <Link to="/login">Log In</Link>
                        </p>
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

export default Register;