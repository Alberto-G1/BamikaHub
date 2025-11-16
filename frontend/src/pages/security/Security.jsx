import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import api from '../../api/api.js';
import { toast } from 'react-toastify';
import Button from '../../components/common/Button.jsx';
import Card from '../../components/common/Card.jsx';
import Input from '../../components/common/Input.jsx';
import Modal from '../../components/common/Modal.jsx';
import Spinner from '../../components/common/Spinner.jsx';
import Table from '../../components/common/Table.jsx';
import Badge from '../../components/common/Badge.jsx';
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
            <div className="security-loading">
                <Spinner />
                <p>Loading security information...</p>
            </div>
        );
    }

    return (
        <div className="security-page">
            <div className="security-header">
                <h1>Security Center</h1>
                <p>Manage your account security and monitor activity</p>
            </div>

            <div className="security-tabs">
                <button
                    className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
                    onClick={() => setActiveTab('overview')}
                >
                    Overview
                </button>
                <button
                    className={`tab-button ${activeTab === 'password' ? 'active' : ''}`}
                    onClick={() => setActiveTab('password')}
                >
                    Password
                </button>
                <button
                    className={`tab-button ${activeTab === 'twofactor' ? 'active' : ''}`}
                    onClick={() => setActiveTab('twofactor')}
                >
                    Two-Factor Auth
                </button>
                <button
                    className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
                    onClick={() => setActiveTab('history')}
                >
                    Login History
                </button>
                <button
                    className={`tab-button ${activeTab === 'alerts' ? 'active' : ''}`}
                    onClick={() => setActiveTab('alerts')}
                >
                    Security Alerts
                    {unacknowledgedCount > 0 && (
                        <Badge variant="danger" className="alert-count">
                            {unacknowledgedCount}
                        </Badge>
                    )}
                </button>
            </div>

            <div className="security-content">
                {activeTab === 'overview' && (
                    <div className="security-overview">
                        <div className="overview-grid">
                            <Card className="overview-card">
                                <div className="card-header">
                                    <h3>Account Security Status</h3>
                                </div>
                                <div className="card-body">
                                    <div className="security-status">
                                        <div className="status-item">
                                            <span className="status-label">Password Strength:</span>
                                            <Badge variant="success">Strong</Badge>
                                        </div>
                                        <div className="status-item">
                                            <span className="status-label">Two-Factor Auth:</span>
                                            <Badge variant={twoFactorStatus?.enabled ? 'success' : 'warning'}>
                                                {twoFactorStatus?.enabled ? 'Enabled' : 'Disabled'}
                                            </Badge>
                                        </div>
                                        <div className="status-item">
                                            <span className="status-label">Active Sessions:</span>
                                            <Badge variant="info">1</Badge>
                                        </div>
                                        <div className="status-item">
                                            <span className="status-label">Security Alerts:</span>
                                            <Badge variant={unacknowledgedCount > 0 ? 'danger' : 'success'}>
                                                {unacknowledgedCount > 0 ? `${unacknowledgedCount} Unacknowledged` : 'All Clear'}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            <Card className="overview-card">
                                <div className="card-header">
                                    <h3>Recent Activity</h3>
                                </div>
                                <div className="card-body">
                                    <div className="recent-activity">
                                        {loginHistory.slice(0, 3).map((login, index) => (
                                            <div key={index} className="activity-item">
                                                <div className="activity-icon">
                                                    {login.successful ? '✓' : '✗'}
                                                </div>
                                                <div className="activity-details">
                                                    <div className="activity-type">
                                                        {login.successful ? 'Successful login' : 'Failed login attempt'}
                                                    </div>
                                                    <div className="activity-meta">
                                                        {formatDateTime(login.loginTime)} • {login.ipAddress}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>
                )}

                {activeTab === 'password' && (
                    <Card className="security-card">
                        <div className="card-header">
                            <h2>Change Password</h2>
                        </div>
                        <div className="card-body">
                            <div className="password-section">
                                <p>Regularly updating your password helps keep your account secure.</p>
                                <Button
                                    onClick={() => setShowPasswordModal(true)}
                                    className="primary"
                                >
                                    Change Password
                                </Button>
                            </div>
                        </div>
                    </Card>
                )}

                {activeTab === 'twofactor' && (
                    <Card className="security-card">
                        <div className="card-header">
                            <h2>Two-Factor Authentication</h2>
                        </div>
                        <div className="card-body">
                            <div className="twofactor-section">
                                <div className="twofactor-status">
                                    <div className="status-indicator">
                                        <span className={`status-dot ${twoFactorStatus?.enabled ? 'enabled' : 'disabled'}`}></span>
                                        <span className="status-text">
                                            Two-factor authentication is {twoFactorStatus?.enabled ? 'enabled' : 'disabled'}
                                        </span>
                                    </div>
                                    <p>
                                        {twoFactorStatus?.enabled
                                            ? 'Your account is protected with an additional layer of security.'
                                            : 'Add an extra layer of security to your account by enabling two-factor authentication.'
                                        }
                                    </p>
                                </div>

                                <div className="twofactor-actions">
                                    {!twoFactorStatus?.enabled ? (
                                        <Button
                                            onClick={() => setShowTwoFactorModal(true)}
                                            className="primary"
                                        >
                                            Enable Two-Factor Auth
                                        </Button>
                                    ) : (
                                        <Button
                                            onClick={handleDisableTwoFactor}
                                            className="danger"
                                        >
                                            Disable Two-Factor Auth
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </Card>
                )}

                {activeTab === 'history' && (
                    <Card className="security-card">
                        <div className="card-header">
                            <h2>Login History</h2>
                        </div>
                        <div className="card-body">
                            <Table
                                columns={[
                                    { key: 'loginTime', header: 'Date & Time', render: (value) => formatDateTime(value) },
                                    { key: 'ipAddress', header: 'IP Address' },
                                    { key: 'deviceType', header: 'Device' },
                                    { key: 'browser', header: 'Browser' },
                                    {
                                        key: 'successful',
                                        header: 'Status',
                                        render: (value) => (
                                            <Badge variant={value ? 'success' : 'danger'}>
                                                {value ? 'Success' : 'Failed'}
                                            </Badge>
                                        )
                                    }
                                ]}
                                data={loginHistory}
                                emptyMessage="No login history available"
                            />
                        </div>
                    </Card>
                )}

                {activeTab === 'alerts' && (
                    <Card className="security-card">
                        <div className="card-header">
                            <h2>Security Alerts</h2>
                        </div>
                        <div className="card-body">
                            <div className="alerts-list">
                                {securityAlerts.map((alert) => (
                                    <div key={alert.id} className={`alert-item ${alert.acknowledged ? 'acknowledged' : ''}`}>
                                        <div className="alert-header">
                                            <Badge variant={getSeverityColor(alert.severity)}>
                                                {alert.severity}
                                            </Badge>
                                            <span className="alert-type">{alert.alertType.replace(/_/g, ' ')}</span>
                                            <span className="alert-time">{formatDateTime(alert.createdAt)}</span>
                                        </div>
                                        <div className="alert-message">{alert.message}</div>
                                        {alert.ipAddress && (
                                            <div className="alert-meta">IP: {alert.ipAddress}</div>
                                        )}
                                        {!alert.acknowledged && (
                                            <div className="alert-actions">
                                                <Button
                                                    size="small"
                                                    onClick={() => handleAcknowledgeAlert(alert.id)}
                                                >
                                                    Acknowledge
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {securityAlerts.length === 0 && (
                                    <div className="no-alerts">
                                        <p>No security alerts found.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>
                )}
            </div>

            {/* Password Change Modal */}
            <Modal
                isOpen={showPasswordModal}
                onClose={() => setShowPasswordModal(false)}
                title="Change Password"
            >
                <div className="password-change-form">
                    <div className="form-group">
                        <label>Current Password</label>
                        <Input
                            type="password"
                            value={passwordData.currentPassword}
                            onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>New Password</label>
                        <Input
                            type="password"
                            value={passwordData.newPassword}
                            onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Confirm New Password</label>
                        <Input
                            type="password"
                            value={passwordData.confirmPassword}
                            onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                            required
                        />
                    </div>
                    <div className="modal-actions">
                        <Button onClick={() => setShowPasswordModal(false)} variant="secondary">
                            Cancel
                        </Button>
                        <Button
                            onClick={handlePasswordChange}
                            disabled={saving}
                            className="primary"
                        >
                            {saving ? 'Changing...' : 'Change Password'}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Two-Factor Setup Modal */}
            <Modal
                isOpen={showTwoFactorModal}
                onClose={() => setShowTwoFactorModal(false)}
                title="Enable Two-Factor Authentication"
            >
                <div className="twofactor-setup">
                    <p>Two-factor authentication adds an extra layer of security to your account.</p>
                    <div className="setup-steps">
                        <div className="setup-step">
                            <h4>Step 1: Install an authenticator app</h4>
                            <p>Download Google Authenticator, Authy, or similar app on your phone.</p>
                        </div>
                        <div className="setup-step">
                            <h4>Step 2: Scan QR Code</h4>
                            <p>Scan the QR code with your authenticator app.</p>
                            {twoFactorSetup?.qrCodeUrl && (
                                <div className="qr-placeholder">
                                    [QR Code would be displayed here]
                                </div>
                            )}
                        </div>
                        <div className="setup-step">
                            <h4>Step 3: Enter verification code</h4>
                            <p>Enter the 6-digit code from your authenticator app.</p>
                            <Input placeholder="000000" maxLength="6" />
                        </div>
                    </div>
                    <div className="modal-actions">
                        <Button onClick={() => setShowTwoFactorModal(false)} variant="secondary">
                            Cancel
                        </Button>
                        <Button onClick={handleEnableTwoFactor} className="primary">
                            Enable 2FA
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Security;