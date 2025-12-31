import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaEnvelope, FaMagic, FaArrowRight, FaSignInAlt, FaUser, FaBuilding } from 'react-icons/fa';
import guestApi from '../../api/guestApi.js';
import WallOfFamePanel from '../../components/auth/WallOfFamePanel';
import logoImg from '../../assets/logo/logo.png';
import loginBgImg from '../../assets/images/login-img.jpeg';
import '../auth/Auth.css';

const GuestMagicLinkRequestPage = () => {
    const [email, setEmail] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [tokenPreview, setTokenPreview] = useState(null);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSubmitting(true);
        try {
            const { data } = await guestApi.post('/public/guest/magic-link', { email });
            setTokenPreview(data?.token ?? null);
            toast.success('Magic link sent! Check your email.');
            setEmail('');
        } catch (error) {
            const message = error.validation?.message || error.response?.data?.message || 'Unable to send magic link';
            toast.error(message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="auth-page">
            {/* Animated gradient background */}
            <div className="gradient-bg">
                <div className="orb orb1"></div>
                <div className="orb orb2"></div>
                <div className="orb orb3"></div>
            </div>
            <div className="grid-overlay"></div>

            <div className="main-wrapper">
                {/* Left side - Wall of Fame */}
                <div className="image-section" style={{ 
                    backgroundImage: `linear-gradient(rgba(13, 202, 240, 0.5), rgba(40, 167, 69, 0.5)), url(${loginBgImg})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                }}>
                    <WallOfFamePanel />
                </div>

                {/* Right side - Form section */}
                <div className="form-section">
                    {/* Logo */}
                    <div className="logo-section">
                        <img src={logoImg} alt="Bamika Logo" className="logo" />
                        <div className="brand-name">
                            <span className="bamika">Bamika</span>
                            <span className="hub">Hub</span>
                        </div>
                        <p className="tagline">Guest Portal Access</p>
                    </div>

                    {/* Form header */}
                    <div className="form-header">
                        <h1>Get Your Magic Link</h1>
                        <p>Enter your email and we'll send you a secure login link</p>
                    </div>

                    {/* Magic link form */}
                    <form className="auth-form" onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Email Address</label>
                            <div className="input-wrapper">
                                <FaEnvelope className="input-icon" />
                                <input 
                                    type="email" 
                                    placeholder="you@example.com"
                                    value={email} 
                                    onChange={(event) => setEmail(event.target.value)} 
                                    required 
                                />
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            className="submit-btn" 
                            disabled={submitting}
                        >
                            <FaMagic style={{ marginRight: '8px' }} />
                            {submitting ? 'Sending…' : 'Send Magic Link'}
                        </button>
                    </form>

                    {tokenPreview && (
                        <div className="info-box" style={{ marginTop: '20px' }}>
                            <strong>Developer token preview:</strong> {tokenPreview}
                        </div>
                    )}

                    <div className="help-text" style={{ marginTop: '20px' }}>
                        The magic link expires after 30 minutes. You can request a new one anytime.
                    </div>

                    {/* Enhanced navigation links */}
                    <div className="auth-links">
                        {/* Guest Links Section */}
                        <div className="auth-links-section">
                            <div className="auth-links-title">Guest Access</div>
                            <div className="auth-links-group">
                                <Link to="/guest/register" title="Create a new guest account">
                                    <FaUser /> Guest Registration
                                </Link>
                                <Link to="/guest/magic-login" title="Complete login with your magic token">
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
                                    <FaBuilding /> Staff Sign In
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

export default GuestMagicLinkRequestPage;