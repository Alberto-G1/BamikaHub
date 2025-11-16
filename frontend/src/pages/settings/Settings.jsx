import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import api from '../../api/api.js';
import { toast } from 'react-toastify';
import Button from '../../components/common/Button.jsx';
import Card from '../../components/common/Card.jsx';
import Input from '../../components/common/Input.jsx';
import Modal from '../../components/common/Modal.jsx';
import Spinner from '../../components/common/Spinner.jsx';
import { useTheme } from '../../hooks/useTheme';
import './Settings.css';

const Settings = () => {
    const { user, hasPermission } = useAuth();
    const { setLightTheme, setDarkTheme } = useTheme();
    const [activeTab, setActiveTab] = useState('user');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const applyThemePreference = (themePreference) => {
        if (!themePreference) {
            return;
        }

        if (themePreference === 'dark') {
            setDarkTheme();
        } else if (themePreference === 'light') {
            setLightTheme();
        } else if (themePreference === 'auto') {
            const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
            if (prefersDark) {
                setDarkTheme();
            } else {
                setLightTheme();
            }
        }
    };

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
            // Load user settings
            const userResponse = await api.get('/settings/user');
            setUserSettings(userResponse.data);
            applyThemePreference(userResponse.data?.theme);

            // Load system settings if admin
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
        setUserSettings(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSystemSettingChange = (field, value) => {
        setSystemSettings(prev => ({
            ...prev,
            [field]: value
        }));
    };

    if (loading) {
        return (
            <div className="settings-loading">
                <Spinner />
                <p>Loading settings...</p>
            </div>
        );
    }

    return (
        <div className="settings-page">
            <div className="settings-header">
                <h1>Settings</h1>
                <p>Manage your preferences and system configuration</p>
            </div>

            <div className="settings-tabs">
                <button
                    className={`tab-button ${activeTab === 'user' ? 'active' : ''}`}
                    onClick={() => setActiveTab('user')}
                >
                    User Settings
                </button>
                {hasPermission('SYSTEM_SETTINGS_READ') && (
                    <button
                        className={`tab-button ${activeTab === 'system' ? 'active' : ''}`}
                        onClick={() => setActiveTab('system')}
                    >
                        System Settings
                    </button>
                )}
            </div>

            <div className="settings-content">
                {activeTab === 'user' && (
                    <Card className="settings-card">
                        <div className="card-header">
                            <h2>User Preferences</h2>
                        </div>
                        <div className="card-body">
                            <div className="settings-section">
                                <h3>Appearance</h3>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Theme</label>
                                        <select
                                            value={userSettings.theme}
                                            onChange={(e) => handleUserSettingChange('theme', e.target.value)}
                                        >
                                            <option value="light">Light</option>
                                            <option value="dark">Dark</option>
                                            <option value="auto">Auto</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Language</label>
                                        <select
                                            value={userSettings.language}
                                            onChange={(e) => handleUserSettingChange('language', e.target.value)}
                                        >
                                            <option value="en">English</option>
                                            <option value="es">Spanish</option>
                                            <option value="fr">French</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="settings-section">
                                <h3>Notifications</h3>
                                <div className="checkbox-group">
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={userSettings.emailNotifications}
                                            onChange={(e) => handleUserSettingChange('emailNotifications', e.target.checked)}
                                        />
                                        Email Notifications
                                    </label>
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={userSettings.smsNotifications}
                                            onChange={(e) => handleUserSettingChange('smsNotifications', e.target.checked)}
                                        />
                                        SMS Notifications
                                    </label>
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={userSettings.pushNotifications}
                                            onChange={(e) => handleUserSettingChange('pushNotifications', e.target.checked)}
                                        />
                                        Push Notifications
                                    </label>
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={userSettings.desktopNotifications}
                                            onChange={(e) => handleUserSettingChange('desktopNotifications', e.target.checked)}
                                        />
                                        Desktop Notifications
                                    </label>
                                </div>
                            </div>

                            <div className="settings-section">
                                <h3>Display</h3>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Items Per Page</label>
                                        <Input
                                            type="number"
                                            min="10"
                                            max="100"
                                            value={userSettings.itemsPerPage}
                                            onChange={(e) => handleUserSettingChange('itemsPerPage', parseInt(e.target.value))}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Date Format</label>
                                        <select
                                            value={userSettings.dateFormat}
                                            onChange={(e) => handleUserSettingChange('dateFormat', e.target.value)}
                                        >
                                            <option value="MM/dd/yyyy">MM/DD/YYYY</option>
                                            <option value="dd/MM/yyyy">DD/MM/YYYY</option>
                                            <option value="yyyy-MM-dd">YYYY-MM-DD</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Time Format</label>
                                        <select
                                            value={userSettings.timeFormat}
                                            onChange={(e) => handleUserSettingChange('timeFormat', e.target.value)}
                                        >
                                            <option value="HH:mm">24-hour</option>
                                            <option value="hh:mm a">12-hour</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="settings-section">
                                <h3>Behavior</h3>
                                <div className="checkbox-group">
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={userSettings.autoSaveEnabled}
                                            onChange={(e) => handleUserSettingChange('autoSaveEnabled', e.target.checked)}
                                        />
                                        Enable Auto-save
                                    </label>
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={userSettings.showWelcomeMessage}
                                            onChange={(e) => handleUserSettingChange('showWelcomeMessage', e.target.checked)}
                                        />
                                        Show Welcome Message
                                    </label>
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={userSettings.compactView}
                                            onChange={(e) => handleUserSettingChange('compactView', e.target.checked)}
                                        />
                                        Compact View
                                    </label>
                                </div>
                                {userSettings.autoSaveEnabled && (
                                    <div className="form-group">
                                        <label>Auto-save Interval (minutes)</label>
                                        <Input
                                            type="number"
                                            min="1"
                                            max="30"
                                            value={userSettings.autoSaveIntervalMinutes}
                                            onChange={(e) => handleUserSettingChange('autoSaveIntervalMinutes', parseInt(e.target.value))}
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="settings-actions">
                                <Button
                                    onClick={saveUserSettings}
                                    disabled={saving}
                                    className="primary"
                                >
                                    {saving ? 'Saving...' : 'Save Settings'}
                                </Button>
                            </div>
                        </div>
                    </Card>
                )}

                {activeTab === 'system' && hasPermission('SYSTEM_SETTINGS_READ') && (
                    <Card className="settings-card">
                        <div className="card-header">
                            <h2>System Configuration</h2>
                        </div>
                        <div className="card-body">
                            <div className="settings-section">
                                <h3>Company Information</h3>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Company Name *</label>
                                        <Input
                                            value={systemSettings.companyName}
                                            onChange={(e) => handleSystemSettingChange('companyName', e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Company Email</label>
                                        <Input
                                            type="email"
                                            value={systemSettings.companyEmail}
                                            onChange={(e) => handleSystemSettingChange('companyEmail', e.target.value)}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Company Phone</label>
                                        <Input
                                            value={systemSettings.companyPhone}
                                            onChange={(e) => handleSystemSettingChange('companyPhone', e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Company Address</label>
                                    <Input
                                        value={systemSettings.companyAddress}
                                        onChange={(e) => handleSystemSettingChange('companyAddress', e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="settings-section">
                                <h3>Localization</h3>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Timezone</label>
                                        <select
                                            value={systemSettings.timezone}
                                            onChange={(e) => handleSystemSettingChange('timezone', e.target.value)}
                                        >
                                            <option value="UTC">UTC</option>
                                            <option value="America/New_York">Eastern Time</option>
                                            <option value="America/Chicago">Central Time</option>
                                            <option value="America/Denver">Mountain Time</option>
                                            <option value="America/Los_Angeles">Pacific Time</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Currency</label>
                                        <select
                                            value={systemSettings.currency}
                                            onChange={(e) => handleSystemSettingChange('currency', e.target.value)}
                                        >
                                            <option value="USD">USD</option>
                                            <option value="EUR">EUR</option>
                                            <option value="GBP">GBP</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>System Language</label>
                                        <select
                                            value={systemSettings.language}
                                            onChange={(e) => handleSystemSettingChange('language', e.target.value)}
                                        >
                                            <option value="en">English</option>
                                            <option value="es">Spanish</option>
                                            <option value="fr">French</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="settings-section">
                                <h3>Security Settings</h3>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Session Timeout (minutes)</label>
                                        <Input
                                            type="number"
                                            min="5"
                                            max="480"
                                            value={systemSettings.sessionTimeoutMinutes}
                                            onChange={(e) => handleSystemSettingChange('sessionTimeoutMinutes', parseInt(e.target.value))}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Max Login Attempts</label>
                                        <Input
                                            type="number"
                                            min="3"
                                            max="10"
                                            value={systemSettings.maxLoginAttempts}
                                            onChange={(e) => handleSystemSettingChange('maxLoginAttempts', parseInt(e.target.value))}
                                        />
                                    </div>
                                </div>
                                <div className="checkbox-group">
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={systemSettings.twoFactorAuthRequired}
                                            onChange={(e) => handleSystemSettingChange('twoFactorAuthRequired', e.target.checked)}
                                        />
                                        Require Two-Factor Authentication
                                    </label>
                                </div>
                            </div>

                            <div className="settings-section">
                                <h3>System Notifications</h3>
                                <div className="checkbox-group">
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={systemSettings.emailNotificationsEnabled}
                                            onChange={(e) => handleSystemSettingChange('emailNotificationsEnabled', e.target.checked)}
                                        />
                                        Email Notifications
                                    </label>
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={systemSettings.smsNotificationsEnabled}
                                            onChange={(e) => handleSystemSettingChange('smsNotificationsEnabled', e.target.checked)}
                                        />
                                        SMS Notifications
                                    </label>
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={systemSettings.pushNotificationsEnabled}
                                            onChange={(e) => handleSystemSettingChange('pushNotificationsEnabled', e.target.checked)}
                                        />
                                        Push Notifications
                                    </label>
                                </div>
                            </div>

                            <div className="settings-section">
                                <h3>Maintenance Mode</h3>
                                <div className="checkbox-group">
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={systemSettings.maintenanceMode}
                                            onChange={(e) => handleSystemSettingChange('maintenanceMode', e.target.checked)}
                                        />
                                        Enable Maintenance Mode
                                    </label>
                                </div>
                                {systemSettings.maintenanceMode && (
                                    <div className="form-group">
                                        <label>Maintenance Message</label>
                                        <textarea
                                            value={systemSettings.maintenanceMessage}
                                            onChange={(e) => handleSystemSettingChange('maintenanceMessage', e.target.value)}
                                            placeholder="Enter maintenance message..."
                                            rows="3"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="settings-actions">
                                <Button
                                    onClick={saveSystemSettings}
                                    disabled={saving}
                                    className="primary"
                                >
                                    {saving ? 'Saving...' : 'Save System Settings'}
                                </Button>
                            </div>
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
};

export default Settings;