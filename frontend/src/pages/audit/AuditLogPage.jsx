import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    FaHistory,
    FaFilter,
    FaFileCsv,
    FaFilePdf,
    FaFileExcel,
    FaSync,
    FaUserShield,
    FaListUl,
    FaGlobeAfrica
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import api from '../../api/api.js';
import './AuditStyles.css';

const initialFilters = {
    userId: '',
    action: '',
    entityType: '',
    entityId: '',
    severity: '',
    startDate: '',
    endDate: ''
};

const trimToNull = (value) => {
    if (value === undefined || value === null) {
        return null;
    }
    if (typeof value !== 'string') {
        return value;
    }
    const trimmed = value.trim();
    return trimmed === '' ? null : trimmed;
};

const sanitizeFilters = (filters) => {
    const sanitizedUserId = trimToNull(filters.userId);
    const sanitizedEntityId = trimToNull(filters.entityId);

    return {
        userId: sanitizedUserId !== null ? Number(sanitizedUserId) : null,
        action: trimToNull(filters.action),
        entityType: trimToNull(filters.entityType),
        entityId: sanitizedEntityId !== null ? Number(sanitizedEntityId) : null,
        severity: trimToNull(filters.severity),
        startDate: trimToNull(filters.startDate),
        endDate: trimToNull(filters.endDate)
    };
};

const hasActiveFilters = (payload) => Object.values(payload).some((value) => value !== null);

const severityToClass = {
    CRITICAL: 'audit-pill--critical',
    WARNING: 'audit-pill--warning',
    INFO: 'audit-pill--info'
};

const severityRowClass = {
    CRITICAL: 'audit-row--critical',
    WARNING: 'audit-row--warning',
    INFO: 'audit-row--info'
};

const actionPalette = [
    'audit-action--blue',
    'audit-action--gold',
    'audit-action--green',
    'audit-action--purple',
    'audit-action--red',
    'audit-action--teal',
    'audit-action--pink',
    'audit-action--slate'
];

