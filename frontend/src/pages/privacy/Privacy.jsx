import React, { useState, useEffect } from 'react';
import { FaShieldAlt, FaCookie, FaFileAlt, FaTrash, FaDownload, FaClock, FaCheckCircle, FaTimesCircle, FaExclamationCircle } from 'react-icons/fa';
import api from '../../api/api';
import '../reporting/ReportingStyles.css';
import './Privacy.css';

const Privacy = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboard, setDashboard] = useState(null);
  const [cookieConsent, setCookieConsent] = useState({
    analytics: false,
    marketing: false,
    functional: false
  });
  const [dataRequests, setDataRequests] = useState([]);
  const [retentionPolicies, setRetentionPolicies] = useState([]);
  const [showCookieBanner, setShowCookieBanner] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadDashboard();
    checkCookieConsent();
    loadDataRequests();
    loadRetentionPolicies();
  }, []);

  const loadDashboard = async () => {
    try {
      const response = await api.get('/privacy/dashboard');
      setDashboard(response.data);
    } catch (error) {
      console.error('Failed to load privacy dashboard:', error);
    }
  };

  const checkCookieConsent = async () => {
    try {
      const response = await api.get('/privacy/consent');
      if (response.data) {
        setCookieConsent({
          analytics: response.data.analyticsCookies,
          marketing: response.data.marketingCookies,
          functional: response.data.functionalCookies
        });
      } else {
        setShowCookieBanner(true);
      }
    } catch (error) {
      setShowCookieBanner(true);
    }
  };

  const loadDataRequests = async () => {
    try {
      const response = await api.get('/privacy/data-requests');
      setDataRequests(response.data);
    } catch (error) {
      console.error('Failed to load data requests:', error);
    }
  };

  const loadRetentionPolicies = async () => {
    try {
      const response = await api.get('/privacy/retention-policies/active');
      setRetentionPolicies(response.data);
    } catch (error) {
      console.error('Failed to load retention policies:', error);
    }
  };

  const handleConsentSave = async () => {
    try {
      setLoading(true);
      await api.post('/privacy/consent', null, {
        params: {
          analytics: cookieConsent.analytics,
          marketing: cookieConsent.marketing,
          functional: cookieConsent.functional
        }
      });
      setShowCookieBanner(false);
      showMessage('success', 'Cookie preferences saved successfully');
      loadDashboard();
    } catch (error) {
      showMessage('error', 'Failed to save cookie preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleDataRequest = async (requestType) => {
    try {
      setLoading(true);
      await api.post('/privacy/data-requests', null, {
        params: {
          requestType,
          reason: `User requested ${requestType.toLowerCase()}`
        }
      });
      showMessage('success', `Data ${requestType.toLowerCase()} request submitted. Check your email for verification.`);
      loadDataRequests();
    } catch (error) {
      if (error.response?.status === 400) {
        showMessage('error', 'You already have an active request of this type');
      } else {
        showMessage('error', 'Failed to submit request');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadData = async (requestId) => {
    try {
      const response = await api.get(`/privacy/data-requests/${requestId}/download`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'my_data.json');
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      showMessage('success', 'Data downloaded successfully');
    } catch (error) {
      showMessage('error', 'Failed to download data');
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'COMPLETED':
        return <FaCheckCircle className="privacy-status-icon privacy-status-icon--success" />;
      case 'REJECTED':
        return <FaTimesCircle className="privacy-status-icon privacy-status-icon--error" />;
      case 'IN_PROGRESS':
        return <FaClock className="privacy-status-icon privacy-status-icon--warning" />;
      default:
        return <FaExclamationCircle className="privacy-status-icon privacy-status-icon--info" />;
    }
  };

  return (
    <div className="privacy-container">
      {/* Cookie Banner */}
      {showCookieBanner && (
        <div className="privacy-cookie-banner">
          <div className="privacy-cookie-banner__content">
            <FaCookie className="privacy-cookie-banner__icon" />
            <div className="privacy-cookie-banner__text">
              <h3>Cookie Preferences</h3>
              <p>We use cookies to enhance your experience. Essential cookies are always enabled.</p>
              
              <div className="privacy-cookie-banner__options">
                <label className="privacy-cookie-option">
                  <input type="checkbox" checked disabled />
                  <span>Essential (Required)</span>
                </label>
                <label className="privacy-cookie-option">
                  <input
                    type="checkbox"
                    checked={cookieConsent.analytics}
                    onChange={(e) => setCookieConsent({ ...cookieConsent, analytics: e.target.checked })}
                  />
                  <span>Analytics</span>
                </label>
                <label className="privacy-cookie-option">
                  <input
                    type="checkbox"
                    checked={cookieConsent.marketing}
                    onChange={(e) => setCookieConsent({ ...cookieConsent, marketing: e.target.checked })}
                  />
                  <span>Marketing</span>
                </label>
                <label className="privacy-cookie-option">
                  <input
                    type="checkbox"
                    checked={cookieConsent.functional}
                    onChange={(e) => setCookieConsent({ ...cookieConsent, functional: e.target.checked })}
                  />
                  <span>Functional</span>
                </label>
              </div>
            </div>
            <div className="privacy-cookie-banner__actions">
              <button
                className="reporting-btn reporting-btn--secondary"
                onClick={() => {
                  setCookieConsent({ analytics: false, marketing: false, functional: false });
                  handleConsentSave();
                }}
                disabled={loading}
              >
                Reject All
              </button>
              <button
                className="reporting-btn reporting-btn--blue"
                onClick={handleConsentSave}
                disabled={loading}
              >
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="privacy-banner" data-animate="fade-up">
        <div className="privacy-banner__content">
          <div className="privacy-banner__info">
            <div className="privacy-header__eyebrow">
              <FaShieldAlt aria-hidden="true" />
              <span>Data Trust Center</span>
            </div>
            <div className="privacy-header__content">
              <FaShieldAlt className="privacy-header__icon" />
              <div>
                <h1 className="privacy-header__title">Privacy & Data Protection</h1>
                <p className="privacy-header__subtitle">Manage your data, cookies, and privacy preferences</p>
              </div>
            </div>

            {dashboard && (
              <div className="privacy-banner__meta">
                <div className="privacy-banner__meta-item">
                  <span className="privacy-meta-label">Consents</span>
                  <span className="privacy-meta-value">{dashboard.totalConsents}</span>
                </div>
                <div className="privacy-banner__meta-item">
                  <span className="privacy-meta-label">Active Requests</span>
                  <span className="privacy-meta-value">{dashboard.pendingRequests}</span>
                </div>
                <div className="privacy-banner__meta-item">
                  <span className="privacy-meta-label">Completed Requests</span>
                  <span className="privacy-meta-value">{dashboard.completedRequests}</span>
                </div>
                <div className="privacy-banner__meta-item">
                  <span className="privacy-meta-label">Retention Policies</span>
                  <span className="privacy-meta-value">{dashboard.activePolicies}</span>
                </div>
              </div>
            )}
          </div>

          <div className="privacy-banner__actions">
            <button
              className="privacy-btn privacy-btn--primary"
              onClick={() => setActiveTab('cookies')}
            >
              Manage Cookies
            </button>
            <button
              className="privacy-btn privacy-btn--ghost"
              onClick={() => setActiveTab('data')}
            >
              Data Requests
            </button>
          </div>
        </div>
      </div>

      {/* Message Alert */}
      {message.text && (
        <div className={`privacy-alert privacy-alert--${message.type}`}>
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="privacy-tabs">
        <button
          className={`privacy-tab ${activeTab === 'overview' ? 'privacy-tab--active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <FaShieldAlt size={18} />
          Overview
        </button>
        <button
          className={`privacy-tab ${activeTab === 'cookies' ? 'privacy-tab--active' : ''}`}
          onClick={() => setActiveTab('cookies')}
        >
          <FaCookie size={18} />
          Cookie Preferences
        </button>
        <button
          className={`privacy-tab ${activeTab === 'data' ? 'privacy-tab--active' : ''}`}
          onClick={() => setActiveTab('data')}
        >
          <FaFileAlt size={18} />
          Data Requests
        </button>
        <button
          className={`privacy-tab ${activeTab === 'retention' ? 'privacy-tab--active' : ''}`}
          onClick={() => setActiveTab('retention')}
        >
          <FaClock size={18} />
          Data Retention
        </button>
      </div>

      {/* Tab Content */}
      <div className="privacy-content">
        {activeTab === 'overview' && dashboard && (
          <div className="privacy-overview">
            <div className="privacy-stats">
              <div className="privacy-stat-card">
                <FaCookie className="privacy-stat-card__icon" />
                <div className="privacy-stat-card__content">
                  <h3>Cookie Consent</h3>
                  <p className="privacy-stat-card__value">{dashboard.totalConsents} Total</p>
                  <p className="privacy-stat-card__detail">
                    {dashboard.analyticsConsents} Analytics, {dashboard.marketingConsents} Marketing
                  </p>
                </div>
              </div>
              
              <div className="privacy-stat-card">
                <FaFileAlt className="privacy-stat-card__icon" />
                <div className="privacy-stat-card__content">
                  <h3>Data Requests</h3>
                  <p className="privacy-stat-card__value">{dashboard.pendingRequests} Pending</p>
                  <p className="privacy-stat-card__detail">
                    {dashboard.completedRequests} Completed, {dashboard.overdueRequests} Overdue
                  </p>
                </div>
              </div>
              
              <div className="privacy-stat-card">
                <FaShieldAlt className="privacy-stat-card__icon" />
                <div className="privacy-stat-card__content">
                  <h3>Security</h3>
                  <p className="privacy-stat-card__value">{dashboard.has2FAEnabled ? 'Enabled' : 'Disabled'}</p>
                  <p className="privacy-stat-card__detail">Two-Factor Authentication</p>
                </div>
              </div>
              
              <div className="privacy-stat-card">
                <FaClock className="privacy-stat-card__icon" />
                <div className="privacy-stat-card__content">
                  <h3>Retention Policies</h3>
                  <p className="privacy-stat-card__value">{dashboard.activePolicies} Active</p>
                  <p className="privacy-stat-card__detail">Data lifecycle management</p>
                </div>
              </div>
            </div>

            <div className="privacy-info-section">
              <h2>Your Privacy Rights</h2>
              <ul className="privacy-rights-list">
                <li>Right to access your personal data</li>
                <li>Right to rectification of inaccurate data</li>
                <li>Right to erasure ("right to be forgotten")</li>
                <li>Right to data portability</li>
                <li>Right to object to processing</li>
                <li>Right to withdraw consent at any time</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'cookies' && (
          <div className="privacy-cookies">
            <div className="privacy-section-card">
              <h2>Manage Cookie Preferences</h2>
              <p className="privacy-section-description">
                Control how we use cookies on this site. Essential cookies are required for the site to function.
              </p>

              <div className="privacy-cookie-settings">
                <div className="privacy-cookie-setting">
                  <div className="privacy-cookie-setting__info">
                    <h3>Essential Cookies</h3>
                    <p>Required for basic site functionality, authentication, and security.</p>
                  </div>
                  <input type="checkbox" checked disabled className="privacy-toggle" />
                </div>

                <div className="privacy-cookie-setting">
                  <div className="privacy-cookie-setting__info">
                    <h3>Analytics Cookies</h3>
                    <p>Help us understand how visitors use our site to improve user experience.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={cookieConsent.analytics}
                    onChange={(e) => setCookieConsent({ ...cookieConsent, analytics: e.target.checked })}
                    className="privacy-toggle"
                  />
                </div>

                <div className="privacy-cookie-setting">
                  <div className="privacy-cookie-setting__info">
                    <h3>Marketing Cookies</h3>
                    <p>Used to deliver relevant advertisements and track campaign effectiveness.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={cookieConsent.marketing}
                    onChange={(e) => setCookieConsent({ ...cookieConsent, marketing: e.target.checked })}
                    className="privacy-toggle"
                  />
                </div>

                <div className="privacy-cookie-setting">
                  <div className="privacy-cookie-setting__info">
                    <h3>Functional Cookies</h3>
                    <p>Enable enhanced functionality like chat support and personalization.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={cookieConsent.functional}
                    onChange={(e) => setCookieConsent({ ...cookieConsent, functional: e.target.checked })}
                    className="privacy-toggle"
                  />
                </div>
              </div>

              <div className="privacy-actions">
                <button
                  className="reporting-btn reporting-btn--blue"
                  onClick={handleConsentSave}
                  disabled={loading}
                >
                  Save Preferences
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'data' && (
          <div className="privacy-data">
            <div className="privacy-section-card">
              <h2>Request Your Data</h2>
              <p className="privacy-section-description">
                Exercise your GDPR rights by requesting data export, deletion, or portability.
              </p>

              <div className="privacy-data-actions">
                <button
                  className="reporting-btn reporting-btn--blue"
                  onClick={() => handleDataRequest('EXPORT')}
                  disabled={loading}
                >
                  <FaDownload size={18} />
                  Export My Data
                </button>
                <button
                  className="reporting-btn reporting-btn--blue"
                  onClick={() => handleDataRequest('PORTABILITY')}
                  disabled={loading}
                >
                  <FaFileAlt size={18} />
                  Data Portability
                </button>
                <button
                  className="reporting-btn reporting-btn--red"
                  onClick={() => handleDataRequest('DELETE')}
                  disabled={loading}
                >
                  <FaTrash size={18} />
                  Delete My Account
                </button>
              </div>
            </div>

            <div className="privacy-section-card">
              <h2>My Data Requests</h2>
              {dataRequests.length === 0 ? (
                <p className="privacy-empty">No data requests yet</p>
              ) : (
                <div className="privacy-requests-list">
                  {dataRequests.map((request) => (
                    <div key={request.id} className="privacy-request-item">
                      <div className="privacy-request-item__header">
                        {getStatusIcon(request.status)}
                        <div className="privacy-request-item__info">
                          <h3>{request.requestType}</h3>
                          <p>Requested: {new Date(request.requestDate).toLocaleDateString()}</p>
                        </div>
                        <span className={`reporting-badge reporting-badge--${
                          request.status === 'COMPLETED' ? 'success' :
                          request.status === 'REJECTED' ? 'danger' :
                          request.status === 'IN_PROGRESS' ? 'warning' : 'info'
                        }`}>
                          {request.status}
                        </span>
                      </div>
                      {request.status === 'COMPLETED' && request.filePath && (
                        <button
                          className="reporting-btn reporting-btn--blue reporting-btn--sm"
                          onClick={() => handleDownloadData(request.id)}
                        >
                          <FaDownload size={16} />
                          Download Data
                        </button>
                      )}
                      {request.rejectionReason && (
                        <p className="privacy-request-item__reason">
                          Reason: {request.rejectionReason}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'retention' && (
          <div className="privacy-retention">
            <div className="privacy-section-card">
              <h2>Data Retention Policies</h2>
              <p className="privacy-section-description">
                Learn how long we keep your data and the legal basis for retention.
              </p>

              {retentionPolicies.length === 0 ? (
                <p className="privacy-empty">No retention policies available</p>
              ) : (
                <div className="privacy-policies-list">
                  {retentionPolicies.map((policy) => (
                    <div key={policy.id} className="privacy-policy-item">
                      <div className="privacy-policy-item__header">
                        <h3>{policy.dataType.replace(/_/g, ' ')}</h3>
                        <span className="reporting-badge reporting-badge--info">
                          {policy.retentionPeriodDays} days
                        </span>
                      </div>
                      <p className="privacy-policy-item__description">{policy.description}</p>
                      <div className="privacy-policy-item__details">
                        <p><strong>Legal Basis:</strong> {policy.legalBasis}</p>
                        {policy.autoDelete && (
                          <p className="privacy-policy-item__auto-delete">
                            ✓ Automatic deletion enabled
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Privacy;
