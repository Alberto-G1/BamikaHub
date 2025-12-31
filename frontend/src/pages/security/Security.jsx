import React, { useState, useEffect } from 'react';
import { 
  FaShieldAlt, 
  FaKey, 
  FaMobile, 
  FaLaptop, 
  FaLock, 
  FaExclamationTriangle,
  FaCheckCircle,
  FaTimesCircle,
  FaQrcode,
  FaClock,
  FaMapMarkerAlt,
  FaTrash,
  FaChrome,
  FaFirefox,
  FaSafari,
  FaEdge,
  FaDesktop,
  FaTabletAlt,
  FaWindows,
  FaApple,
  FaLinux,
  FaAndroid
} from 'react-icons/fa';
import api from '../../api/api';
import { toast } from 'react-toastify';
import '../reporting/ReportingStyles.css';
import './Security.css';

const Security = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  
  // Dashboard state
  const [dashboard, setDashboard] = useState(null);
  
  // Sessions state
  const [sessions, setSessions] = useState([]);
  
  // 2FA state
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [setupData, setSetupData] = useState(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [showSetupModal, setShowSetupModal] = useState(false);
  
  // Events state
  const [events, setEvents] = useState([]);
  const [eventDays, setEventDays] = useState(30);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'dashboard') {
        await loadDashboard();
      } else if (activeTab === 'sessions') {
        await loadSessions();
      } else if (activeTab === '2fa') {
        await check2FAStatus();
      } else if (activeTab === 'events') {
        await loadEvents();
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load security data');
    } finally {
      setLoading(false);
    }
  };

  const loadDashboard = async () => {
    const response = await api.get('/security/dashboard');
    setDashboard(response.data);
  };

  const loadSessions = async () => {
    const response = await api.get('/security/sessions');
    setSessions(response.data);
  };

  const check2FAStatus = async () => {
    const response = await api.get('/security/2fa/status');
    setTwoFactorEnabled(response.data.enabled);
  };

  const loadEvents = async () => {
    const response = await api.get(`/security/events?days=${eventDays}`);
    setEvents(response.data);
  };

  const handleTerminateSession = async (sessionId) => {
    if (!window.confirm('Are you sure you want to terminate this session?')) {
      return;
    }

    try {
      await api.delete(`/security/sessions/${sessionId}`);
      toast.success('Session terminated successfully');
      loadSessions();
    } catch (error) {
      console.error('Error terminating session:', error);
      toast.error('Failed to terminate session');
    }
  };

  const handleTerminateAllSessions = async () => {
    if (!window.confirm('Are you sure you want to terminate all sessions? You will be logged out.')) {
      return;
    }

    try {
      await api.delete('/security/sessions');
      toast.success('All sessions terminated');
    } catch (error) {
      console.error('Error terminating sessions:', error);
      toast.error('Failed to terminate sessions');
    }
  };

  const handleSetup2FA = async () => {
    try {
      const response = await api.post('/security/2fa/setup');
      setSetupData(response.data);
      setShowSetupModal(true);
    } catch (error) {
      console.error('Error setting up 2FA:', error);
      toast.error('Failed to setup 2FA');
    }
  };

  const handleVerify2FA = async () => {
    if (verificationCode.length !== 6) {
      toast.error('Please enter a 6-digit verification code');
      return;
    }

    try {
      await api.post('/security/2fa/verify', {
        secret: setupData.secret,
        code: verificationCode
      });
      toast.success('Two-factor authentication enabled successfully');
      setTwoFactorEnabled(true);
      setShowSetupModal(false);
      setVerificationCode('');
      loadDashboard();
    } catch (error) {
      console.error('Error verifying 2FA:', error);
      toast.error('Invalid verification code');
    }
  };

  const handleDisable2FA = async () => {
    if (!window.confirm('Are you sure you want to disable two-factor authentication?')) {
      return;
    }

    try {
      await api.delete('/security/2fa');
      toast.success('Two-factor authentication disabled');
      setTwoFactorEnabled(false);
      loadDashboard();
    } catch (error) {
      console.error('Error disabling 2FA:', error);
      toast.error('Failed to disable 2FA');
    }
  };

  const getDeviceIcon = (deviceType) => {
    switch (deviceType) {
      case 'MOBILE':
        return <FaMobile />;
      case 'TABLET':
        return <FaTabletAlt />;
      default:
        return <FaLaptop />;
    }
  };

  const getBrowserIcon = (browser) => {
    const browserLower = browser?.toLowerCase() || '';
    if (browserLower.includes('chrome')) return <FaChrome />;
    if (browserLower.includes('firefox')) return <FaFirefox />;
    if (browserLower.includes('safari')) return <FaSafari />;
    if (browserLower.includes('edge')) return <FaEdge />;
    return <FaDesktop />;
  };

  const getOSIcon = (os) => {
    const osLower = os?.toLowerCase() || '';
    if (osLower.includes('windows')) return <FaWindows />;
    if (osLower.includes('mac') || osLower.includes('ios')) return <FaApple />;
    if (osLower.includes('linux')) return <FaLinux />;
    if (osLower.includes('android')) return <FaAndroid />;
    return <FaDesktop />;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const renderDashboard = () => {
    if (!dashboard) return null;

    return (
      <div className="reporting-page" data-animate="fade-up">
        {/* Stats Grid */}
        <div className="security-stats-grid">
          <div className="reporting-metric reporting-metric--blue">
            <div className="reporting-report-card__icon reporting-report-card__icon--blue">
              <FaLaptop />
            </div>
            <div className="reporting-card__content">
              <h3 style={{ fontSize: '2rem', margin: 0 }}>{dashboard.activeSessionsCount}</h3>
              <p style={{ margin: 0, color: 'var(--reporting-text-secondary)' }}>Active Sessions</p>
            </div>
          </div>

          <div className="reporting-metric reporting-metric--green">
            <div className="reporting-report-card__icon reporting-report-card__icon--green">
              <FaCheckCircle />
            </div>
            <div className="reporting-card__content">
              <h3 style={{ fontSize: '2rem', margin: 0 }}>{dashboard.recentLoginsCount}</h3>
              <p style={{ margin: 0, color: 'var(--reporting-text-secondary)' }}>Recent Logins</p>
            </div>
          </div>

          <div className="reporting-metric reporting-metric--red">
            <div className="reporting-report-card__icon reporting-report-card__icon--red">
              <FaTimesCircle />
            </div>
            <div className="reporting-card__content">
              <h3 style={{ fontSize: '2rem', margin: 0 }}>{dashboard.failedLoginsCount}</h3>
              <p style={{ margin: 0, color: 'var(--reporting-text-secondary)' }}>Failed Logins</p>
            </div>
          </div>

          <div className="reporting-metric reporting-metric--gold">
            <div className="reporting-report-card__icon reporting-report-card__icon--gold">
              <FaExclamationTriangle />
            </div>
            <div className="reporting-card__content">
              <h3 style={{ fontSize: '2rem', margin: 0 }}>{dashboard.suspiciousEventsCount}</h3>
              <p style={{ margin: 0, color: 'var(--reporting-text-secondary)' }}>Suspicious Events</p>
            </div>
          </div>
        </div>

        {/* 2FA Status Card */}
        <div className="reporting-card" data-animate="fade-up" data-delay="0.08">
          <div className="reporting-card__header">
            <h2 className="reporting-card__title">
              <FaKey style={{ marginRight: '0.5rem' }} /> Two-Factor Authentication
            </h2>
          </div>
          <div className="reporting-card__content">
            <div className={`security-2fa-status ${dashboard.twoFactorEnabled ? 'security-2fa-status--enabled' : 'security-2fa-status--disabled'}`}>
              <div className={`security-2fa-icon ${dashboard.twoFactorEnabled ? 'security-2fa-icon--enabled' : 'security-2fa-icon--disabled'}`}>
                {dashboard.twoFactorEnabled ? <FaCheckCircle /> : <FaTimesCircle />}
              </div>
              <p className="security-2fa-text">
                {dashboard.twoFactorEnabled ? 'Two-Factor Authentication is Enabled' : 'Two-Factor Authentication is Disabled'}
              </p>
              <p className="security-2fa-description">
                {dashboard.twoFactorEnabled 
                  ? 'Your account is protected with an additional layer of security' 
                  : 'Enable 2FA to add an extra layer of security to your account'}
              </p>
              <button 
                className={dashboard.twoFactorEnabled ? 'reporting-btn reporting-btn--red' : 'reporting-btn reporting-btn--blue'}
                onClick={dashboard.twoFactorEnabled ? handleDisable2FA : handleSetup2FA}
              >
                {dashboard.twoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA'}
              </button>
            </div>
          </div>
        </div>

        {/* Recent Sessions */}
        <div className="reporting-card" data-animate="fade-up" data-delay="0.12">
          <div className="reporting-card__header">
            <h2 className="reporting-card__title">
              <FaLaptop style={{ marginRight: '0.5rem' }} /> Recent Sessions
            </h2>
          </div>
          <div className="reporting-card__content">
            {dashboard.activeSessions?.length === 0 ? (
              <div className="security-empty-state">
                <FaLaptop />
                <p>No active sessions</p>
              </div>
            ) : (
              <div className="security-session-list">
                {dashboard.activeSessions?.slice(0, 5).map((session) => (
                  <div key={session.id} className="security-session-item">
                    <div className="security-session-info">
                      <div className={`security-device-icon ${session.deviceType === 'MOBILE' ? 'security-device-icon--mobile' : ''}`}>
                        {getDeviceIcon(session.deviceType)}
                      </div>
                      <div className="security-session-details">
                        <div className="security-session-device">
                          {getBrowserIcon(session.browser)} {session.browser} on {session.operatingSystem}
                        </div>
                        <div className="security-session-meta">
                          <span><FaMapMarkerAlt /> {session.ipAddress}</span>
                          <span><FaClock /> {formatDate(session.lastActivity)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Events */}
        <div className="reporting-card" data-animate="fade-up" data-delay="0.16">
          <div className="reporting-card__header">
            <h2 className="reporting-card__title">
              <FaExclamationTriangle style={{ marginRight: '0.5rem' }} /> Recent Security Events
            </h2>
          </div>
          <div className="reporting-card__content">
            {dashboard.recentEvents?.length === 0 ? (
              <div className="security-empty-state">
                <FaShieldAlt />
                <p>No recent security events</p>
              </div>
            ) : (
              <div className="security-events-list">
                {dashboard.recentEvents?.slice(0, 5).map((event) => (
                  <div key={event.id} className={`security-event-card ${event.isSuspicious ? 'security-event-card--suspicious' : ''}`}>
                    <div className="security-event-header">
                      <span className={`reporting-badge reporting-badge--${event.severity === 'CRITICAL' ? 'danger' : event.severity === 'HIGH' ? 'warning' : event.severity === 'MEDIUM' ? 'info' : 'success'}`}>
                        {event.severity}
                      </span>
                      <span className="security-event-type">{event.eventType?.replace(/_/g, ' ')}</span>
                      {event.isSuspicious && (
                        <span className="reporting-badge reporting-badge--danger">
                          <FaExclamationTriangle /> Suspicious
                        </span>
                      )}
                    </div>
                    <p className="security-event-description">{event.description}</p>
                    <div className="security-event-meta">
                      <span className="security-event-meta-item">
                        <FaClock /> {formatDate(event.createdAt)}
                      </span>
                      {event.ipAddress && (
                        <span className="security-event-meta-item">
                          <FaMapMarkerAlt /> {event.ipAddress}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderSessions = () => {
    return (
      <div className="reporting-page" data-animate="fade-up">
        <div className="reporting-card">
          <div className="reporting-card__header">
            <h2 className="reporting-card__title">Active Sessions</h2>
            <div className="reporting-card__actions">
              <button 
                className="reporting-btn reporting-btn--red"
                onClick={handleTerminateAllSessions}
              >
                <FaTrash /> Terminate All Sessions
              </button>
            </div>
          </div>
          <div className="reporting-card__content">
            {sessions.length === 0 ? (
              <div className="security-empty-state">
                <FaLaptop />
                <p>No active sessions</p>
              </div>
            ) : (
              <div className="security-session-list">
                {sessions.map((session) => (
                  <div key={session.id} className="security-session-item">
                    <div className="security-session-info">
                      <div className={`security-device-icon ${session.deviceType === 'MOBILE' ? 'security-device-icon--mobile' : session.deviceType === 'TABLET' ? 'security-device-icon--tablet' : ''}`}>
                        {getDeviceIcon(session.deviceType)}
                      </div>
                      <div className="security-session-details">
                        <div className="security-session-device">
                          {getBrowserIcon(session.browser)} {session.browser} on {session.operatingSystem}
                          {session.isCurrentSession && (
                            <span className="security-session-current" style={{ marginLeft: '0.5rem' }}>
                              <FaCheckCircle /> Current
                            </span>
                          )}
                        </div>
                        <div className="security-session-meta">
                          <span><FaMapMarkerAlt /> {session.ipAddress}</span>
                          <span><FaClock /> Last activity: {formatDate(session.lastActivity)}</span>
                        </div>
                      </div>
                    </div>
                    {!session.isCurrentSession && (
                      <button 
                        className="reporting-btn reporting-btn--red"
                        onClick={() => handleTerminateSession(session.id)}
                      >
                        <FaTrash /> Terminate
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const render2FA = () => {
    return (
      <div className="reporting-page" data-animate="fade-up">
        <div className="reporting-card">
          <div className="reporting-card__header">
            <h2 className="reporting-card__title">
              <FaKey style={{ marginRight: '0.5rem' }} /> Two-Factor Authentication
            </h2>
          </div>
          <div className="reporting-card__content">
            <p style={{ color: 'var(--reporting-text-secondary)', marginBottom: '2rem' }}>
              Two-factor authentication adds an extra layer of security to your account by requiring a verification code from your authenticator app when signing in.
            </p>

            <div className={`security-2fa-status ${twoFactorEnabled ? 'security-2fa-status--enabled' : 'security-2fa-status--disabled'}`}>
              <div className={`security-2fa-icon ${twoFactorEnabled ? 'security-2fa-icon--enabled' : 'security-2fa-icon--disabled'}`}>
                {twoFactorEnabled ? <FaCheckCircle /> : <FaTimesCircle />}
              </div>
              <p className="security-2fa-text">
                {twoFactorEnabled ? 'Two-Factor Authentication is Enabled' : 'Two-Factor Authentication is Disabled'}
              </p>
              <p className="security-2fa-description">
                {twoFactorEnabled 
                  ? 'Your account is protected with an additional layer of security' 
                  : 'Enable 2FA to add an extra layer of security to your account'}
              </p>
              <button 
                className={twoFactorEnabled ? 'reporting-btn reporting-btn--red' : 'reporting-btn reporting-btn--blue'}
                onClick={twoFactorEnabled ? handleDisable2FA : handleSetup2FA}
              >
                {twoFactorEnabled ? 'Disable Two-Factor Authentication' : 'Enable Two-Factor Authentication'}
              </button>
            </div>
          </div>
        </div>

        {showSetupModal && (
          <div className="security-modal-overlay" onClick={() => setShowSetupModal(false)}>
            <div className="security-modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="security-modal-header">
                <FaQrcode />
                <h2>Setup Two-Factor Authentication</h2>
              </div>

              <div className="security-setup-steps">
                <div className="security-setup-step">
                  <h4>Step 1: Scan QR Code</h4>
                  <p>Open your authenticator app (Google Authenticator, Microsoft Authenticator, or Authy) and scan this QR code:</p>
                  <div className="security-qr-container">
                    <img src={setupData?.qrCodeBase64} alt="QR Code" />
                  </div>
                </div>

                <div className="security-setup-step">
                  <h4>Step 2: Manual Entry (Optional)</h4>
                  <p>Or enter this code manually in your authenticator app:</p>
                  <div className="security-manual-code">
                    {setupData?.manualEntryKey}
                  </div>
                </div>

                <div className="security-setup-step">
                  <h4>Step 3: Verify</h4>
                  <p>Enter the 6-digit verification code from your authenticator app:</p>
                  <input
                    type="text"
                    className="security-verification-input"
                    placeholder="000000"
                    maxLength="6"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                  />
                </div>
              </div>

              <div className="security-modal-actions">
                <button 
                  className="reporting-btn reporting-btn--secondary"
                  onClick={() => {
                    setShowSetupModal(false);
                    setVerificationCode('');
                  }}
                >
                  Cancel
                </button>
                <button 
                  className="reporting-btn reporting-btn--blue"
                  onClick={handleVerify2FA}
                  disabled={verificationCode.length !== 6}
                >
                  Verify and Enable
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderEvents = () => {
    return (
      <div className="reporting-page" data-animate="fade-up">
        <div className="reporting-card">
          <div className="security-events-header">
            <h2>Security Event Log</h2>
            <select 
              className="security-events-filter"
              value={eventDays}
              onChange={(e) => {
                setEventDays(parseInt(e.target.value));
                setTimeout(() => loadEvents(), 100);
              }}
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
          </div>

          {events.length === 0 ? (
            <div className="security-empty-state">
              <FaShieldAlt />
              <p>No security events found</p>
            </div>
          ) : (
            <div className="security-events-list">
              {events.map((event) => (
                <div key={event.id} className={`security-event-card ${event.isSuspicious ? 'security-event-card--suspicious' : ''}`}>
                  <div className="security-event-header">
                    <span className={`reporting-badge reporting-badge--${event.severity === 'CRITICAL' ? 'danger' : event.severity === 'HIGH' ? 'warning' : event.severity === 'MEDIUM' ? 'info' : 'success'}`}>
                      {event.severity}
                    </span>
                    <span className="security-event-type">{event.eventType?.replace(/_/g, ' ')}</span>
                    {event.isSuspicious && (
                      <span className="reporting-badge reporting-badge--danger">
                        <FaExclamationTriangle /> Suspicious
                      </span>
                    )}
                  </div>

                  <p className="security-event-description">{event.description}</p>

                  <div className="security-event-meta">
                    <span className="security-event-meta-item">
                      <FaClock /> {formatDate(event.createdAt)}
                    </span>
                    {event.ipAddress && (
                      <span className="security-event-meta-item">
                        <FaMapMarkerAlt /> {event.ipAddress}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="reporting-page">
      {/* Header */}
      <div className="reporting-banner" data-animate="fade-up">
        <div className="reporting-banner__content">
          <div className="reporting-banner__info">
            <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0 }}>
              <FaShieldAlt /> Security
            </h1>
            <p style={{ margin: '0.5rem 0 0 0', color: 'var(--reporting-text-secondary)' }}>
              Manage your account security settings and monitor activity
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="security-tabs" data-animate="fade-up" data-delay="0.08">
        <button
          className={`security-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <FaShieldAlt /> Dashboard
        </button>
        <button
          className={`security-tab ${activeTab === 'sessions' ? 'active' : ''}`}
          onClick={() => setActiveTab('sessions')}
        >
          <FaLaptop /> Sessions
        </button>
        <button
          className={`security-tab ${activeTab === '2fa' ? 'active' : ''}`}
          onClick={() => setActiveTab('2fa')}
        >
          <FaKey /> Two-Factor Auth
        </button>
        <button
          className={`security-tab ${activeTab === 'events' ? 'active' : ''}`}
          onClick={() => setActiveTab('events')}
        >
          <FaLock /> Activity Log
        </button>
      </div>

      {/* Tab Content */}
      {loading ? (
        <div className="reporting-loading" data-animate="fade-up" data-delay="0.12">
          <div className="reporting-loading__spinner"></div>
          <p>Loading security data...</p>
        </div>
      ) : (
        <>
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'sessions' && renderSessions()}
          {activeTab === '2fa' && render2FA()}
          {activeTab === 'events' && renderEvents()}
        </>
      )}
    </div>
  );
};

export default Security;