const AuditLogPage = () => {
    const [loading, setLoading] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [logs, setLogs] = useState([]);
    const [actionTypes, setActionTypes] = useState([]);
    const [filters, setFilters] = useState(initialFilters);

    const sanitizedFilters = useMemo(() => sanitizeFilters(filters), [filters]);

    const fetchActionTypes = useCallback(async () => {
        try {
            const response = await api.get('/audit/action-types');
            setActionTypes(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error('Failed to fetch action types:', error);
        }
    }, []);

    const fetchLogs = useCallback(
        async (payload = sanitizedFilters) => {
            setLoading(true);
            try {
                const response = await api.post('/audit/query', payload);
                const records = Array.isArray(response.data) ? response.data : [];
                setLogs(records);
                if (records.length === 0 && hasActiveFilters(payload)) {
                    toast.info('No audit logs found matching your filters');
                }
            } catch (error) {
                console.error('Error fetching logs:', error);
                if (error.response?.status === 403) {
                    toast.error('You do not have permission to view audit logs. Please contact your administrator.');
                } else if (error.response?.status === 401) {
                    toast.error('Your session has expired. Please log in again.');
                } else {
                    toast.error('Failed to fetch audit logs. Please try again.');
                }
                setLogs([]);
            } finally {
                setLoading(false);
            }
        },
        [sanitizedFilters]
    );

    useEffect(() => {
        fetchActionTypes();
    }, [fetchActionTypes]);

    useEffect(() => {
        fetchLogs(sanitizedFilters);
    }, [fetchLogs, sanitizedFilters]);

    const handleFilterChange = (field, value) => {
        setFilters((prev) => ({ ...prev, [field]: value }));
    };

    const handleResetFilters = () => {
        setFilters(initialFilters);
    };

    const handleExport = async (format) => {
        if (!logs.length) {
            toast.info('Load data before exporting.');
            return;
        }
        setExporting(true);
        try {
            const response = await api.post(`/audit/export/${format}`, sanitizedFilters, {
                responseType: 'blob'
            });
            const blob = new Blob([response.data]);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const extension = format === 'csv' ? 'csv' : format === 'pdf' ? 'pdf' : 'xlsx';
            link.download = `audit_log_${timestamp}.${extension}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            toast.success(`Audit log exported as ${format.toUpperCase()}`);
        } catch (error) {
            toast.error(`Failed to export as ${format.toUpperCase()}`);
            console.error('Export error:', error);
        } finally {
            setExporting(false);
        }
    };

    const stats = useMemo(() => {
        if (!logs.length) {
            return {
                totalRecords: 0,
                uniqueActors: 0,
                actionCount: 0,
                uniqueIpCount: 0,
                lastActivity: null,
                severityCounts: {
                    CRITICAL: 0,
                    WARNING: 0,
                    INFO: 0
                }
            };
        }

        const severityCounts = {
            CRITICAL: 0,
            WARNING: 0,
            INFO: 0
        };
        const actors = new Set();
        const ipAddresses = new Set();
        const actions = new Set();
        let latest = null;

        logs.forEach((log) => {
            const severityKey = (log.severity || 'INFO').toUpperCase();
            severityCounts[severityKey] = (severityCounts[severityKey] || 0) + 1;
            if (log.actorEmail) {
                actors.add(log.actorEmail);
            } else if (log.actorName) {
                actors.add(log.actorName);
            }
            if (log.action) {
                actions.add(log.action);
            }
            if (log.ipAddress) {
                ipAddresses.add(log.ipAddress);
            }
            if (log.timestamp) {
                const value = new Date(log.timestamp).getTime();
                if (!Number.isNaN(value)) {
                    latest = latest === null ? value : Math.max(latest, value);
                }
            }
        });

        return {
            totalRecords: logs.length,
            uniqueActors: actors.size,
            actionCount: actions.size,
            uniqueIpCount: ipAddresses.size,
            lastActivity: latest,
            severityCounts: {
                CRITICAL: severityCounts.CRITICAL || 0,
                WARNING: severityCounts.WARNING || 0,
                INFO: severityCounts.INFO || 0
            }
        };
    }, [logs]);

    const activeFilterCount = useMemo(() => {
        return Object.values(sanitizedFilters).filter((value) => value !== null).length;
    }, [sanitizedFilters]);

    const actionColorClasses = useMemo(() => {
        if (!logs.length) {
            return {};
        }
        const uniqueActions = Array.from(
            logs.reduce((set, log) => {
                const rawAction = log.action;
                if (!rawAction) {
                    return set;
                }
                return set.add(rawAction.toUpperCase());
            }, new Set())
        ).sort();
        const assignments = {};
        uniqueActions.forEach((actionKey, index) => {
            assignments[actionKey] = actionPalette[index % actionPalette.length];
        });
        return assignments;
    }, [logs]);

    const formatTimestamp = (timestamp) => {
        if (!timestamp) {
            return '—';
        }
        const date = new Date(timestamp);
        if (Number.isNaN(date.getTime())) {
            return '—';
        }
        return date.toLocaleString();
    };

    const truncateDetails = (details, maxLength = 120) => {
        if (!details) {
            return '—';
        }
        if (details.length <= maxLength) {
            return details;
        }
        return `${details.substring(0, maxLength)}…`;
    };

    const manualRefresh = () => {
        fetchLogs(sanitizedFilters);
    };

    const severityLevels = ['CRITICAL', 'WARNING', 'INFO'];
    const lastActivityLabel = stats.lastActivity ? new Date(stats.lastActivity).toLocaleString() : 'No activity yet';

    return (
        <section className="audit-page">
            <div className="audit-banner" data-animate="fade-up">
                <div className="audit-banner__content">
                    <div className="audit-banner__info">
                        <span className="audit-banner__eyebrow">
                            <FaHistory />
                            Audit Centre
                        </span>
                        <h1 className="audit-banner__title">Audit Trail &amp; Accountability</h1>
                        <p className="audit-banner__subtitle">
                            Monitor sensitive changes, review user activity, and export evidence with the same elegant experience shared across operations, suppliers, reporting, and support.
                        </p>
                    </div>
                    <div className="audit-banner__actions">
                        <button
                            type="button"
                            className="audit-btn audit-btn--green"
                            onClick={() => handleExport('csv')}
                            disabled={exporting || loading || logs.length === 0}
                        >
                            <FaFileCsv />
                            {exporting ? 'Exporting…' : 'Export CSV'}
                        </button>
                        <button
                            type="button"
                            className="audit-btn audit-btn--blue"
                            onClick={() => handleExport('excel')}
                            disabled={exporting || loading || logs.length === 0}
                        >
                            <FaFileExcel />
                            {exporting ? 'Exporting…' : 'Export Excel'}
                        </button>
                        <button
                            type="button"
                            className="audit-btn audit-btn--gold"
                            onClick={() => handleExport('pdf')}
                            disabled={exporting || loading || logs.length === 0}
                        >
                            <FaFilePdf />
                            {exporting ? 'Exporting…' : 'Export PDF'}
                        </button>
                    </div>
                </div>

                <div className="audit-banner__meta">
                    <div className="audit-banner__meta-item">
                        <div className="audit-banner__meta-icon audit-banner__meta-icon--blue">
                            <FaUserShield />
                        </div>
                        <div className="audit-banner__meta-content">
                            <span className="audit-banner__meta-label">Unique Actors</span>
                            <span className="audit-banner__meta-value">{stats.uniqueActors}</span>
                        </div>
                    </div>
                    <div className="audit-banner__meta-item">
                        <div className="audit-banner__meta-icon audit-banner__meta-icon--gold">
                            <FaListUl />
                        </div>
                        <div className="audit-banner__meta-content">
                            <span className="audit-banner__meta-label">Tracked Actions</span>
                            <span className="audit-banner__meta-value">{stats.actionCount}</span>
                        </div>
                    </div>
                    <div className="audit-banner__meta-item">
                        <div className="audit-banner__meta-icon audit-banner__meta-icon--purple">
                            <FaGlobeAfrica />
                        </div>
                        <div className="audit-banner__meta-content">
                            <span className="audit-banner__meta-label">Unique IPs</span>
                            <span className="audit-banner__meta-value">{stats.uniqueIpCount}</span>
                        </div>
                    </div>
                    <div className="audit-banner__meta-item">
                        <div className="audit-banner__meta-icon audit-banner__meta-icon--green">
                            <FaHistory />
                        </div>
                        <div className="audit-banner__meta-content">
                            <span className="audit-banner__meta-label">Last Activity</span>
                            <span className="audit-banner__meta-value">{stats.lastActivity ? new Date(stats.lastActivity).toLocaleTimeString() : '—'}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="audit-filters" data-animate="fade-up" data-delay="0.08">
                <div className="audit-filters__header">
                    <div className="audit-filters__icon">
                        <FaFilter />
                    </div>
                    <div>
                        <h2 className="audit-filters__title">Advanced Filters</h2>
                        <p className="audit-filters__subtitle">Narrow down the log to specific actors, actions, and time periods.</p>
                    </div>
                </div>
                <div className="audit-filters__grid">
                    <div className="audit-filters__group">
                        <label htmlFor="auditFilterUserId" className="audit-filters__label">User ID</label>
                        <input
                            id="auditFilterUserId"
                            type="number"
                            className="audit-input"
                            placeholder="e.g. 42"
                            value={filters.userId}
                            onChange={(event) => handleFilterChange('userId', event.target.value)}
                        />
                    </div>
                    <div className="audit-filters__group">
                        <label htmlFor="auditFilterAction" className="audit-filters__label">Action</label>
                        <select
                            id="auditFilterAction"
                            className="audit-select"
                            value={filters.action}
                            onChange={(event) => handleFilterChange('action', event.target.value)}
                        >
                            <option value="">All actions</option>
                            {actionTypes.map((action) => (
                                <option key={action} value={action}>
                                    {action}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="audit-filters__group">
                        <label htmlFor="auditFilterEntityType" className="audit-filters__label">Entity Type</label>
                        <input
                            id="auditFilterEntityType"
                            type="text"
                            className="audit-input"
                            placeholder="Project, Supplier, User"
                            value={filters.entityType}
                            onChange={(event) => handleFilterChange('entityType', event.target.value)}
                        />
                    </div>
                    <div className="audit-filters__group">
                        <label htmlFor="auditFilterEntityId" className="audit-filters__label">Entity ID</label>
                        <input
                            id="auditFilterEntityId"
                            type="number"
                            className="audit-input"
                            placeholder="Exact entity reference"
                            value={filters.entityId}
                            onChange={(event) => handleFilterChange('entityId', event.target.value)}
                        />
                    </div>
                    <div className="audit-filters__group">
                        <label htmlFor="auditFilterSeverity" className="audit-filters__label">Severity</label>
                        <select
                            id="auditFilterSeverity"
                            className="audit-select"
                            value={filters.severity}
                            onChange={(event) => handleFilterChange('severity', event.target.value)}
                        >
                            <option value="">All severities</option>
                            <option value="CRITICAL">Critical</option>
                            <option value="WARNING">Warning</option>
                            <option value="INFO">Information</option>
                        </select>
                    </div>
                    <div className="audit-filters__group">
                        <label htmlFor="auditFilterStart" className="audit-filters__label">Start Date</label>
                        <input
                            id="auditFilterStart"
                            type="date"
                            className="audit-input"
                            value={filters.startDate}
                            onChange={(event) => handleFilterChange('startDate', event.target.value)}
                        />
                    </div>
                    <div className="audit-filters__group">
                        <label htmlFor="auditFilterEnd" className="audit-filters__label">End Date</label>
                        <input
                            id="auditFilterEnd"
                            type="date"
                            className="audit-input"
                            value={filters.endDate}
                            onChange={(event) => handleFilterChange('endDate', event.target.value)}
                        />
                    </div>
                </div>
                <div className="audit-filters__footer">
                    <button
                        type="button"
                        className="audit-btn audit-btn--secondary"
                        onClick={handleResetFilters}
                        disabled={!activeFilterCount}
                    >
                        Reset filters
                    </button>
                    <div className="audit-filters__status">
                        {activeFilterCount ? `${activeFilterCount} active ${activeFilterCount === 1 ? 'filter' : 'filters'}` : 'No active filters'}
                    </div>
                </div>
            </div>

            <div className="audit-results" data-animate="fade-up" data-delay="0.16">
                <div className="audit-results__header">
                    <div>
                        <h2 className="audit-results__title">Audit Log Results</h2>
                        <p className="audit-results__meta">
                            {stats.totalRecords} record{stats.totalRecords === 1 ? '' : 's'} • {lastActivityLabel}
                            {activeFilterCount ? ` • ${activeFilterCount} active ${activeFilterCount === 1 ? 'filter' : 'filters'}` : ''}
                        </p>
                    </div>
                    <div className="audit-results__controls">
                        {loading && <span className="audit-spinner audit-spinner--sm" aria-hidden="true" />}
                        <button
                            type="button"
                            className="audit-btn audit-btn--ghost"
                            onClick={manualRefresh}
                            disabled={loading}
                        >
                            <FaSync />
                            Refresh
                        </button>
                    </div>
                </div>

                <div className="audit-summary">
                    {severityLevels.map((level) => (
                        <div key={level} className={`audit-summary__item audit-summary__item--${level.toLowerCase()}`}>
                            <span className="audit-summary__label">{level}</span>
                            <span className="audit-summary__value">{stats.severityCounts[level] || 0}</span>
                        </div>
                    ))}
                </div>

                {loading ? (
                    <div className="audit-loading">
                        <span className="audit-spinner" aria-hidden="true" />
                        <p>Loading audit logs…</p>
                    </div>
                ) : logs.length === 0 ? (
                    <div className="audit-empty">
                        <FaHistory />
                        <p>No audit logs found for the selected filters.</p>
                    </div>
                ) : (
                    <div className="audit-table__wrapper">
                        <table className="audit-table">
                            <thead>
                                <tr>
                                    <th scope="col">ID</th>
                                    <th scope="col">Timestamp</th>
                                    <th scope="col">Actor</th>
                                    <th scope="col">Action</th>
                                    <th scope="col">Severity</th>
                                    <th scope="col">Entity</th>
                                    <th scope="col">Details</th>
                                    <th scope="col">IP Address</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((log) => {
                                    const severityKey = (log.severity || 'INFO').toUpperCase();
                                    const rowClass = severityRowClass[severityKey] || '';
                                    const actionKey = (log.action || 'UNSPECIFIED').toUpperCase();
                                    const actionClass = actionColorClasses[actionKey] || 'audit-action--default';
                                    return (
                                        <tr key={log.id} className={rowClass}>
                                            <td>{log.id}</td>
                                            <td title={formatTimestamp(log.timestamp)}>{formatTimestamp(log.timestamp)}</td>
                                            <td>
                                                <div className="audit-table__primary">{log.actorName || '—'}</div>
                                                <div className="audit-table__secondary">{log.actorEmail || '—'}</div>
                                            </td>
                                            <td>
                                                <span className={`audit-action ${actionClass}`} title={log.action || '—'}>
                                                    <span className="audit-action__dot" aria-hidden="true" />
                                                    {log.action || '—'}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`audit-pill ${severityToClass[severityKey] || 'audit-pill--neutral'}`}>
                                                    {severityKey}
                                                </span>
                                            </td>
                                            <td>
                                                {log.entityType ? (
                                                    <>
                                                        <div className="audit-table__primary">{log.entityType}</div>
                                                        {log.entityName && <div className="audit-table__secondary">{log.entityName}</div>}
                                                        {log.entityId && <div className="audit-table__secondary">ID: {log.entityId}</div>}
                                                    </>
                                                ) : (
                                                    '—'
                                                )}
                                            </td>
                                            <td title={log.details || '—'}>
                                                <div className="audit-table__secondary">{truncateDetails(log.details)}</div>
                                            </td>
                                            <td className="audit-table__secondary">{log.ipAddress || '—'}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </section>
    );
};

export default AuditLogPage;
