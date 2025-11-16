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
import Switch from '../../components/common/Switch.jsx';
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
    const [showPolicyModal, setShowPolicyModal] = useState(false);

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
            loadPrivacyData(); // Refresh the list
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
            loadPrivacyData(); // Refresh the list
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

            // Update local state
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
            <div className="privacy-loading">
                <Spinner />
                <p>Loading privacy information...</p>
            </div>
        );
    }

    return (
        <div className="privacy-page">
            <div className="privacy-header">
                <h1>Privacy Center</h1>
                <p>Manage your data privacy and consent preferences</p>
            </div>

            <div className="privacy-tabs">
                <button
                    className={`tab-button ${activeTab === 'settings' ? 'active' : ''}`}
                    onClick={() => setActiveTab('settings')}
                >
                    Privacy Settings
                </button>
                <button
                    className={`tab-button ${activeTab === 'consents' ? 'active' : ''}`}
                    onClick={() => setActiveTab('consents')}
                >
                    Consents
                </button>
                <button
                    className={`tab-button ${activeTab === 'data' ? 'active' : ''}`}
                    onClick={() => setActiveTab('data')}
                >
                    Data Management
                </button>
                <button
                    className={`tab-button ${activeTab === 'policy' ? 'active' : ''}`}
                    onClick={() => setActiveTab('policy')}
                >
                    Privacy Policy
                </button>
            </div>

            <div className="privacy-content">
                {activeTab === 'settings' && (
                    <div className="privacy-settings">
                        <Card className="settings-card">
                            <div className="card-header">
                                <h2>Data Sharing Preferences</h2>
                            </div>
                            <div className="card-body">
                                <div className="setting-group">
                                    <div className="setting-item">
                                        <div className="setting-info">
                                            <label>Profile Visibility</label>
                                            <p>Allow others to see your profile information</p>
                                        </div>
                                        <Switch
                                            checked={privacySettings.profileVisible}
                                            onChange={(checked) => setPrivacySettings(prev => ({...prev, profileVisible: checked}))}
                                        />
                                    </div>
                                    <div className="setting-item">
                                        <div className="setting-info">
                                            <label>Activity Visibility</label>
                                            <p>Show your activity and login history to others</p>
                                        </div>
                                        <Switch
                                            checked={privacySettings.activityVisible}
                                            onChange={(checked) => setPrivacySettings(prev => ({...prev, activityVisible: checked}))}
                                        />
                                    </div>
                                    <div className="setting-item">
                                        <div className="setting-info">
                                            <label>Statistics Visibility</label>
                                            <p>Display usage statistics and analytics</p>
                                        </div>
                                        <Switch
                                            checked={privacySettings.statisticsVisible}
                                            onChange={(checked) => setPrivacySettings(prev => ({...prev, statisticsVisible: checked}))}
                                        />
                                    </div>
                                </div>
                            </div>
                        </Card>

                        <Card className="settings-card">
                            <div className="card-header">
                                <h2>Cookie Preferences</h2>
                            </div>
                            <div className="card-body">
                                <div className="setting-group">
                                    <div className="setting-item">
                                        <div className="setting-info">
                                            <label>Essential Cookies</label>
                                            <p>Required for basic website functionality</p>
                                        </div>
                                        <Switch
                                            checked={privacySettings.essentialCookies}
                                            onChange={(checked) => setPrivacySettings(prev => ({...prev, essentialCookies: checked}))}
                                            disabled
                                        />
                                    </div>
                                    <div className="setting-item">
                                        <div className="setting-info">
                                            <label>Analytics Cookies</label>
                                            <p>Help us improve our services</p>
                                        </div>
                                        <Switch
                                            checked={privacySettings.analyticsCookies}
                                            onChange={(checked) => setPrivacySettings(prev => ({...prev, analyticsCookies: checked}))}
                                        />
                                    </div>
                                    <div className="setting-item">
                                        <div className="setting-info">
                                            <label>Marketing Cookies</label>
                                            <p>Used for personalized advertising</p>
                                        </div>
                                        <Switch
                                            checked={privacySettings.marketingCookies}
                                            onChange={(checked) => setPrivacySettings(prev => ({...prev, marketingCookies: checked}))}
                                        />
                                    </div>
                                    <div className="setting-item">
                                        <div className="setting-info">
                                            <label>Functional Cookies</label>
                                            <p>Enhance your browsing experience</p>
                                        </div>
                                        <Switch
                                            checked={privacySettings.functionalCookies}
                                            onChange={(checked) => setPrivacySettings(prev => ({...prev, functionalCookies: checked}))}
                                        />
                                    </div>
                                </div>
                            </div>
                        </Card>

                        <Card className="settings-card">
                            <div className="card-header">
                                <h2>Data Retention</h2>
                            </div>
                            <div className="card-body">
                                <div className="setting-group">
                                    <div className="setting-item">
                                        <div className="setting-info">
                                            <label>Auto-delete Old Data</label>
                                            <p>Automatically delete data older than the retention period</p>
                                        </div>
                                        <Switch
                                            checked={privacySettings.autoDeleteOldData}
                                            onChange={(checked) => setPrivacySettings(prev => ({...prev, autoDeleteOldData: checked}))}
                                        />
                                    </div>
                                    <div className="setting-item">
                                        <div className="setting-info">
                                            <label>Data Retention Period (Days)</label>
                                            <p>How long to keep your data before deletion</p>
                                        </div>
                                        <Input
                                            type="number"
                                            value={privacySettings.dataRetentionDays}
                                            onChange={(e) => setPrivacySettings(prev => ({...prev, dataRetentionDays: parseInt(e.target.value)}))}
                                            min="30"
                                            max="3650"
                                            disabled={!privacySettings.autoDeleteOldData}
                                        />
                                    </div>
                                </div>
                            </div>
                        </Card>

                        <div className="settings-actions">
                            <Button
                                onClick={handleSettingsUpdate}
                                disabled={saving}
                                className="primary"
                            >
                                {saving ? 'Saving...' : 'Save Settings'}
                            </Button>
                        </div>
                    </div>
                )}

                {activeTab === 'consents' && (
                    <Card className="privacy-card">
                        <div className="card-header">
                            <h2>Data Processing Consents</h2>
                        </div>
                        <div className="card-body">
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
                                        <Switch
                                            checked={consent.granted || false}
                                            onChange={(checked) => handleConsentChange(consentType, checked)}
                                        />
                                    </div>
                                ))}
                                {Object.keys(privacySettings.consents || {}).length === 0 && (
                                    <div className="no-consents">
                                        <p>No consents found. Consents will appear here when you interact with privacy-related features.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>
                )}

                {activeTab === 'data' && (
                    <div className="data-management">
                        <div className="data-actions">
                            <Button
                                onClick={() => setShowExportModal(true)}
                                className="primary"
                            >
                                Request Data Export
                            </Button>
                            <Button
                                onClick={() => setShowDeletionModal(true)}
                                className="danger"
                            >
                                Request Data Deletion
                            </Button>
                        </div>

                        <Card className="data-card">
                            <div className="card-header">
                                <h2>Data Export Requests</h2>
                            </div>
                            <div className="card-body">
                                <Table
                                    columns={[
                                        { key: 'requestType', header: 'Type', render: (value) => value.replace(/_/g, ' ') },
                                        { key: 'format', header: 'Format' },
                                        { key: 'requestedAt', header: 'Requested', render: (value) => formatDateTime(value) },
                                        {
                                            key: 'status',
                                            header: 'Status',
                                            render: (value) => (
                                                <Badge variant={getStatusColor(value)}>
                                                    {value}
                                                </Badge>
                                            )
                                        }
                                    ]}
                                    data={exportRequests}
                                    emptyMessage="No data export requests found"
                                />
                            </div>
                        </Card>

                        <Card className="data-card">
                            <div className="card-header">
                                <h2>Data Deletion Requests</h2>
                            </div>
                            <div className="card-body">
                                <Table
                                    columns={[
                                        { key: 'deletionType', header: 'Type', render: (value) => value.replace(/_/g, ' ') },
                                        { key: 'dataCategories', header: 'Categories', render: (value) => Array.isArray(value) ? value.join(', ') : value },
                                        { key: 'requestedAt', header: 'Requested', render: (value) => formatDateTime(value) },
                                        {
                                            key: 'status',
                                            header: 'Status',
                                            render: (value) => (
                                                <Badge variant={getStatusColor(value)}>
                                                    {value}
                                                </Badge>
                                            )
                                        }
                                    ]}
                                    data={deletionRequests}
                                    emptyMessage="No data deletion requests found"
                                />
                            </div>
                        </Card>
                    </div>
                )}

                {activeTab === 'policy' && (
                    <Card className="privacy-card">
                        <div className="card-header">
                            <h2>Privacy Policy</h2>
                        </div>
                        <div className="card-body">
                            {currentPolicy ? (
                                <div className="policy-content">
                                    <div className="policy-header">
                                        <h3>{currentPolicy.title}</h3>
                                        <div className="policy-meta">
                                            <Badge variant="info">Version {currentPolicy.version}</Badge>
                                            <span>Effective: {formatDateTime(currentPolicy.effectiveDate)}</span>
                                        </div>
                                    </div>
                                    <div className="policy-text">
                                        <pre>{currentPolicy.content}</pre>
                                    </div>
                                </div>
                            ) : (
                                <div className="no-policy">
                                    <p>No privacy policy is currently available.</p>
                                </div>
                            )}
                        </div>
                    </Card>
                )}
            </div>

            {/* Data Export Modal */}
            <Modal
                isOpen={showExportModal}
                onClose={() => setShowExportModal(false)}
                title="Request Data Export"
            >
                <div className="export-form">
                    <div className="form-group">
                        <label>Data Type</label>
                        <select
                            value={exportForm.requestType}
                            onChange={(e) => setExportForm(prev => ({...prev, requestType: e.target.value}))}
                            className="form-control"
                        >
                            <option value="PERSONAL_DATA">Personal Data</option>
                            <option value="ACCOUNT_DATA">Account Data</option>
                            <option value="ALL_DATA">All Data</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Format</label>
                        <select
                            value={exportForm.format}
                            onChange={(e) => setExportForm(prev => ({...prev, format: e.target.value}))}
                            className="form-control"
                        >
                            <option value="JSON">JSON</option>
                            <option value="CSV">CSV</option>
                            <option value="PDF">PDF</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Reason (Optional)</label>
                        <textarea
                            value={exportForm.reason}
                            onChange={(e) => setExportForm(prev => ({...prev, reason: e.target.value}))}
                            className="form-control"
                            rows="3"
                            placeholder="Please provide a reason for your data export request..."
                        />
                    </div>
                    <div className="modal-actions">
                        <Button onClick={() => setShowExportModal(false)} variant="secondary">
                            Cancel
                        </Button>
                        <Button onClick={handleExportRequest} className="primary">
                            Submit Request
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Data Deletion Modal */}
            <Modal
                isOpen={showDeletionModal}
                onClose={() => setShowDeletionModal(false)}
                title="Request Data Deletion"
            >
                <div className="deletion-form">
                    <div className="deletion-warning">
                        <div className="warning-icon">⚠️</div>
                        <p><strong>Warning:</strong> This action cannot be undone. Please be certain about what data you want to delete.</p>
                    </div>
                    <div className="form-group">
                        <label>Deletion Type</label>
                        <select
                            value={deletionForm.deletionType}
                            onChange={(e) => setDeletionForm(prev => ({...prev, deletionType: e.target.value}))}
                            className="form-control"
                        >
                            <option value="SPECIFIC_DATA">Specific Data Categories</option>
                            <option value="PERSONAL_DATA">All Personal Data</option>
                            <option value="ACCOUNT">Delete Account</option>
                        </select>
                    </div>
                    {deletionForm.deletionType === 'SPECIFIC_DATA' && (
                        <div className="form-group">
                            <label>Data Categories</label>
                            <div className="checkbox-group">
                                {dataCategories.map(category => (
                                    <label key={category.value} className="checkbox-item">
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
                                        {category.label}
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}
                    <div className="form-group">
                        <label>Reason</label>
                        <textarea
                            value={deletionForm.reason}
                            onChange={(e) => setDeletionForm(prev => ({...prev, reason: e.target.value}))}
                            className="form-control"
                            rows="3"
                            placeholder="Please provide a reason for your data deletion request..."
                            required
                        />
                    </div>
                    <div className="modal-actions">
                        <Button onClick={() => setShowDeletionModal(false)} variant="secondary">
                            Cancel
                        </Button>
                        <Button onClick={handleDeletionRequest} className="danger">
                            Submit Deletion Request
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Privacy;