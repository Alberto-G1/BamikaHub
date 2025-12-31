import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useTheme } from '../../hooks/useTheme.js';
import api from '../../api/api.js';
import { toast } from 'react-toastify';
import { FaCog, FaPalette, FaBell, FaEye, FaSave, FaUserCog, FaDownload, FaUpload, FaHeartbeat, FaHistory, FaCheckCircle, FaExclamationTriangle, FaTimesCircle } from 'react-icons/fa';
import './Settings.css';

const Settings = () => {
    const { user, hasPermission } = useAuth();
    const { setLightTheme, setDarkTheme } = useTheme();
    const [activeTab, setActiveTab] = useState('user');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    const [systemHealth, setSystemHealth] = useState(null);
    const [auditHistory, setAuditHistory] = useState([]);
    const [showImportModal, setShowImportModal] = useState(false);
    const [importFile, setImportFile] = useState(null);
    const [overwriteOnImport, setOverwriteOnImport] = useState(false);

    const [userSettings, setUserSettings] = useState({
        theme: 'light',
        language: 'en',
        emailNotifications: true,
        smsNotifications: false,
        pushNotifications: true,
        desktopNotifications: true,
        itemsPerPage: 25,
        dateFormat: 'MM/dd/yyyy',
        timeFormat: 'HH:mm',
        autoSaveEnabled: true,
        autoSaveIntervalMinutes: 5,
        showWelcomeMessage: true,
        compactView: false
    });

    const [systemSettings, setSystemSettings] = useState({
        companyName: '',
        companyEmail: '',
        companyPhone: '',
        companyAddress: '',
        timezone: 'UTC',
        currency: 'USD',
        language: 'en',
        emailNotificationsEnabled: true,
        smsNotificationsEnabled: false,
        pushNotificationsEnabled: true,
        sessionTimeoutMinutes: 30,
        maxLoginAttempts: 5,
        twoFactorAuthRequired: false,
        maintenanceMode: false,
        maintenanceMessage: ''
    });

    useEffect(() => {
        loadSettings();
        if (hasPermission('SYSTEM_SETTINGS_READ')) {
            loadSystemHealth();
            loadAuditHistory();
        }
    }, []);

    const loadSettings = async () => {
        setLoading(true);
        try {
            const userResponse = await api.get('/settings/user');
            setUserSettings(userResponse.data);
            applyThemePreference(userResponse.data?.theme);

            if (hasPermission('SYSTEM_SETTINGS_READ')) {
                const systemResponse = await api.get('/settings/system');
                setSystemSettings(systemResponse.data);
            }
        } catch (error) {
            console.error('Error loading settings:', error);
            toast.error('Failed to load settings');
        } finally {
            setLoading(false);
        }
    };

    const applyThemePreference = (themePreference) => {
        if (!themePreference) return;
        if (themePreference === 'dark') setDarkTheme();
        else if (themePreference === 'light') setLightTheme();
        else if (themePreference === 'auto') {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            prefersDark ? setDarkTheme() : setLightTheme();
        }
    };

    const saveUserSettings = async () => {
        setSaving(true);
        try {
            const response = await api.put('/settings/user', userSettings);
            setUserSettings(response.data);
            applyThemePreference(response.data?.theme);
            toast.success('User settings saved successfully');
        } catch (error) {
            console.error('Error saving user settings:', error);
            toast.error('Failed to save user settings');
        } finally {
            setSaving(false);
        }
    };

    const saveSystemSettings = async () => {
        setSaving(true);
        try {
            const response = await api.put('/settings/system', systemSettings);
            setSystemSettings(response.data);
            toast.success('System settings saved successfully');
        } catch (error) {
            console.error('Error saving system settings:', error);
            toast.error('Failed to save system settings');
        } finally {
            setSaving(false);
        }
    };

    const handleUserSettingChange = (field, value) => {
        setUserSettings(prev => ({ ...prev, [field]: value }));
    };

    const handleSystemSettingChange = (field, value) => {
        setSystemSettings(prev => ({ ...prev, [field]: value }));
    };

    const handleExportSettings = async () => {
        try {
            const response = await api.get('/settings/export');
            const dataStr = JSON.stringify(response.data, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = window.URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `settings-export-${new Date().getTime()}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            toast.success('Settings exported successfully');
        } catch (error) {
            console.error('Error exporting settings:', error);
            toast.error('Failed to export settings');
        }
    };

    const handleImportFileSelect = (e) => {
        const file = e.target.files[0];
        if (file && file.type === 'application/json') {
            setImportFile(file);
        } else {
            toast.error('Please select a valid JSON file');
        }
    };

    const handleImportSettings = async () => {
        if (!importFile) {
            toast.error('Please select a file to import');
            return;
        }

        try {
            const fileContent = await importFile.text();
            const importData = JSON.parse(fileContent);
            
            await api.post(`/settings/import?overwrite=${overwriteOnImport}`, importData);
            toast.success('Settings imported successfully');
            setShowImportModal(false);
            setImportFile(null);
            loadSettings();
        } catch (error) {
            console.error('Error importing settings:', error);
            toast.error(error.response?.data?.error || 'Failed to import settings');
        }
    };

    const loadSystemHealth = async () => {
        try {
            const response = await api.get('/settings/health');
            setSystemHealth(response.data);
        } catch (error) {
            console.error('Error loading system health:', error);
        }
    };

    const loadAuditHistory = async () => {
        try {
            const response = await api.get('/settings/audit?limit=20');
            setAuditHistory(response.data);
        } catch (error) {
            console.error('Error loading audit history:', error);
        }
    };

    const getHealthIcon = (status) => {
        switch (status) {
            case 'HEALTHY': return <FaCheckCircle className="health-icon health-icon--success" />;
            case 'WARNING': return <FaExclamationTriangle className="health-icon health-icon--warning" />;
            case 'CRITICAL': return <FaTimesCircle className="health-icon health-icon--danger" />;
            default: return <FaCheckCircle className="health-icon health-icon--muted" />;
        }
    };

    if (loading) {
        return (
            <div className="reporting-loading">
                <div className="reporting-spinner" />
                <p>Loading settings...</p>
            </div>
        );
    }

    return (
        <section className="reporting-page">
            <div className="reporting-banner" data-animate="fade-up">
                <div className="reporting-banner__content">
                    <div className="reporting-banner__info">
                        <span className="reporting-banner__eyebrow">
                            <FaCog /> System Configuration
                        </span>
                        <h1 className="reporting-banner__title">Settings & Preferences</h1>
                        <p className="reporting-banner__subtitle">
                            Customize your experience and manage system-wide configurations.
                        </p>
                    </div>
                </div>
            </div>

            <div className="reporting-tabs" data-animate="fade-up" data-delay="0.04">
                <button
                    className={`reporting-tab ${activeTab === 'user' ? 'is-active' : ''}`}
                    onClick={() => setActiveTab('user')}
                >
                    <FaUserCog /> User Settings
                </button>
                {hasPermission('SYSTEM_SETTINGS_READ') && (
                    <>
                        <button
                            className={`reporting-tab ${activeTab === 'system' ? 'is-active' : ''}`}
                            onClick={() => setActiveTab('system')}
                        >
                            <FaCog /> System Settings
                        </button>
                        <button
                            className={`reporting-tab ${activeTab === 'health' ? 'is-active' : ''}`}
                            onClick={() => setActiveTab('health')}
                        >
                            <FaHeartbeat /> System Health
                        </button>
                        <button
                            className={`reporting-tab ${activeTab === 'audit' ? 'is-active' : ''}`}
                            onClick={() => setActiveTab('audit')}
                        >
                            <FaHistory /> Audit History
                        </button>
                    </>
                )}
            </div>

            <div className="settings-content">
                {activeTab === 'user' && (
                    <div className="settings-grid" data-animate="fade-up" data-delay="0.08">
                        <div className="reporting-card reporting-card--stretch">
                            <div className="reporting-card__header">
                                <div>
                                    <h2 className="reporting-card__title"><FaPalette /> Appearance</h2>
                                    <p className="reporting-card__subtitle">Customize the look and feel</p>
                                </div>
                            </div>
                            <div className="reporting-card__content">
                                <div className="reporting-filters__grid">
                                    <div className="reporting-form-group">
                                        <label className="reporting-form-label">Theme</label>
                                        <select value={userSettings.theme} onChange={(e) => handleUserSettingChange('theme', e.target.value)} className="reporting-select">
                                            <option value="light">Light</option>
                                            <option value="dark">Dark</option>
                                            <option value="auto">Auto</option>
                                        </select>
                                    </div>
                                    <div className="reporting-form-group">
                                        <label className="reporting-form-label">Language</label>
                                        <select value={userSettings.language} onChange={(e) => handleUserSettingChange('language', e.target.value)} className="reporting-select">
                                            <option value="en">English</option>
                                            <option value="es">Spanish</option>
                                            <option value="fr">French</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="reporting-card reporting-card--stretch">
                            <div className="reporting-card__header">
                                <div>
                                    <h2 className="reporting-card__title"><FaBell /> Notifications</h2>
                                    <p className="reporting-card__subtitle">Manage preferences</p>
                                </div>
                            </div>
                            <div className="reporting-card__content">
                                <div className="settings-checkbox-group">
                                    <label className="settings-checkbox">
                                        <input type="checkbox" checked={userSettings.emailNotifications} onChange={(e) => handleUserSettingChange('emailNotifications', e.target.checked)} />
                                        <span className="settings-checkbox__label">Email Notifications</span>
                                    </label>
                                    <label className="settings-checkbox">
                                        <input type="checkbox" checked={userSettings.smsNotifications} onChange={(e) => handleUserSettingChange('smsNotifications', e.target.checked)} />
                                        <span className="settings-checkbox__label">SMS Notifications</span>
                                    </label>
                                    <label className="settings-checkbox">
                                        <input type="checkbox" checked={userSettings.pushNotifications} onChange={(e) => handleUserSettingChange('pushNotifications', e.target.checked)} />
                                        <span className="settings-checkbox__label">Push Notifications</span>
                                    </label>
                                    <label className="settings-checkbox">
                                        <input type="checkbox" checked={userSettings.desktopNotifications} onChange={(e) => handleUserSettingChange('desktopNotifications', e.target.checked)} />
                                        <span className="settings-checkbox__label">Desktop Notifications</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="reporting-card">
                            <div className="reporting-card__header">
                                <div>
                                    <h2 className="reporting-card__title"><FaEye /> Display</h2>
                                    <p className="reporting-card__subtitle">Configure display preferences</p>
                                </div>
                            </div>
                            <div className="reporting-card__content">
                                <div className="reporting-filters__grid">
                                    <div className="reporting-form-group">
                                        <label className="reporting-form-label">Items Per Page</label>
                                        <input type="number" min="10" max="100" value={userSettings.itemsPerPage} onChange={(e) => handleUserSettingChange('itemsPerPage', parseInt(e.target.value))} className="reporting-input" />
                                    </div>
                                    <div className="reporting-form-group">
                                        <label className="reporting-form-label">Date Format</label>
                                        <select value={userSettings.dateFormat} onChange={(e) => handleUserSettingChange('dateFormat', e.target.value)} className="reporting-select">
                                            <option value="MM/dd/yyyy">MM/DD/YYYY</option>
                                            <option value="dd/MM/yyyy">DD/MM/YYYY</option>
                                            <option value="yyyy-MM-dd">YYYY-MM-DD</option>
                                        </select>
                                    </div>
                                    <div className="reporting-form-group">
                                        <label className="reporting-form-label">Time Format</label>
                                        <select value={userSettings.timeFormat} onChange={(e) => handleUserSettingChange('timeFormat', e.target.value)} className="reporting-select">
                                            <option value="HH:mm">24-hour</option>
                                            <option value="hh:mm a">12-hour</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="reporting-card">
                            <div className="reporting-card__content">
                                <div className="settings-actions">
                                    <button onClick={saveUserSettings} disabled={saving} className="reporting-btn reporting-btn--gold">
                                        <FaSave /> {saving ? 'Saving...' : 'Save User Settings'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'system' && hasPermission('SYSTEM_SETTINGS_READ') && (
                    <div className="settings-grid" data-animate="fade-up" data-delay="0.08">
                        <div className="reporting-card">
                            <div className="reporting-card__header">
                                <div>
                                    <h2 className="reporting-card__title">Company Information</h2>
                                    <p className="reporting-card__subtitle">Basic company details</p>
                                </div>
                            </div>
                            <div className="reporting-card__content">
                                <div className="reporting-filters__grid">
                                    <div className="reporting-form-group">
                                        <label className="reporting-form-label">Company Name</label>
                                        <input type="text" value={systemSettings.companyName} onChange={(e) => handleSystemSettingChange('companyName', e.target.value)} className="reporting-input" required />
                                    </div>
                                    <div className="reporting-form-group">
                                        <label className="reporting-form-label">Company Email</label>
                                        <input type="email" value={systemSettings.companyEmail} onChange={(e) => handleSystemSettingChange('companyEmail', e.target.value)} className="reporting-input" />
                                    </div>
                                    <div className="reporting-form-group">
                                        <label className="reporting-form-label">Company Phone</label>
                                        <input type="text" value={systemSettings.companyPhone} onChange={(e) => handleSystemSettingChange('companyPhone', e.target.value)} className="reporting-input" />
                                    </div>
                                </div>
                                <div className="reporting-form-group">
                                    <label className="reporting-form-label">Company Address</label>
                                    <textarea value={systemSettings.companyAddress} onChange={(e) => handleSystemSettingChange('companyAddress', e.target.value)} className="reporting-textarea" rows="3" />
                                </div>
                            </div>
                        </div>

                        <div className="reporting-card">
                            <div className="reporting-card__header">
                                <div>
                                    <h2 className="reporting-card__title">Security Settings</h2>
                                    <p className="reporting-card__subtitle">System security configuration</p>
                                </div>
                            </div>
                            <div className="reporting-card__content">
                                <div className="reporting-filters__grid">
                                    <div className="reporting-form-group">
                                        <label className="reporting-form-label">Session Timeout (minutes)</label>
                                        <input type="number" min="5" max="480" value={systemSettings.sessionTimeoutMinutes} onChange={(e) => handleSystemSettingChange('sessionTimeoutMinutes', parseInt(e.target.value))} className="reporting-input" />
                                    </div>
                                    <div className="reporting-form-group">
                                        <label className="reporting-form-label">Max Login Attempts</label>
                                        <input type="number" min="3" max="10" value={systemSettings.maxLoginAttempts} onChange={(e) => handleSystemSettingChange('maxLoginAttempts', parseInt(e.target.value))} className="reporting-input" />
                                    </div>
                                </div>
                                <div className="settings-checkbox-group">
                                    <label className="settings-checkbox">
                                        <input type="checkbox" checked={systemSettings.twoFactorAuthRequired} onChange={(e) => handleSystemSettingChange('twoFactorAuthRequired', e.target.checked)} />
                                        <span className="settings-checkbox__label">Require Two-Factor Authentication</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="reporting-card">
                            <div className="reporting-card__content">
                                <div className="settings-actions">
                                    {hasPermission('SYSTEM_SETTINGS_UPDATE') && (
                                        <>
                                            <button onClick={handleExportSettings} className="reporting-btn reporting-btn--secondary">
                                                <FaDownload /> Export Settings
                                            </button>
                                            <button onClick={() => setShowImportModal(true)} className="reporting-btn reporting-btn--secondary">
                                                <FaUpload /> Import Settings
                                            </button>
                                        </>
                                    )}
                                    <button onClick={saveSystemSettings} disabled={saving} className="reporting-btn reporting-btn--gold">
                                        <FaSave /> {saving ? 'Saving...' : 'Save System Settings'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'health' && hasPermission('SYSTEM_SETTINGS_READ') && (
                    <div className="settings-grid" data-animate="fade-up" data-delay="0.08">
                        <div className="reporting-card">
                            <div className="reporting-card__header">
                                <div>
                                    <h2 className="reporting-card__title"><FaHeartbeat /> System Health Monitor</h2>
                                    <p className="reporting-card__subtitle">Real-time system status</p>
                                </div>
                                <button onClick={loadSystemHealth} className="reporting-btn reporting-btn--small">Refresh</button>
                            </div>
                            <div className="reporting-card__content">
                                {systemHealth ? (
                                    <div className="health-grid">
                                        <div className="health-card">
                                            <div className="health-card__header">
                                                {getHealthIcon(systemHealth.database?.status)}
                                                <h3>Database</h3>
                                            </div>
                                            <div className="health-card__stats">
                                                <div className="health-stat">
                                                    <span className="health-stat__label">Status:</span>
                                                    <span className="health-stat__value">{systemHealth.database?.connected ? 'Connected' : 'Disconnected'}</span>
                                                </div>
                                                <div className="health-stat">
                                                    <span className="health-stat__label">Response:</span>
                                                    <span className="health-stat__value">{systemHealth.database?.responseTimeMs}ms</span>
                                                </div>
                                                <div className="health-stat">
                                                    <span className="health-stat__label">Pool:</span>
                                                    <span className="health-stat__value">{systemHealth.database?.connectionPoolActive}/{systemHealth.database?.connectionPoolMax}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="health-card">
                                            <div className="health-card__header">
                                                {getHealthIcon(systemHealth.emailService?.status)}
                                                <h3>Email Service</h3>
                                            </div>
                                            <div className="health-card__stats">
                                                <div className="health-stat">
                                                    <span className="health-stat__label">Status:</span>
                                                    <span className="health-stat__value">{systemHealth.emailService?.available ? 'Available' : 'Unavailable'}</span>
                                                </div>
                                                <div className="health-stat">
                                                    <span className="health-stat__label">Pending:</span>
                                                    <span className="health-stat__value">{systemHealth.emailService?.pendingEmailCount} emails</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="health-card">
                                            <div className="health-card__header">
                                                {getHealthIcon(systemHealth.diskSpace?.status)}
                                                <h3>Disk Space</h3>
                                            </div>
                                            <div className="health-card__stats">
                                                <div className="health-stat">
                                                    <span className="health-stat__label">Total:</span>
                                                    <span className="health-stat__value">{systemHealth.diskSpace?.totalSpaceGB} GB</span>
                                                </div>
                                                <div className="health-stat">
                                                    <span className="health-stat__label">Free:</span>
                                                    <span className="health-stat__value">{systemHealth.diskSpace?.freeSpaceGB} GB</span>
                                                </div>
                                                <div className="health-stat">
                                                    <span className="health-stat__label">Usage:</span>
                                                    <span className="health-stat__value">{systemHealth.diskSpace?.usagePercentage}%</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="health-card">
                                            <div className="health-card__header">
                                                {getHealthIcon(systemHealth.cache?.status)}
                                                <h3>Cache</h3>
                                            </div>
                                            <div className="health-card__stats">
                                                <div className="health-stat">
                                                    <span className="health-stat__label">Hit Rate:</span>
                                                    <span className="health-stat__value">{systemHealth.cache?.hitRate}%</span>
                                                </div>
                                                <div className="health-stat">
                                                    <span className="health-stat__label">Entries:</span>
                                                    <span className="health-stat__value">{systemHealth.cache?.entryCount}</span>
                                                </div>
                                                <div className="health-stat">
                                                    <span className="health-stat__label">Memory:</span>
                                                    <span className="health-stat__value">{systemHealth.cache?.memoryUsagePercent}%</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <p>Loading system health...</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'audit' && hasPermission('SYSTEM_SETTINGS_READ') && (
                    <div className="settings-grid" data-animate="fade-up" data-delay="0.08">
                        <div className="reporting-card">
                            <div className="reporting-card__header">
                                <div>
                                    <h2 className="reporting-card__title"><FaHistory /> Settings Audit History</h2>
                                    <p className="reporting-card__subtitle">Track all settings changes</p>
                                </div>
                                <button onClick={loadAuditHistory} className="reporting-btn reporting-btn--small">Refresh</button>
                            </div>
                            <div className="reporting-card__content">
                                {auditHistory.length > 0 ? (
                                    <div className="reporting-table-wrapper">
                                        <table className="reporting-table">
                                            <thead>
                                                <tr>
                                                    <th>Setting</th>
                                                    <th>Type</th>
                                                    <th>Old Value</th>
                                                    <th>New Value</th>
                                                    <th>Changed By</th>
                                                    <th>Changed At</th>
                                                    <th>IP Address</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {auditHistory.map((audit, index) => (
                                                    <tr key={index}>
                                                        <td>{audit.settingKey}</td>
                                                        <td><span className="reporting-badge">{audit.settingType}</span></td>
                                                        <td className="audit-value">{audit.oldValue || '-'}</td>
                                                        <td className="audit-value">{audit.newValue || '-'}</td>
                                                        <td>{audit.changedBy}</td>
                                                        <td>{new Date(audit.changedAt).toLocaleString()}</td>
                                                        <td>{audit.ipAddress || '-'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <p>No audit history available</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {showImportModal && (
                <div className="modal-overlay" onClick={() => setShowImportModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>Import Settings</h2>
                        <div className="modal-body">
                            <p>Select a settings export file to import:</p>
                            <input type="file" accept=".json" onChange={handleImportFileSelect} className="file-input" />
                            {importFile && <p className="file-selected">Selected: {importFile.name}</p>}
                            <label className="settings-checkbox">
                                <input type="checkbox" checked={overwriteOnImport} onChange={(e) => setOverwriteOnImport(e.target.checked)} />
                                <span className="settings-checkbox__label">Overwrite existing settings</span>
                            </label>
                        </div>
                        <div className="modal-actions">
                            <button onClick={() => setShowImportModal(false)} className="reporting-btn reporting-btn--secondary">Cancel</button>
                            <button onClick={handleImportSettings} className="reporting-btn reporting-btn--gold" disabled={!importFile}>
                                <FaUpload /> Import
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
};

export default Settings;
