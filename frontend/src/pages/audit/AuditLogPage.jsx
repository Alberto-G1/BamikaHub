import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Form, Row, Col, Button, Badge, Spinner, InputGroup } from 'react-bootstrap';
import { FaHistory, FaFilter, FaFileExport, FaFileCsv, FaFilePdf, FaFileExcel, FaSearch } from 'react-icons/fa';
import api from '../../api/api.js';
import { toast } from 'react-toastify';

const AuditLogPage = () => {
    const [loading, setLoading] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [logs, setLogs] = useState([]);
    const [actionTypes, setActionTypes] = useState([]);
    const [filters, setFilters] = useState({
        userId: '',
        action: '',
        entityType: '',
        entityId: '',
        severity: '',
        startDate: '',
        endDate: ''
    });

    useEffect(() => {
        fetchActionTypes();
    }, []);

    // Auto-apply filters when they change
    useEffect(() => {
        fetchLogs();
    }, [filters]);

    const fetchActionTypes = async () => {
        try {
            const response = await api.get('/audit/action-types');
            setActionTypes(response.data);
        } catch (error) {
            console.error('Failed to fetch action types:', error);
        }
    };

    const sanitizeFilters = () => {
        const trimOrNull = (value) => {
            if (value === undefined || value === null) return null;
            const trimmed = typeof value === 'string' ? value.trim() : value;
            return trimmed === '' ? null : trimmed;
        };

        const sanitizedUserId = trimOrNull(filters.userId);
        const sanitizedEntityId = trimOrNull(filters.entityId);

        return {
            userId: sanitizedUserId !== null ? Number(sanitizedUserId) : null,
            action: trimOrNull(filters.action),
            entityType: trimOrNull(filters.entityType),
            entityId: sanitizedEntityId !== null ? Number(sanitizedEntityId) : null,
            severity: trimOrNull(filters.severity),
            startDate: trimOrNull(filters.startDate),
            endDate: trimOrNull(filters.endDate)
        };
    };

    const hasActiveFilters = (payload) => Object.values(payload).some(value => value !== null);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const payload = sanitizeFilters();
            const response = await api.post('/audit/query', payload);
            setLogs(response.data);
            if (response.data.length === 0 && hasActiveFilters(payload)) {
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
            setLogs([]); // Clear logs on error
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({ ...prev, [field]: value }));
    };

    const handleResetFilters = () => {
        setFilters({
            userId: '',
            action: '',
            entityType: '',
            entityId: '',
            severity: '',
            startDate: '',
            endDate: ''
        });
    };

    const handleExport = async (format) => {
        setExporting(true);
        try {
            const response = await api.post(`/audit/export/${format}`, filters, {
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

    const getSeverityBadge = (severity) => {
        const variants = {
            INFO: 'info',
            WARNING: 'warning',
            CRITICAL: 'danger'
        };
        return <Badge bg={variants[severity] || 'secondary'}>{severity}</Badge>;
    };

    const formatTimestamp = (timestamp) => {
        if (!timestamp) return '—';
        return new Date(timestamp).toLocaleString();
    };

    const truncateDetails = (details, maxLength = 100) => {
        if (!details) return '—';
        if (details.length <= maxLength) return details;
        return details.substring(0, maxLength) + '...';
    };

    return (
        <Container fluid>
            {/* Header */}
            <Card className="shadow-sm mb-3">
                <Card.Header className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center">
                        <FaHistory size={24} className="me-3 text-primary" />
                        <div>
                            <h4 className="mb-0">Audit Trail</h4>
                            <small className="text-muted">System-wide activity log and accountability tracking</small>
                        </div>
                    </div>
                    <div className="d-flex gap-2">
                        <Button
                            variant="success"
                            size="sm"
                            onClick={() => handleExport('csv')}
                            disabled={exporting || logs.length === 0}
                        >
                            <FaFileCsv className="me-1" /> CSV
                        </Button>
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleExport('excel')}
                            disabled={exporting || logs.length === 0}
                        >
                            <FaFileExcel className="me-1" /> Excel
                        </Button>
                        <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleExport('pdf')}
                            disabled={exporting || logs.length === 0}
                        >
                            <FaFilePdf className="me-1" /> PDF
                        </Button>
                    </div>
                </Card.Header>
            </Card>

            {/* Filters */}
            <Card className="shadow-sm mb-3">
                <Card.Header>
                    <FaFilter className="me-2" />
                    Advanced Filters
                </Card.Header>
                <Card.Body>
                    <Row>
                        <Col md={3}>
                            <Form.Group className="mb-3">
                                <Form.Label>User ID</Form.Label>
                                <Form.Control
                                    type="number"
                                    placeholder="Filter by user ID"
                                    value={filters.userId}
                                    onChange={(e) => handleFilterChange('userId', e.target.value)}
                                />
                            </Form.Group>
                        </Col>
                        <Col md={3}>
                            <Form.Group className="mb-3">
                                <Form.Label>Action Type</Form.Label>
                                <Form.Select
                                    value={filters.action}
                                    onChange={(e) => handleFilterChange('action', e.target.value)}
                                >
                                    <option value="">All Actions</option>
                                    {actionTypes.map(action => (
                                        <option key={action} value={action}>{action}</option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={3}>
                            <Form.Group className="mb-3">
                                <Form.Label>Entity Type</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="e.g., Project, User"
                                    value={filters.entityType}
                                    onChange={(e) => handleFilterChange('entityType', e.target.value)}
                                />
                            </Form.Group>
                        </Col>
                        <Col md={3}>
                            <Form.Group className="mb-3">
                                <Form.Label>Severity</Form.Label>
                                <Form.Select
                                    value={filters.severity}
                                    onChange={(e) => handleFilterChange('severity', e.target.value)}
                                >
                                    <option value="">All Severities</option>
                                    <option value="INFO">INFO</option>
                                    <option value="WARNING">WARNING</option>
                                    <option value="CRITICAL">CRITICAL</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                    </Row>
                    <Row>
                        <Col md={4}>
                            <Form.Group className="mb-3">
                                <Form.Label>Start Date</Form.Label>
                                <Form.Control
                                    type="date"
                                    value={filters.startDate}
                                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                                />
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group className="mb-3">
                                <Form.Label>End Date</Form.Label>
                                <Form.Control
                                    type="date"
                                    value={filters.endDate}
                                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                                />
                            </Form.Group>
                        </Col>
                        <Col md={4} className="d-flex align-items-end">
                            <div className="d-flex gap-2 mb-3 w-100">
                                <Button variant="outline-secondary" onClick={handleResetFilters} className="w-100">
                                    Reset Filters
                                </Button>
                            </div>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* Results */}
            <Card className="shadow-sm">
                <Card.Header className="d-flex justify-content-between align-items-center">
                    <span>Audit Log Results ({logs.length} records)</span>
                    {loading && <Spinner animation="border" size="sm" />}
                </Card.Header>
                <Card.Body className="p-0">
                    {loading ? (
                        <div className="text-center p-5">
                            <Spinner animation="border" />
                            <p className="mt-2">Loading audit logs...</p>
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="text-center p-5 text-muted">
                            <FaHistory size={48} className="mb-3 opacity-50" />
                            <p>No audit logs found matching the criteria</p>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <Table striped hover>
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Timestamp</th>
                                        <th>Actor</th>
                                        <th>Action</th>
                                        <th>Severity</th>
                                        <th>Entity</th>
                                        <th>Details</th>
                                        <th>IP Address</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.map(log => (
                                        <tr key={log.id}>
                                            <td>{log.id}</td>
                                            <td className="text-nowrap">{formatTimestamp(log.timestamp)}</td>
                                            <td>
                                                <div>{log.actorName}</div>
                                                <small className="text-muted">{log.actorEmail}</small>
                                            </td>
                                            <td>
                                                <code className="small">{log.action}</code>
                                            </td>
                                            <td>{getSeverityBadge(log.severity)}</td>
                                            <td>
                                                {log.entityType && (
                                                    <>
                                                        <div className="fw-bold">{log.entityType}</div>
                                                        {log.entityName && <small className="text-muted">{log.entityName}</small>}
                                                        {log.entityId && <small className="text-muted"> (ID: {log.entityId})</small>}
                                                    </>
                                                )}
                                                {!log.entityType && '—'}
                                            </td>
                                            <td>
                                                <small className="text-muted" title={log.details}>
                                                    {truncateDetails(log.details)}
                                                </small>
                                            </td>
                                            <td className="text-muted small">{log.ipAddress || '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </div>
                    )}
                </Card.Body>
            </Card>
        </Container>
    );
};

export default AuditLogPage;
