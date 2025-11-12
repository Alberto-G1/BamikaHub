import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaKey, FaArrowRight, FaSignInAlt, FaMagic, FaUser, FaBuilding } from 'react-icons/fa';
import guestApi from '../../api/guestApi.js';
import { useGuestAuth } from '../../context/GuestAuthContext.jsx';
import WallOfFamePanel from '../../components/auth/WallOfFamePanel';
import logoImg from '../../assets/logo/logo.png';
import loginBgImg from '../../assets/images/login-img.jpg';
import '../auth/Auth.css';

const GuestMagicLoginPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { loginGuest } = useGuestAuth();
    const [tokenInput, setTokenInput] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const token = params.get('token');
        if (token) {
            setTokenInput(token);
            handleVerification(token);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleVerification = async (tokenValue) => {
        setSubmitting(true);
        try {
            const { data } = await guestApi.post('/public/guest/magic-link/verify', { token: tokenValue });
            loginGuest(data.token, data.guest, data.expiresAt);
            toast.success('Welcome back!');
            navigate('/guest/portal', { replace: true });
        } catch (error) {
            const message = error.validation?.message || error.response?.data?.message || 'Login link invalid or expired';
            toast.error(message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        if (!tokenInput.trim()) {
            toast.warn('Enter your login token first');
            return;
        }
        handleVerification(tokenInput.trim());
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
                        <h1>Complete Your Login</h1>
                        <p>Paste your magic link token to access your portal</p>
                    </div>

                    {/* Token verification form */}
                    <form className="auth-form" onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Magic Token</label>
                            <div className="input-wrapper">
                                <FaKey className="input-icon" />
                                <textarea 
                                    rows="4"
                                    style={{
                                        width: '100%',
                                        padding: '12px 12px 12px 45px',
                                        border: '2px solid rgba(13, 202, 240, 0.3)',
                                        borderRadius: '12px',
                                        fontSize: '0.95rem',
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        color: 'var(--text-primary)',
                                        transition: 'all 0.3s ease',
                                        resize: 'vertical'
                                    }}
                                    placeholder="Paste your token here or click the link from your email"
                                    value={tokenInput} 
                                    onChange={(event) => setTokenInput(event.target.value)} 
                                />
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            className="submit-btn" 
                            disabled={submitting}
                        >
                            <FaSignInAlt style={{ marginRight: '8px' }} />
                            {submitting ? 'Verifying…' : 'Verify & Sign In'}
                        </button>
                    </form>

                    <div className="help-text" style={{ marginTop: '20px' }}>
                        Tokens expire after 30 minutes. Request a new one if needed.
                    </div>

                    {/* Enhanced navigation links */}
                    <div className="auth-links">
                        {/* Guest Links Section */}
                        <div className="auth-links-section">
                            <div className="auth-links-title">Guest Access</div>
                            <div className="auth-links-group">
                                <Link to="/guest/magic-link" title="Request a new passwordless login link">
                                    <FaMagic /> Request Magic Link
                                </Link>
                                <Link to="/guest/register" title="Create a new guest account">
                                    <FaUser /> Guest Registration
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

export default GuestMagicLoginPage;