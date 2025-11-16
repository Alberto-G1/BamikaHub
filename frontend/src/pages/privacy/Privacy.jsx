import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import api from '../../api/api.js';
import { toast } from 'react-toastify';
import { FaShieldAlt, FaUserShield, FaDatabase, FaFileAlt, FaDownload, FaTrash, FaCheck, FaTimes } from 'react-icons/fa';
import './Privacy.css';

const Privacy = () => {
    const { user, hasPermission } = useAuth();
    const [activeTab, setActiveTab] = useState('settings');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Privacy settings state
    const [privacySettings, setPrivacySettings] = useState({
        profileVisible: true,
        activityVisible: true,
        statisticsVisible: false,
        essentialCookies: true,
        analyticsCookies: false,
        marketingCookies: false,
        functionalCookies: false,
        autoDeleteOldData: false,
        dataRetentionDays: 365,
        consents: {}
    });

    // Data export/deletion states
    const [exportRequests, setExportRequests] = useState([]);
    const [deletionRequests, setDeletionRequests] = useState([]);
    const [currentPolicy, setCurrentPolicy] = useState(null);

    // Modals
    const [showExportModal, setShowExportModal] = useState(false);
    const [showDeletionModal, setShowDeletionModal] = useState(false);

    // Form states
    const [exportForm, setExportForm] = useState({
        requestType: 'PERSONAL_DATA',
        format: 'JSON',
        reason: ''
    });

    const [deletionForm, setDeletionForm] = useState({
        deletionType: 'SPECIFIC_DATA',
        dataCategories: [],
        reason: ''
    });

    useEffect(() => {
        loadPrivacyData();
    }, []);

    const loadPrivacyData = async () => {
        setLoading(true);
        try {
            const [settingsResponse, exportResponse, deletionResponse, policyResponse] = await Promise.all([
                api.get('/privacy/settings'),
                api.get('/privacy/data/export/requests?page=0&size=10'),
                api.get('/privacy/data/delete/requests?page=0&size=10'),
                api.get('/privacy/policy')
            ]);

            setPrivacySettings(settingsResponse.data);
            setExportRequests(exportResponse.data.content || []);
            setDeletionRequests(deletionResponse.data.content || []);
            setCurrentPolicy(policyResponse.data);
        } catch (error) {
            console.error('Error loading privacy data:', error);
            toast.error('Failed to load privacy data');
        } finally {
            setLoading(false);
        }
    };

    const handleSettingsUpdate = async () => {
        setSaving(true);
        try {
            const response = await api.put('/privacy/settings', privacySettings);
            setPrivacySettings(response.data);
            toast.success('Privacy settings updated successfully');
        } catch (error) {
            console.error('Error updating privacy settings:', error);
            toast.error('Failed to update privacy settings');
        } finally {
            setSaving(false);
        }
    };

    const handleExportRequest = async () => {
        try {
            await api.post('/privacy/data/export', exportForm);
            toast.success('Data export request submitted successfully');
            setShowExportModal(false);
            setExportForm({ requestType: 'PERSONAL_DATA', format: 'JSON', reason: '' });
            loadPrivacyData();
        } catch (error) {
            console.error('Error requesting data export:', error);
            toast.error('Failed to submit data export request');
        }
    };

    const handleDeletionRequest = async () => {
        try {
            await api.post('/privacy/data/delete', deletionForm);
            toast.success('Data deletion request submitted successfully');
            setShowDeletionModal(false);
            setDeletionForm({ deletionType: 'SPECIFIC_DATA', dataCategories: [], reason: '' });
            loadPrivacyData();
        } catch (error) {
            console.error('Error requesting data deletion:', error);
            toast.error('Failed to submit data deletion request');
        }
    };

    const handleConsentChange = async (consentType, granted) => {
        try {
            if (granted) {
                await api.post(`/privacy/consents/${consentType}`, null, {
                    params: {
                        version: '1.0',
                        consentText: `Consent for ${consentType.replace(/_/g, ' ').toLowerCase()}`
                    }
                });
            } else {
                await api.delete(`/privacy/consents/${consentType}`);
            }

            setPrivacySettings(prev => ({
                ...prev,
                consents: {
                    ...prev.consents,
                    [consentType]: {
                        ...prev.consents[consentType],
                        granted,
                        grantedAt: granted ? new Date().toISOString() : null
                    }
                }
            }));

            toast.success(`Consent ${granted ? 'granted' : 'revoked'} successfully`);
        } catch (error) {
            console.error('Error updating consent:', error);
            toast.error('Failed to update consent');
        }
    };

    const formatDateTime = (dateTime) => {
        return new Date(dateTime).toLocaleString();
    };

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'completed': return 'success';
            case 'approved':
            case 'processing': return 'info';
            case 'pending': return 'warning';
            case 'rejected':
            case 'failed': return 'danger';
            default: return 'secondary';
        }
    };

    const dataCategories = [
        { value: 'PROFILE', label: 'Profile Information' },
        { value: 'ACTIVITY', label: 'Activity Logs' },
        { value: 'FILES', label: 'Uploaded Files' },
        { value: 'MESSAGES', label: 'Messages & Communications' },
        { value: 'SETTINGS', label: 'Settings & Preferences' }
    ];

    if (loading) {
        return (
            <div className="reporting-loading">
                <div className="reporting-spinner" />
                <p>Loading privacy information...</p>
            </div>
        );
    }

    return (
        <section className="reporting-page">
            <div className="reporting-banner" data-animate="fade-up">
                <div className="reporting-banner__content">
                    <div className="reporting-banner__info">
                        <span className="reporting-banner__eyebrow">
                            <FaShieldAlt /> Data Protection
                        </span>
                        <h1 className="reporting-banner__title">Privacy Center</h1>
                        <p className="reporting-banner__subtitle">
                            Control your data privacy, manage consents, and exercise your data rights. 
                            Your privacy is our priority.
                        </p>
                    </div>
                </div>
            </div>

            <div className="reporting-tabs" data-animate="fade-up" data-delay="0.04">
                <button
                    className={`reporting-tab ${activeTab === 'settings' ? 'is-active' : ''}`}
                    onClick={() => setActiveTab('settings')}
                >
                    <FaUserShield /> Privacy Settings
                </button>
                <button
                    className={`reporting-tab ${activeTab === 'consents' ? 'is-active' : ''}`}
                    onClick={() => setActiveTab('consents')}
                >
                    <FaCheck /> Consents
                </button>
                <button
                    className={`reporting-tab ${activeTab === 'data' ? 'is-active' : ''}`}
                    onClick={() => setActiveTab('data')}
                >
                    <FaDatabase /> Data Management
                </button>
                <button
                    className={`reporting-tab ${activeTab === 'policy' ? 'is-active' : ''}`}
                    onClick={() => setActiveTab('policy')}
                >
                    <FaFileAlt /> Privacy Policy
                </button>
            </div>

            <div className="privacy-content">
                {activeTab === 'settings' && (
                    <div className="privacy-grid" data-animate="fade-up" data-delay="0.08">
                        {/* Data Sharing Preferences */}
                        <div className="reporting-card">
                            <div className="reporting-card__header">
                                <div>
                                    <h2 className="reporting-card__title">Data Sharing Preferences</h2>
                                    <p className="reporting-card__subtitle">Control what information is visible to others</p>
                                </div>
                            </div>
                            <div className="reporting-card__content">
                                <div className="privacy-checkbox-group">
                                    <label className="privacy-checkbox">
                                        <input
                                            type="checkbox"
                                            checked={privacySettings.profileVisible}
                                            onChange={(e) => setPrivacySettings(prev => ({...prev, profileVisible: e.target.checked}))}
                                        />
                                        <span className="privacy-checkbox__label">
                                            <strong>Profile Visibility</strong>
                                            <span>Allow others to see your profile information</span>
                                        </span>
                                    </label>
                                    <label className="privacy-checkbox">
                                        <input
                                            type="checkbox"
                                            checked={privacySettings.activityVisible}
                                            onChange={(e) => setPrivacySettings(prev => ({...prev, activityVisible: e.target.checked}))}
                                        />
                                        <span className="privacy-checkbox__label">
                                            <strong>Activity Visibility</strong>
                                            <span>Show your activity and login history to others</span>
                                        </span>
                                    </label>
                                    <label className="privacy-checkbox">
                                        <input
                                            type="checkbox"
                                            checked={privacySettings.statisticsVisible}
                                            onChange={(e) => setPrivacySettings(prev => ({...prev, statisticsVisible: e.target.checked}))}
                                        />
                                        <span className="privacy-checkbox__label">
                                            <strong>Statistics Visibility</strong>
                                            <span>Display usage statistics and analytics</span>
                                        </span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Cookie Preferences */}
                        <div className="reporting-card">
                            <div className="reporting-card__header">
                                <div>
                                    <h2 className="reporting-card__title">Cookie Preferences</h2>
                                    <p className="reporting-card__subtitle">Manage your cookie settings</p>
                                </div>
                            </div>
                            <div className="reporting-card__content">
                                <div className="privacy-checkbox-group">
                                    <label className="privacy-checkbox privacy-checkbox--disabled">
                                        <input
                                            type="checkbox"
                                            checked={privacySettings.essentialCookies}
                                            onChange={(e) => setPrivacySettings(prev => ({...prev, essentialCookies: e.target.checked}))}
                                            disabled
                                        />
                                        <span className="privacy-checkbox__label">
                                            <strong>Essential Cookies</strong>
                                            <span>Required for basic website functionality</span>
                                        </span>
                                    </label>
                                    <label className="privacy-checkbox">
                                        <input
                                            type="checkbox"
                                            checked={privacySettings.analyticsCookies}
                                            onChange={(e) => setPrivacySettings(prev => ({...prev, analyticsCookies: e.target.checked}))}
                                        />
                                        <span className="privacy-checkbox__label">
                                            <strong>Analytics Cookies</strong>
                                            <span>Help us improve our services</span>
                                        </span>
                                    </label>
                                    <label className="privacy-checkbox">
                                        <input
                                            type="checkbox"
                                            checked={privacySettings.marketingCookies}
                                            onChange={(e) => setPrivacySettings(prev => ({...prev, marketingCookies: e.target.checked}))}
                                        />
                                        <span className="privacy-checkbox__label">
                                            <strong>Marketing Cookies</strong>
                                            <span>Used for personalized advertising</span>
                                        </span>
                                    </label>
                                    <label className="privacy-checkbox">
                                        <input
                                            type="checkbox"
                                            checked={privacySettings.functionalCookies}
                                            onChange={(e) => setPrivacySettings(prev => ({...prev, functionalCookies: e.target.checked}))}
                                        />
                                        <span className="privacy-checkbox__label">
                                            <strong>Functional Cookies</strong>
                                            <span>Enhance your browsing experience</span>
                                        </span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Data Retention */}
                        <div className="reporting-card">
                            <div className="reporting-card__header">
                                <div>
                                    <h2 className="reporting-card__title">Data Retention</h2>
                                    <p className="reporting-card__subtitle">Control how long your data is stored</p>
                                </div>
                            </div>
                            <div className="reporting-card__content">
                                <div className="privacy-checkbox-group">
                                    <label className="privacy-checkbox">
                                        <input
                                            type="checkbox"
                                            checked={privacySettings.autoDeleteOldData}
                                            onChange={(e) => setPrivacySettings(prev => ({...prev, autoDeleteOldData: e.target.checked}))}
                                        />
                                        <span className="privacy-checkbox__label">
                                            <strong>Auto-delete Old Data</strong>
                                            <span>Automatically delete data older than the retention period</span>
                                        </span>
                                    </label>
                                </div>
                                {privacySettings.autoDeleteOldData && (
                                    <div className="reporting-form-group">
                                        <label className="reporting-form-label">Data Retention Period (Days)</label>
                                        <input
                                            type="number"
                                            min="30"
                                            max="3650"
                                            value={privacySettings.dataRetentionDays}
                                            onChange={(e) => setPrivacySettings(prev => ({...prev, dataRetentionDays: parseInt(e.target.value)}))}
                                            className="reporting-input"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Save Actions */}
                        <div className="reporting-card">
                            <div className="reporting-card__content">
                                <div className="privacy-actions">
                                    <button
                                        onClick={handleSettingsUpdate}
                                        disabled={saving}
                                        className="reporting-btn reporting-btn--gold"
                                    >
                                        <FaCheck /> {saving ? 'Saving...' : 'Save Privacy Settings'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'consents' && (
                    <div className="privacy-grid" data-animate="fade-up" data-delay="0.08">
                        <div className="reporting-card">
                            <div className="reporting-card__header">
                                <div>
                                    <h2 className="reporting-card__title">Data Processing Consents</h2>
                                    <p className="reporting-card__subtitle">Manage your data processing permissions</p>
                                </div>
                            </div>
                            <div className="reporting-card__content">
                                <div className="consents-list">
                                    {Object.entries(privacySettings.consents || {}).map(([consentType, consent]) => (
                                        <div key={consentType} className="consent-item">
                                            <div className="consent-info">
                                                <h4>{consentType.replace(/_/g, ' ')}</h4>
                                                <p>{consent.consentText}</p>
                                                {consent.granted && consent.grantedAt && (
                                                    <small className="consent-date">
                                                        Granted on {formatDateTime(consent.grantedAt)}
                                                    </small>
                                                )}
                                            </div>
                                            <label className="privacy-toggle">
                                                <input
                                                    type="checkbox"
                                                    checked={consent.granted || false}
                                                    onChange={(e) => handleConsentChange(consentType, e.target.checked)}
                                                />
                                                <span className="privacy-toggle__slider"></span>
                                            </label>
                                        </div>
                                    ))}
                                    {Object.keys(privacySettings.consents || {}).length === 0 && (
                                        <div className="reporting-empty-state">
                                            <FaTimes className="empty-icon" />
                                            <p>No consents found. Consents will appear here when you interact with privacy-related features.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'data' && (
                    <div className="privacy-grid" data-animate="fade-up" data-delay="0.08">
                        {/* Data Actions */}
                        <div className="reporting-card">
                            <div className="reporting-card__header">
                                <div>
                                    <h2 className="reporting-card__title">Data Rights</h2>
                                    <p className="reporting-card__subtitle">Exercise your data protection rights</p>
                                </div>
                            </div>
                            <div className="reporting-card__content">
                                <div className="data-actions-grid">
                                    <div className="data-action-card">
                                        <div className="data-action-icon reporting-banner__meta-icon reporting-banner__meta-icon--blue">
                                            <FaDownload />
                                        </div>
                                        <div className="data-action-content">
                                            <h3>Export Your Data</h3>
                                            <p>Download a copy of your personal data in your preferred format</p>
                                            <button
                                                onClick={() => setShowExportModal(true)}
                                                className="reporting-btn reporting-btn--blue"
                                            >
                                                Request Export
                                            </button>
                                        </div>
                                    </div>
                                    <div className="data-action-card">
                                        <div className="data-action-icon reporting-banner__meta-icon reporting-banner__meta-icon--red">
                                            <FaTrash />
                                        </div>
                                        <div className="data-action-content">
                                            <h3>Delete Your Data</h3>
                                            <p>Request deletion of your personal data from our systems</p>
                                            <button
                                                onClick={() => setShowDeletionModal(true)}
                                                className="reporting-btn reporting-btn--red"
                                            >
                                                Request Deletion
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Export Requests */}
                        <div className="reporting-card">
                            <div className="reporting-card__header">
                                <div>
                                    <h2 className="reporting-card__title">Data Export Requests</h2>
                                    <p className="reporting-card__subtitle">Track your data export requests</p>
                                </div>
                                <span className="reporting-badge reporting-badge--info">{exportRequests.length} Requests</span>
                            </div>
                            <div className="reporting-card__content">
                                {exportRequests.length === 0 ? (
                                    <div className="reporting-empty-state">
                                        <p>No data export requests found.</p>
                                    </div>
                                ) : (
                                    <div className="reporting-table-container">
                                        <table className="reporting-table">
                                            <thead>
                                                <tr>
                                                    <th>Type</th>
                                                    <th>Format</th>
                                                    <th>Requested</th>
                                                    <th>Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {exportRequests.map((request, index) => (
                                                    <tr key={index}>
                                                        <td>{request.requestType?.replace(/_/g, ' ')}</td>
                                                        <td>{request.format}</td>
                                                        <td>{formatDateTime(request.requestedAt)}</td>
                                                        <td>
                                                            <span className={`reporting-badge reporting-badge--${getStatusColor(request.status)}`}>
                                                                {request.status}
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

                        {/* Deletion Requests */}
                        <div className="reporting-card">
                            <div className="reporting-card__header">
                                <div>
                                    <h2 className="reporting-card__title">Data Deletion Requests</h2>
                                    <p className="reporting-card__subtitle">Track your data deletion requests</p>
                                </div>
                                <span className="reporting-badge reporting-badge--info">{deletionRequests.length} Requests</span>
                            </div>
                            <div className="reporting-card__content">
                                {deletionRequests.length === 0 ? (
                                    <div className="reporting-empty-state">
                                        <p>No data deletion requests found.</p>
                                    </div>
                                ) : (
                                    <div className="reporting-table-container">
                                        <table className="reporting-table">
                                            <thead>
                                                <tr>
                                                    <th>Type</th>
                                                    <th>Categories</th>
                                                    <th>Requested</th>
                                                    <th>Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {deletionRequests.map((request, index) => (
                                                    <tr key={index}>
                                                        <td>{request.deletionType?.replace(/_/g, ' ')}</td>
                                                        <td>
                                                            {Array.isArray(request.dataCategories) 
                                                                ? request.dataCategories.join(', ') 
                                                                : request.dataCategories
                                                            }
                                                        </td>
                                                        <td>{formatDateTime(request.requestedAt)}</td>
                                                        <td>
                                                            <span className={`reporting-badge reporting-badge--${getStatusColor(request.status)}`}>
                                                                {request.status}
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

                {activeTab === 'policy' && (
                    <div className="privacy-grid" data-animate="fade-up" data-delay="0.08">
                        <div className="reporting-card">
                            <div className="reporting-card__header">
                                <div>
                                    <h2 className="reporting-card__title">Privacy Policy</h2>
                                    <p className="reporting-card__subtitle">Our commitment to protecting your data</p>
                                </div>
                            </div>
                            <div className="reporting-card__content">
                                {currentPolicy ? (
                                    <div className="policy-content">
                                        <div className="policy-header">
                                            <h3>{currentPolicy.title}</h3>
                                            <div className="policy-meta">
                                                <span className="reporting-badge reporting-badge--info">
                                                    Version {currentPolicy.version}
                                                </span>
                                                <span>Effective: {formatDateTime(currentPolicy.effectiveDate)}</span>
                                            </div>
                                        </div>
                                        <div className="policy-text">
                                            <pre>{currentPolicy.content}</pre>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="reporting-empty-state">
                                        <p>No privacy policy is currently available.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Data Export Modal */}
            {showExportModal && (
                <div className="reporting-modal-overlay">
                    <div className="reporting-modal" data-animate="fade-up">
                        <div className="reporting-modal__header">
                            <h3>Request Data Export</h3>
                            <button 
                                onClick={() => setShowExportModal(false)}
                                className="reporting-modal__close"
                            >
                                &times;
                            </button>
                        </div>
                        <div className="reporting-modal__content">
                            <div className="reporting-filters__grid">
                                <div className="reporting-form-group">
                                    <label className="reporting-form-label">Data Type</label>
                                    <select
                                        value={exportForm.requestType}
                                        onChange={(e) => setExportForm(prev => ({...prev, requestType: e.target.value}))}
                                        className="reporting-select"
                                    >
                                        <option value="PERSONAL_DATA">Personal Data</option>
                                        <option value="ACCOUNT_DATA">Account Data</option>
                                        <option value="ALL_DATA">All Data</option>
                                    </select>
                                </div>
                                <div className="reporting-form-group">
                                    <label className="reporting-form-label">Format</label>
                                    <select
                                        value={exportForm.format}
                                        onChange={(e) => setExportForm(prev => ({...prev, format: e.target.value}))}
                                        className="reporting-select"
                                    >
                                        <option value="JSON">JSON</option>
                                        <option value="CSV">CSV</option>
                                        <option value="PDF">PDF</option>
                                    </select>
                                </div>
                            </div>
                            <div className="reporting-form-group">
                                <label className="reporting-form-label">Reason (Optional)</label>
                                <textarea
                                    value={exportForm.reason}
                                    onChange={(e) => setExportForm(prev => ({...prev, reason: e.target.value}))}
                                    className="reporting-textarea"
                                    rows="3"
                                    placeholder="Please provide a reason for your data export request..."
                                />
                            </div>
                        </div>
                        <div className="reporting-modal__actions">
                            <button 
                                onClick={() => setShowExportModal(false)}
                                className="reporting-btn reporting-btn--secondary"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleExportRequest}
                                className="reporting-btn reporting-btn--blue"
                            >
                                Submit Request
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Data Deletion Modal */}
            {showDeletionModal && (
                <div className="reporting-modal-overlay">
                    <div className="reporting-modal reporting-modal--large" data-animate="fade-up">
                        <div className="reporting-modal__header">
                            <h3>Request Data Deletion</h3>
                            <button 
                                onClick={() => setShowDeletionModal(false)}
                                className="reporting-modal__close"
                            >
                                &times;
                            </button>
                        </div>
                        <div className="reporting-modal__content">
                            <div className="privacy-warning">
                                <div className="privacy-warning__icon">⚠️</div>
                                <div className="privacy-warning__content">
                                    <strong>Warning:</strong> This action cannot be undone. Please be certain about what data you want to delete.
                                </div>
                            </div>
                            <div className="reporting-form-group">
                                <label className="reporting-form-label">Deletion Type</label>
                                <select
                                    value={deletionForm.deletionType}
                                    onChange={(e) => setDeletionForm(prev => ({...prev, deletionType: e.target.value}))}
                                    className="reporting-select"
                                >
                                    <option value="SPECIFIC_DATA">Specific Data Categories</option>
                                    <option value="PERSONAL_DATA">All Personal Data</option>
                                    <option value="ACCOUNT">Delete Account</option>
                                </select>
                            </div>
                            {deletionForm.deletionType === 'SPECIFIC_DATA' && (
                                <div className="reporting-form-group">
                                    <label className="reporting-form-label">Data Categories</label>
                                    <div className="privacy-checkbox-group">
                                        {dataCategories.map(category => (
                                            <label key={category.value} className="privacy-checkbox">
                                                <input
                                                    type="checkbox"
                                                    checked={deletionForm.dataCategories.includes(category.value)}
                                                    onChange={(e) => {
                                                        const value = category.value;
                                                        setDeletionForm(prev => ({
                                                            ...prev,
                                                            dataCategories: e.target.checked
                                                                ? [...prev.dataCategories, value]
                                                                : prev.dataCategories.filter(cat => cat !== value)
                                                        }));
                                                    }}
                                                />
                                                <span className="privacy-checkbox__label">
                                                    {category.label}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <div className="reporting-form-group">
                                <label className="reporting-form-label">Reason</label>
                                <textarea
                                    value={deletionForm.reason}
                                    onChange={(e) => setDeletionForm(prev => ({...prev, reason: e.target.value}))}
                                    className="reporting-textarea"
                                    rows="3"
                                    placeholder="Please provide a reason for your data deletion request..."
                                    required
                                />
                            </div>
                        </div>
                        <div className="reporting-modal__actions">
                            <button 
                                onClick={() => setShowDeletionModal(false)}
                                className="reporting-btn reporting-btn--secondary"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleDeletionRequest}
                                className="reporting-btn reporting-btn--red"
                            >
                                Submit Deletion Request
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
};

export default Privacy;