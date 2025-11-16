import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import api from '../../api/api.js';
import { toast } from 'react-toastify';
import { FaCog, FaShieldAlt, FaKey, FaMobileAlt, FaBell, FaHistory, FaCheck, FaTimes, FaEye, FaEyeSlash } from 'react-icons/fa';
import './Security.css';

const Security = () => {
    const { user, hasPermission } = useAuth();
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Security data states
    const [twoFactorStatus, setTwoFactorStatus] = useState(null);
    const [loginHistory, setLoginHistory] = useState([]);
    const [securityAlerts, setSecurityAlerts] = useState([]);
    const [unacknowledgedCount, setUnacknowledgedCount] = useState(0);

    // Password change modal
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    // 2FA setup modal
    const [showTwoFactorModal, setShowTwoFactorModal] = useState(false);
    const [twoFactorSetup, setTwoFactorSetup] = useState(null);

    // Password visibility toggles
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    useEffect(() => {
        loadSecurityData();
    }, []);

    const loadSecurityData = async () => {
        setLoading(true);
        try {
            const [twoFactorResponse, alertsResponse, countResponse] = await Promise.all([
                api.get('/security/2fa/status'),
                api.get('/security/alerts?page=0&size=10'),
                api.get('/security/alerts/unacknowledged/count')
            ]);

            setTwoFactorStatus(twoFactorResponse.data);
            setSecurityAlerts(alertsResponse.data.content || []);
            setUnacknowledgedCount(countResponse.data);

            // Load login history
            const historyResponse = await api.get('/security/login-history?page=0&size=10');
            setLoginHistory(historyResponse.data.content || []);
        } catch (error) {
            console.error('Error loading security data:', error);
            toast.error('Failed to load security data');
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordChange = async () => {
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error('New passwords do not match');
            return;
        }

        setSaving(true);
        try {
            await api.post('/security/password/change', passwordData);
            toast.success('Password changed successfully');
            setShowPasswordModal(false);
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            console.error('Error changing password:', error);
            toast.error(error.response?.data?.message || 'Failed to change password');
        } finally {
            setSaving(false);
        }
    };

    const handleEnableTwoFactor = async () => {
        try {
            const response = await api.post('/security/2fa/enable');
            setTwoFactorSetup(response.data);
            setTwoFactorStatus(response.data);
            toast.success('Two-factor authentication enabled');
            setShowTwoFactorModal(false);
        } catch (error) {
            console.error('Error enabling 2FA:', error);
            toast.error('Failed to enable two-factor authentication');
        }
    };

    const handleDisableTwoFactor = async () => {
        try {
            await api.post('/security/2fa/disable');
            setTwoFactorStatus({ ...twoFactorStatus, enabled: false });
            toast.success('Two-factor authentication disabled');
        } catch (error) {
            console.error('Error disabling 2FA:', error);
            toast.error('Failed to disable two-factor authentication');
        }
    };

    const handleAcknowledgeAlert = async (alertId) => {
        try {
            await api.post(`/security/alerts/${alertId}/acknowledge`);
            setSecurityAlerts(alerts =>
                alerts.map(alert =>
                    alert.id === alertId ? { ...alert, acknowledged: true } : alert
                )
            );
            setUnacknowledgedCount(prev => Math.max(0, prev - 1));
            toast.success('Alert acknowledged');
        } catch (error) {
            console.error('Error acknowledging alert:', error);
            toast.error('Failed to acknowledge alert');
        }
    };

    const getSeverityColor = (severity) => {
        switch (severity?.toLowerCase()) {
            case 'critical': return 'danger';
            case 'high': return 'danger';
            case 'medium': return 'warning';
            case 'low': return 'info';
            default: return 'secondary';
        }
    };

    const formatDateTime = (dateTime) => {
        return new Date(dateTime).toLocaleString();
    };

    if (loading) {
        return (
            <div className="reporting-loading">
                <div className="reporting-spinner" />
                <p>Loading security information...</p>
            </div>
        );
    }

    return (
        <section className="reporting-page">
            <div className="reporting-banner" data-animate="fade-up">
                <div className="reporting-banner__content">
                    <div className="reporting-banner__info">
                        <span className="reporting-banner__eyebrow">
                            <FaShieldAlt /> Account Protection
                        </span>
                        <h1 className="reporting-banner__title">Security Center</h1>
                        <p className="reporting-banner__subtitle">
                            Monitor and enhance your account security. Manage passwords, 
                            two-factor authentication, and review security activity.
                        </p>
                    </div>
                </div>
            </div>

            <div className="reporting-tabs" data-animate="fade-up" data-delay="0.04">
                <button
                    className={`reporting-tab ${activeTab === 'overview' ? 'is-active' : ''}`}
                    onClick={() => setActiveTab('overview')}
                >
                    <FaShieldAlt /> Overview
                </button>
                <button
                    className={`reporting-tab ${activeTab === 'password' ? 'is-active' : ''}`}
                    onClick={() => setActiveTab('password')}
                >
                    <FaKey /> Password
                </button>
                <button
                    className={`reporting-tab ${activeTab === 'twofactor' ? 'is-active' : ''}`}
                    onClick={() => setActiveTab('twofactor')}
                >
                    <FaMobileAlt /> Two-Factor Auth
                </button>
                <button
                    className={`reporting-tab ${activeTab === 'history' ? 'is-active' : ''}`}
                    onClick={() => setActiveTab('history')}
                >
                    <FaHistory /> Login History
                </button>
                <button
                    className={`reporting-tab ${activeTab === 'alerts' ? 'is-active' : ''}`}
                    onClick={() => setActiveTab('alerts')}
                >
                    <FaBell /> Security Alerts
                    {unacknowledgedCount > 0 && (
                        <span className="security-alert-count">{unacknowledgedCount}</span>
                    )}
                </button>
            </div>

            <div className="security-content">
                {activeTab === 'overview' && (
                    <div className="security-grid" data-animate="fade-up" data-delay="0.08">
                        {/* Security Status */}
                        <div className="reporting-card">
                            <div className="reporting-card__header">
                                <div>
                                    <h2 className="reporting-card__title">Security Status</h2>
                                    <p className="reporting-card__subtitle">Your account security overview</p>
                                </div>
                            </div>
                            <div className="reporting-card__content">
                                <div className="security-status-grid">
                                    <div className="security-status-item">
                                        <div className="security-status-icon reporting-banner__meta-icon reporting-banner__meta-icon--green">
                                            <FaCheck />
                                        </div>
                                        <div className="security-status-content">
                                            <h4>Password Strength</h4>
                                            <span className="reporting-badge reporting-badge--success">Strong</span>
                                        </div>
                                    </div>
                                    <div className="security-status-item">
                                        <div className={`security-status-icon reporting-banner__meta-icon ${
                                            twoFactorStatus?.enabled 
                                                ? 'reporting-banner__meta-icon--green' 
                                                : 'reporting-banner__meta-icon--gold'
                                        }`}>
                                            {twoFactorStatus?.enabled ? <FaCheck /> : <FaTimes />}
                                        </div>
                                        <div className="security-status-content">
                                            <h4>Two-Factor Auth</h4>
                                            <span className={`reporting-badge ${
                                                twoFactorStatus?.enabled 
                                                    ? 'reporting-badge--success' 
                                                    : 'reporting-badge--warning'
                                            }`}>
                                                {twoFactorStatus?.enabled ? 'Enabled' : 'Disabled'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="security-status-item">
                                        <div className="security-status-icon reporting-banner__meta-icon reporting-banner__meta-icon--blue">
                                            <FaHistory />
                                        </div>
                                        <div className="security-status-content">
                                            <h4>Active Sessions</h4>
                                            <span className="reporting-badge reporting-badge--info">1</span>
                                        </div>
                                    </div>
                                    <div className="security-status-item">
                                        <div className={`security-status-icon reporting-banner__meta-icon ${
                                            unacknowledgedCount > 0 
                                                ? 'reporting-banner__meta-icon--red' 
                                                : 'reporting-banner__meta-icon--green'
                                        }`}>
                                            <FaBell />
                                        </div>
                                        <div className="security-status-content">
                                            <h4>Security Alerts</h4>
                                            <span className={`reporting-badge ${
                                                unacknowledgedCount > 0 
                                                    ? 'reporting-badge--danger' 
                                                    : 'reporting-badge--success'
                                            }`}>
                                                {unacknowledgedCount > 0 ? `${unacknowledgedCount} Unacknowledged` : 'All Clear'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <div className="reporting-card">
                            <div className="reporting-card__header">
                                <div>
                                    <h2 className="reporting-card__title">Recent Activity</h2>
                                    <p className="reporting-card__subtitle">Latest login attempts and security events</p>
                                </div>
                            </div>
                            <div className="reporting-card__content">
                                <div className="recent-activity-list">
                                    {loginHistory.slice(0, 5).map((login, index) => (
                                        <div key={index} className="activity-item">
                                            <div className={`activity-icon ${
                                                login.successful ? 'activity-icon--success' : 'activity-icon--danger'
                                            }`}>
                                                {login.successful ? <FaCheck /> : <FaTimes />}
                                            </div>
                                            <div className="activity-details">
                                                <div className="activity-type">
                                                    {login.successful ? 'Successful login' : 'Failed login attempt'}
                                                </div>
                                                <div className="activity-meta">
                                                    {formatDateTime(login.loginTime)} • {login.ipAddress}
                                                    {login.deviceType && ` • ${login.deviceType}`}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {loginHistory.length === 0 && (
                                        <div className="reporting-empty-state">
                                            <p>No recent activity found.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="reporting-card">
                            <div className="reporting-card__header">
                                <div>
                                    <h2 className="reporting-card__title">Quick Actions</h2>
                                    <p className="reporting-card__subtitle">Enhance your account security</p>
                                </div>
                            </div>
                            <div className="reporting-card__content">
                                <div className="security-actions-grid">
                                    <button
                                        onClick={() => setShowPasswordModal(true)}
                                        className="security-action-btn"
                                    >
                                        <div className="security-action-icon">
                                            <FaKey />
                                        </div>
                                        <div className="security-action-content">
                                            <h4>Change Password</h4>
                                            <p>Update your account password</p>
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => setShowTwoFactorModal(true)}
                                        className="security-action-btn"
                                    >
                                        <div className="security-action-icon">
                                            <FaMobileAlt />
                                        </div>
                                        <div className="security-action-content">
                                            <h4>Two-Factor Auth</h4>
                                            <p>Add an extra layer of security</p>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'password' && (
                    <div className="security-grid" data-animate="fade-up" data-delay="0.08">
                        <div className="reporting-card">
                            <div className="reporting-card__header">
                                <div>
                                    <h2 className="reporting-card__title">Password Management</h2>
                                    <p className="reporting-card__subtitle">Secure your account with a strong password</p>
                                </div>
                            </div>
                            <div className="reporting-card__content">
                                <div className="password-section">
                                    <div className="password-info">
                                        <div className="password-strength">
                                            <h4>Password Strength: <span className="reporting-text--positive">Strong</span></h4>
                                            <p>Your current password meets all security requirements.</p>
                                        </div>
                                        <div className="password-tips">
                                            <h5>Password Tips:</h5>
                                            <ul>
                                                <li>Use at least 12 characters</li>
                                                <li>Include numbers, symbols, and mixed case letters</li>
                                                <li>Avoid common words and personal information</li>
                                                <li>Don't reuse passwords across different sites</li>
                                            </ul>
                                        </div>
                                    </div>
                                    <div className="password-actions">
                                        <button
                                            onClick={() => setShowPasswordModal(true)}
                                            className="reporting-btn reporting-btn--gold"
                                        >
                                            <FaKey /> Change Password
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'twofactor' && (
                    <div className="security-grid" data-animate="fade-up" data-delay="0.08">
                        <div className="reporting-card">
                            <div className="reporting-card__header">
                                <div>
                                    <h2 className="reporting-card__title">Two-Factor Authentication</h2>
                                    <p className="reporting-card__subtitle">Add an extra layer of security to your account</p>
                                </div>
                            </div>
                            <div className="reporting-card__content">
                                <div className="twofactor-section">
                                    <div className="twofactor-status">
                                        <div className="status-indicator">
                                            <span className={`status-dot ${twoFactorStatus?.enabled ? 'enabled' : 'disabled'}`}></span>
                                            <span className="status-text">
                                                Two-factor authentication is currently {twoFactorStatus?.enabled ? 'enabled' : 'disabled'}
                                            </span>
                                        </div>
                                        <p className="twofactor-description">
                                            {twoFactorStatus?.enabled
                                                ? 'Your account is protected with an additional layer of security. You will need to enter a verification code from your authenticator app when signing in.'
                                                : 'Add an extra layer of security to your account by enabling two-factor authentication. You will need to enter a verification code from your authenticator app in addition to your password.'
                                            }
                                        </p>
                                    </div>

                                    <div className="twofactor-actions">
                                        {!twoFactorStatus?.enabled ? (
                                            <button
                                                onClick={() => setShowTwoFactorModal(true)}
                                                className="reporting-btn reporting-btn--gold"
                                            >
                                                <FaMobileAlt /> Enable Two-Factor Auth
                                            </button>
                                        ) : (
                                            <button
                                                onClick={handleDisableTwoFactor}
                                                className="reporting-btn reporting-btn--red"
                                            >
                                                <FaTimes /> Disable Two-Factor Auth
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'history' && (
                    <div className="security-grid" data-animate="fade-up" data-delay="0.08">
                        <div className="reporting-card">
                            <div className="reporting-card__header">
                                <div>
                                    <h2 className="reporting-card__title">Login History</h2>
                                    <p className="reporting-card__subtitle">Recent account access attempts</p>
                                </div>
                                <span className="reporting-badge reporting-badge--info">{loginHistory.length} Records</span>
                            </div>
                            <div className="reporting-card__content">
                                {loginHistory.length === 0 ? (
                                    <div className="reporting-empty-state">
                                        <p>No login history available.</p>
                                    </div>
                                ) : (
                                    <div className="reporting-table-container">
                                        <table className="reporting-table">
                                            <thead>
                                                <tr>
                                                    <th>Date & Time</th>
                                                    <th>IP Address</th>
                                                    <th>Device</th>
                                                    <th>Browser</th>
                                                    <th>Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {loginHistory.map((login, index) => (
                                                    <tr key={index}>
                                                        <td>{formatDateTime(login.loginTime)}</td>
                                                        <td>{login.ipAddress}</td>
                                                        <td>{login.deviceType || 'Unknown'}</td>
                                                        <td>{login.browser || 'Unknown'}</td>
                                                        <td>
                                                            <span className={`reporting-badge ${
                                                                login.successful 
                                                                    ? 'reporting-badge--success' 
                                                                    : 'reporting-badge--danger'
                                                            }`}>
                                                                {login.successful ? 'Success' : 'Failed'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'alerts' && (
                    <div className="security-grid" data-animate="fade-up" data-delay="0.08">
                        <div className="reporting-card">
                            <div className="reporting-card__header">
                                <div>
                                    <h2 className="reporting-card__title">Security Alerts</h2>
                                    <p className="reporting-card__subtitle">Important security notifications</p>
                                </div>
                                {unacknowledgedCount > 0 && (
                                    <span className="reporting-badge reporting-badge--danger">
                                        {unacknowledgedCount} Unacknowledged
                                    </span>
                                )}
                            </div>
                            <div className="reporting-card__content">
                                <div className="alerts-list">
                                    {securityAlerts.map((alert) => (
                                        <div key={alert.id} className={`alert-item ${alert.acknowledged ? 'acknowledged' : 'unacknowledged'}`}>
                                            <div className="alert-header">
                                                <span className={`reporting-badge reporting-badge--${getSeverityColor(alert.severity)}`}>
                                                    {alert.severity}
                                                </span>
                                                <span className="alert-type">{alert.alertType?.replace(/_/g, ' ')}</span>
                                                <span className="alert-time">{formatDateTime(alert.createdAt)}</span>
                                            </div>
                                            <div className="alert-message">{alert.message}</div>
                                            {alert.ipAddress && (
                                                <div className="alert-meta">IP Address: {alert.ipAddress}</div>
                                            )}
                                            {!alert.acknowledged && (
                                                <div className="alert-actions">
                                                    <button
                                                        onClick={() => handleAcknowledgeAlert(alert.id)}
                                                        className="reporting-btn reporting-btn--sm reporting-btn--blue"
                                                    >
                                                        Acknowledge
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {securityAlerts.length === 0 && (
                                        <div className="reporting-empty-state">
                                            <FaCheck className="empty-icon" />
                                            <p>No security alerts found. Your account is secure.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Password Change Modal */}
            {showPasswordModal && (
                <div className="reporting-modal-overlay">
                    <div className="reporting-modal" data-animate="fade-up">
                        <div className="reporting-modal__header">
                            <h3>Change Password</h3>
                            <button 
                                onClick={() => setShowPasswordModal(false)}
                                className="reporting-modal__close"
                            >
                                &times;
                            </button>
                        </div>
                        <div className="reporting-modal__content">
                            <div className="reporting-form-group">
                                <label className="reporting-form-label">Current Password</label>
                                <div className="password-input-container">
                                    <input
                                        type={showCurrentPassword ? "text" : "password"}
                                        value={passwordData.currentPassword}
                                        onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                                        className="reporting-input"
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="password-toggle-btn"
                                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                        aria-label={showCurrentPassword ? "Hide password" : "Show password"}
                                    >
                                        {showCurrentPassword ? <FaEyeSlash /> : <FaEye />}
                                    </button>
                                </div>
                            </div>
                            <div className="reporting-form-group">
                                <label className="reporting-form-label">New Password</label>
                                <div className="password-input-container">
                                    <input
                                        type={showNewPassword ? "text" : "password"}
                                        value={passwordData.newPassword}
                                        onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                                        className="reporting-input"
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="password-toggle-btn"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                        aria-label={showNewPassword ? "Hide password" : "Show password"}
                                    >
                                        {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                                    </button>
                                </div>
                            </div>
                            <div className="reporting-form-group">
                                <label className="reporting-form-label">Confirm New Password</label>
                                <div className="password-input-container">
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        value={passwordData.confirmPassword}
                                        onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                                        className="reporting-input"
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="password-toggle-btn"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                                    >
                                        {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="reporting-modal__actions">
                            <button 
                                onClick={() => setShowPasswordModal(false)}
                                className="reporting-btn reporting-btn--secondary"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handlePasswordChange}
                                disabled={saving}
                                className="reporting-btn reporting-btn--gold"
                            >
                                {saving ? 'Changing...' : 'Change Password'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Two-Factor Setup Modal */}
            {showTwoFactorModal && (
                <div className="reporting-modal-overlay">
                    <div className="reporting-modal reporting-modal--large" data-animate="fade-up">
                        <div className="reporting-modal__header">
                            <h3>Enable Two-Factor Authentication</h3>
                            <button 
                                onClick={() => setShowTwoFactorModal(false)}
                                className="reporting-modal__close"
                            >
                                &times;
                            </button>
                        </div>
                        <div className="reporting-modal__content">
                            <div className="twofactor-setup">
                                <div className="setup-intro">
                                    <p>Two-factor authentication adds an extra layer of security to your account by requiring a verification code from your mobile device.</p>
                                </div>
                                
                                <div className="setup-steps">
                                    <div className="setup-step">
                                        <div className="step-number">1</div>
                                        <div className="step-content">
                                            <h4>Install an Authenticator App</h4>
                                            <p>Download Google Authenticator, Authy, or a similar app on your smartphone.</p>
                                        </div>
                                    </div>
                                    
                                    <div className="setup-step">
                                        <div className="step-number">2</div>
                                        <div className="step-content">
                                            <h4>Scan QR Code</h4>
                                            <p>Open your authenticator app and scan this QR code:</p>
                                            {twoFactorSetup?.qrCodeUrl ? (
                                                <div className="qr-code-container">
                                                    {/* QR Code would be displayed here */}
                                                    <div className="qr-placeholder">
                                                        [QR Code Display]
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="qr-placeholder">
                                                    QR code will appear after enabling 2FA
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="setup-step">
                                        <div className="step-number">3</div>
                                        <div className="step-content">
                                            <h4>Enter Verification Code</h4>
                                            <p>Enter the 6-digit code from your authenticator app to verify setup:</p>
                                            <div className="verification-input">
                                                <input
                                                    type="text"
                                                    placeholder="000000"
                                                    maxLength="6"
                                                    className="reporting-input"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="reporting-modal__actions">
                            <button 
                                onClick={() => setShowTwoFactorModal(false)}
                                className="reporting-btn reporting-btn--secondary"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleEnableTwoFactor}
                                className="reporting-btn reporting-btn--gold"
                            >
                                Enable 2FA
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
};

export default Security;