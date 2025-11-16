import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useTheme } from '../../hooks/useTheme.js';
import api from '../../api/api.js';
import { toast } from 'react-toastify';
import { FaCog, FaPalette, FaBell, FaEye, FaSave, FaUserCog } from 'react-icons/fa';
import './Settings.css';

const Settings = () => {
    const { user, hasPermission } = useAuth();
    const { setLightTheme, setDarkTheme } = useTheme();
    const [activeTab, setActiveTab] = useState('user');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // User Settings State
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

    // System Settings State (Admin only)
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
                            Personalize themes, notifications, and application behavior to suit your workflow.
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
                    <button
                        className={`reporting-tab ${activeTab === 'system' ? 'is-active' : ''}`}
                        onClick={() => setActiveTab('system')}
                    >
                        <FaCog /> System Settings
                    </button>
                )}
            </div>

            <div className="settings-content">
                {activeTab === 'user' && (
                    <div className="settings-grid" data-animate="fade-up" data-delay="0.08">
                        {/* Appearance Card */}
                        <div className="reporting-card reporting-card--stretch">
                            <div className="reporting-card__header">
                                <div>
                                    <h2 className="reporting-card__title">
                                        <FaPalette /> Appearance
                                    </h2>
                                    <p className="reporting-card__subtitle">Customize the look and feel</p>
                                </div>
                            </div>
                            <div className="reporting-card__content">
                                <div className="reporting-filters__grid">
                                    <div className="reporting-form-group">
                                        <label className="reporting-form-label">Theme</label>
                                        <select
                                            value={userSettings.theme}
                                            onChange={(e) => handleUserSettingChange('theme', e.target.value)}
                                            className="reporting-select"
                                        >
                                            <option value="light">Light</option>
                                            <option value="dark">Dark</option>
                                            <option value="auto">Auto</option>
                                        </select>
                                    </div>
                                    <div className="reporting-form-group">
                                        <label className="reporting-form-label">Language</label>
                                        <select
                                            value={userSettings.language}
                                            onChange={(e) => handleUserSettingChange('language', e.target.value)}
                                            className="reporting-select"
                                        >
                                            <option value="en">English</option>
                                            <option value="es">Spanish</option>
                                            <option value="fr">French</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Notifications Card */}
                        <div className="reporting-card reporting-card--stretch">
                            <div className="reporting-card__header">
                                <div>
                                    <h2 className="reporting-card__title">
                                        <FaBell /> Notifications
                                    </h2>
                                    <p className="reporting-card__subtitle">Manage your notification preferences</p>
                                </div>
                            </div>
                            <div className="reporting-card__content">
                                <div className="settings-checkbox-group">
                                    <label className="settings-checkbox">
                                        <input
                                            type="checkbox"
                                            checked={userSettings.emailNotifications}
                                            onChange={(e) => handleUserSettingChange('emailNotifications', e.target.checked)}
                                        />
                                        <span className="settings-checkbox__label">Email Notifications</span>
                                    </label>
                                    <label className="settings-checkbox">
                                        <input
                                            type="checkbox"
                                            checked={userSettings.smsNotifications}
                                            onChange={(e) => handleUserSettingChange('smsNotifications', e.target.checked)}
                                        />
                                        <span className="settings-checkbox__label">SMS Notifications</span>
                                    </label>
                                    <label className="settings-checkbox">
                                        <input
                                            type="checkbox"
                                            checked={userSettings.pushNotifications}
                                            onChange={(e) => handleUserSettingChange('pushNotifications', e.target.checked)}
                                        />
                                        <span className="settings-checkbox__label">Push Notifications</span>
                                    </label>
                                    <label className="settings-checkbox">
                                        <input
                                            type="checkbox"
                                            checked={userSettings.desktopNotifications}
                                            onChange={(e) => handleUserSettingChange('desktopNotifications', e.target.checked)}
                                        />
                                        <span className="settings-checkbox__label">Desktop Notifications</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Display Card */}
                        <div className="reporting-card">
                            <div className="reporting-card__header">
                                <div>
                                    <h2 className="reporting-card__title">
                                        <FaEye /> Display
                                    </h2>
                                    <p className="reporting-card__subtitle">Configure display preferences</p>
                                </div>
                            </div>
                            <div className="reporting-card__content">
                                <div className="reporting-filters__grid">
                                    <div className="reporting-form-group">
                                        <label className="reporting-form-label">Items Per Page</label>
                                        <input
                                            type="number"
                                            min="10"
                                            max="100"
                                            value={userSettings.itemsPerPage}
                                            onChange={(e) => handleUserSettingChange('itemsPerPage', parseInt(e.target.value))}
                                            className="reporting-input"
                                        />
                                    </div>
                                    <div className="reporting-form-group">
                                        <label className="reporting-form-label">Date Format</label>
                                        <select
                                            value={userSettings.dateFormat}
                                            onChange={(e) => handleUserSettingChange('dateFormat', e.target.value)}
                                            className="reporting-select"
                                        >
                                            <option value="MM/dd/yyyy">MM/DD/YYYY</option>
                                            <option value="dd/MM/yyyy">DD/MM/YYYY</option>
                                            <option value="yyyy-MM-dd">YYYY-MM-DD</option>
                                        </select>
                                    </div>
                                    <div className="reporting-form-group">
                                        <label className="reporting-form-label">Time Format</label>
                                        <select
                                            value={userSettings.timeFormat}
                                            onChange={(e) => handleUserSettingChange('timeFormat', e.target.value)}
                                            className="reporting-select"
                                        >
                                            <option value="HH:mm">24-hour</option>
                                            <option value="hh:mm a">12-hour</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="reporting-card">
                            <div className="reporting-card__content">
                                <div className="settings-actions">
                                    <button
                                        onClick={saveUserSettings}
                                        disabled={saving}
                                        className="reporting-btn reporting-btn--gold"
                                    >
                                        <FaSave /> {saving ? 'Saving...' : 'Save User Settings'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'system' && hasPermission('SYSTEM_SETTINGS_READ') && (
                    <div className="settings-grid" data-animate="fade-up" data-delay="0.08">
                        {/* Company Information */}
                        <div className="reporting-card">
                            <div className="reporting-card__header">
                                <div>
                                    <h2 className="reporting-card__title">Company Information</h2>
                                    <p className="reporting-card__subtitle">Basic organization details</p>
                                </div>
                            </div>
                            <div className="reporting-card__content">
                                <div className="reporting-filters__grid">
                                    <div className="reporting-form-group">
                                        <label className="reporting-form-label">Company Name</label>
                                        <input
                                            value={systemSettings.companyName}
                                            onChange={(e) => handleSystemSettingChange('companyName', e.target.value)}
                                            className="reporting-input"
                                            required
                                        />
                                    </div>
                                    <div className="reporting-form-group">
                                        <label className="reporting-form-label">Company Email</label>
                                        <input
                                            type="email"
                                            value={systemSettings.companyEmail}
                                            onChange={(e) => handleSystemSettingChange('companyEmail', e.target.value)}
                                            className="reporting-input"
                                        />
                                    </div>
                                    <div className="reporting-form-group">
                                        <label className="reporting-form-label">Company Phone</label>
                                        <input
                                            value={systemSettings.companyPhone}
                                            onChange={(e) => handleSystemSettingChange('companyPhone', e.target.value)}
                                            className="reporting-input"
                                        />
                                    </div>
                                </div>
                                <div className="reporting-form-group">
                                    <label className="reporting-form-label">Company Address</label>
                                    <textarea
                                        value={systemSettings.companyAddress}
                                        onChange={(e) => handleSystemSettingChange('companyAddress', e.target.value)}
                                        className="reporting-textarea"
                                        rows="3"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Security Settings */}
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
                                        <input
                                            type="number"
                                            min="5"
                                            max="480"
                                            value={systemSettings.sessionTimeoutMinutes}
                                            onChange={(e) => handleSystemSettingChange('sessionTimeoutMinutes', parseInt(e.target.value))}
                                            className="reporting-input"
                                        />
                                    </div>
                                    <div className="reporting-form-group">
                                        <label className="reporting-form-label">Max Login Attempts</label>
                                        <input
                                            type="number"
                                            min="3"
                                            max="10"
                                            value={systemSettings.maxLoginAttempts}
                                            onChange={(e) => handleSystemSettingChange('maxLoginAttempts', parseInt(e.target.value))}
                                            className="reporting-input"
                                        />
                                    </div>
                                </div>
                                <div className="settings-checkbox-group">
                                    <label className="settings-checkbox">
                                        <input
                                            type="checkbox"
                                            checked={systemSettings.twoFactorAuthRequired}
                                            onChange={(e) => handleSystemSettingChange('twoFactorAuthRequired', e.target.checked)}
                                        />
                                        <span className="settings-checkbox__label">Require Two-Factor Authentication</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="reporting-card">
                            <div className="reporting-card__content">
                                <div className="settings-actions">
                                    <button
                                        onClick={saveSystemSettings}
                                        disabled={saving}
                                        className="reporting-btn reporting-btn--gold"
                                    >
                                        <FaSave /> {saving ? 'Saving...' : 'Save System Settings'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
};

export default Settings;