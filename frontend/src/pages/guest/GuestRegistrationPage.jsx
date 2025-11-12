import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaUser, FaEnvelope, FaPhone, FaBuilding, FaTag, FaArrowRight, FaSignInAlt, FaMagic } from 'react-icons/fa';
import guestApi from '../../api/guestApi.js';
import logoImg from '../../assets/logo/logo.png';
import loginBgImg from '../../assets/images/login-img.jpg';
import '../auth/Auth.css';
import WallOfFamePanel from '../../components/auth/WallOfFamePanel.jsx';

const defaultForm = {
    fullName: '',
    email: '',
    phoneNumber: '',
    companyName: '',
    category: ''
};

const GuestRegistrationPage = () => {
    const [form, setForm] = useState(defaultForm);
    const [submitting, setSubmitting] = useState(false);
    const [tokenPreview, setTokenPreview] = useState(null);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setForm((previous) => ({ ...previous, [name]: value }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSubmitting(true);
        try {
            await guestApi.post('/public/guest/register', form);
            const { data } = await guestApi.post('/public/guest/magic-link', { email: form.email });
            setTokenPreview(data?.token ?? null);
            toast.success('Account created! Check your email for the login link.');
            setForm(defaultForm);
        } catch (error) {
            const message = error.validation?.message || error.response?.data?.message || 'Unable to create account';
            toast.error(message);
        } finally {
            setSubmitting(false);
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
                        <p className="tagline">Guest Registration</p>
                    </div>

                    {/* Form header */}
                    <div className="form-header">
                        <h1>Create Guest Account</h1>
                        <p>Register to access your support portal and manage tickets</p>
                    </div>

                    {/* Registration form */}
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Full Name</label>
                            <div className="input-wrapper">
                                <FaUser className="input-icon" />
                                <input 
                                    name="fullName" 
                                    type="text" 
                                    placeholder="John Doe"
                                    value={form.fullName} 
                                    onChange={handleChange} 
                                    required 
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Business Email</label>
                            <div className="input-wrapper">
                                <FaEnvelope className="input-icon" />
                                <input 
                                    name="email" 
                                    type="email" 
                                    placeholder="you@company.com"
                                    value={form.email} 
                                    onChange={handleChange} 
                                    required 
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Phone Number</label>
                            <div className="input-wrapper">
                                <FaPhone className="input-icon" />
                                <input 
                                    name="phoneNumber" 
                                    type="tel" 
                                    placeholder="+1 (555) 123-4567"
                                    value={form.phoneNumber} 
                                    onChange={handleChange} 
                                    required 
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Company (optional)</label>
                            <div className="input-wrapper">
                                <FaBuilding className="input-icon" />
                                <input 
                                    name="companyName" 
                                    type="text" 
                                    placeholder="Your Company Name"
                                    value={form.companyName} 
                                    onChange={handleChange} 
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Category (optional)</label>
                            <div className="input-wrapper">
                                <FaTag className="input-icon" />
                                <input 
                                    name="category" 
                                    type="text" 
                                    placeholder="e.g., Vendor, Partner, Client"
                                    value={form.category} 
                                    onChange={handleChange} 
                                />
                            </div>
                        </div>

                        <button type="submit" className="submit-btn" disabled={submitting}>
                            <span>{submitting ? 'Creating Account…' : 'Create Account'}</span>
                            {!submitting && <FaArrowRight />}
                        </button>
                    </form>

                    {tokenPreview && (
                        <div className="info-box" style={{
                            marginTop: '20px',
                            padding: '15px',
                            background: '#f0f9ff',
                            border: '1px solid #bfdbfe',
                            borderRadius: '8px',
                            fontSize: '0.9rem'
                        }}>
                            <strong>Your Token:</strong> {tokenPreview}
                        </div>
                    )}

                    {/* Footer with navigation */}
                    <div className="form-footer">
                        <p>
                            Already registered? <Link to="/guest/magic-link">Request Login Link</Link>
                        </p>
                    </div>

                    <div className="auth-links">
                        {/* Guest Links Section */}
                        <div className="auth-links-section">
                            <div className="auth-links-title">Guest Access</div>
                            <div className="auth-links-group">
                                <Link to="/guest/magic-link" title="Request a passwordless login link">
                                    <FaMagic /> Request Magic Link
                                </Link>
                                <Link to="/guest/magic-login" title="Sign in with your magic token">
                                    <FaSignInAlt /> Complete Login
                                </Link>
                            </div>
                        </div>

                        <div className="auth-links-divider"></div>

                        {/* Staff Links Section */}
                        <div className="auth-links-section">
                            <div className="auth-links-title">Staff Portal</div>
                            <div className="auth-links-group">
                                <Link to="/login" title="Access staff dashboard">
                                    <FaUser /> Staff Sign In
                                </Link>
                                <Link to="/register" title="Register as a staff member">
                                    <FaBuilding /> Staff Registration
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Copyright */}
                    <div className="copyright">
                        © 2025 Bamika Engineering. All rights reserved.
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GuestRegistrationPage;