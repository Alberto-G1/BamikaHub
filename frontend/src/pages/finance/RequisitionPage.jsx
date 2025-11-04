import React, { useState, useEffect, useMemo } from 'react';
import { FaPlus, FaSearch, FaFileInvoiceDollar, FaUser, FaCalendarAlt, FaProjectDiagram } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import api from '../../api/api.js';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext.jsx';
import './FinanceStyles.css';

// Helper to get status badge class
const getStatusBadgeClass = (status) => {
    switch (status) {
        case 'PENDING': return 'finance-badge--pending';
        case 'APPROVED': return 'finance-badge--approved';
        case 'REJECTED': return 'finance-badge--rejected';
        case 'FULFILLED': return 'finance-badge--fulfilled';
        case 'CLOSED': return 'finance-badge--closed';
        case 'RESUBMITTED': return 'finance-badge--resubmitted';
        default: return 'finance-badge--pending';
    }
};

const formatStatus = (status) => {
    return status ? status.replace('_', ' ') : 'Pending';
};

const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-UG', {
        style: 'currency',
        currency: 'UGX',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount || 0);
};

const RequisitionPage = () => {
    const [requisitions, setRequisitions] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { hasPermission } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('ALL');

    useEffect(() => {
        fetchRequisitions();
    }, []);

    const fetchRequisitions = async () => {
        setLoading(true);
        try {
            const response = await api.get('/requisitions');
            setRequisitions(response.data);
        } catch (err) {
            toast.error('Failed to fetch requisitions.');
        } finally {
            setLoading(false);
        }
    };

    const filteredRequisitions = useMemo(() => {
        if (!requisitions) return [];
        
        let filtered = requisitions;
        
        // Filter by tab
        if (activeTab !== 'ALL') {
            filtered = filtered.filter(req => req.status === activeTab);
        }
        
        // Filter by search
        if (searchQuery) {
            filtered = filtered.filter(req =>
                req.project?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                req.requestedBy?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                req.id.toString().includes(searchQuery)
            );
        }
        
        return filtered;
    }, [requisitions, activeTab, searchQuery]);

    const summary = useMemo(() => {
        const total = requisitions.length;
        const pending = requisitions.filter(r => r.status === 'PENDING').length;
        const approved = requisitions.filter(r => r.status === 'APPROVED').length;
        const fulfilled = requisitions.filter(r => r.status === 'FULFILLED').length;
        
        return { total, pending, approved, fulfilled };
    }, [requisitions]);

    const tabs = [
        { key: 'ALL', label: 'All', count: requisitions.length },
        { key: 'PENDING', label: 'Pending', count: requisitions.filter(r => r.status === 'PENDING').length },
        { key: 'APPROVED', label: 'Approved', count: requisitions.filter(r => r.status === 'APPROVED').length },
        { key: 'FULFILLED', label: 'Fulfilled', count: requisitions.filter(r => r.status === 'FULFILLED').length },
        { key: 'REJECTED', label: 'Rejected', count: requisitions.filter(r => r.status === 'REJECTED').length },
        { key: 'CLOSED', label: 'Closed', count: requisitions.filter(r => r.status === 'CLOSED').length },
    ];

    if (loading) {
        return (
            <section className="finance-page">
                <div className="finance-loading">
                    <span className="finance-spinner" aria-hidden="true" />
                    <p>Loading requisitions...</p>
                </div>
            </section>
        );
    }

    return (
        <section className="finance-page">
            {/* Hero Banner */}
            <div className="finance-banner" data-animate="fade-up">
                <div className="finance-banner__content">
                    <div className="finance-banner__info">
                        <div className="finance-banner__eyebrow">
                            <FaFileInvoiceDollar aria-hidden="true" />
                            <span>Financial Management</span>
                        </div>
                        <h1 className="finance-banner__title">Requisitions</h1>
                        <p className="finance-banner__subtitle">
                            Manage project material requests, track approval workflows, and oversee procurement processes for all active projects.
                        </p>

                        <div className="finance-banner__meta">
                            <div className="finance-banner__meta-item">
                                <span className="finance-meta-label">Total Requests</span>
                                <span className="finance-meta-value">{summary.total}</span>
                            </div>
                            <div className="finance-banner__meta-item">
                                <span className="finance-meta-label">Pending Approval</span>
                                <span className="finance-meta-value">{summary.pending}</span>
                            </div>
                            <div className="finance-banner__meta-item">
                                <span className="finance-meta-label">Approved</span>
                                <span className="finance-meta-value">{summary.approved}</span>
                            </div>
                            <div className="finance-banner__meta-item">
                                <span className="finance-meta-label">Fulfilled</span>
                                <span className="finance-meta-value">{summary.fulfilled}</span>
                            </div>
                        </div>
                    </div>

                    <div className="finance-banner__actions">
                        {hasPermission('REQUISITION_CREATE') && (
                            <button
                                className="finance-btn finance-btn--gold"
                                onClick={() => navigate('/requisitions/new')}
                            >
                                <FaPlus aria-hidden="true" />
                                <span>New Requisition</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="finance-toolbar" data-animate="fade-up" data-delay="0.08">
                <div className="finance-search">
                    <FaSearch className="finance-search__icon" aria-hidden="true" />
                    <input
                        type="text"
                        className="finance-search__input"
                        placeholder="Search by project, requester, or ID..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Status Tabs */}
            <div style={{
                display: 'flex',
                gap: '0.5rem',
                padding: '0.75rem',
                borderRadius: '14px',
                background: 'var(--finance-surface-secondary)',
                border: '1px solid var(--finance-border)',
                overflowX: 'auto'
            }} data-animate="fade-up" data-delay="0.12">
                {tabs.map(tab => (
                    <button
                        key={tab.key}
                        className={`finance-btn ${activeTab === tab.key ? 'finance-btn--gold' : 'finance-btn--secondary'}`}
                        onClick={() => setActiveTab(tab.key)}
                        style={{ whiteSpace: 'nowrap' }}
                    >
                        <span>{tab.label} ({tab.count})</span>
                    </button>
                ))}
            </div>

            {/* Requisition Grid */}
            {filteredRequisitions.length > 0 ? (
                <div className="finance-grid" data-animate="fade-up" data-delay="0.12">
                    {filteredRequisitions.map(requisition => (
                        <div
                            key={requisition.id}
                            className="finance-card"
                            onClick={() => navigate(`/requisitions/${requisition.id}`)}
                        >
                            <div className="finance-card__header">
                                <div>
                                    <h3 className="finance-card__title">
                                        REQ-{String(requisition.id).padStart(4, '0')}
                                    </h3>
                                    <p className="finance-card__subtitle">
                                        <FaProjectDiagram aria-hidden="true" />
                                        {requisition.project?.name || 'Unknown Project'}
                                    </p>
                                </div>
                                <span className={`finance-badge ${getStatusBadgeClass(requisition.status)}`}>
                                    {formatStatus(requisition.status)}
                                </span>
                            </div>

                            <div className="finance-card__body">
                                <div className="finance-card__meta">
                                    <div className="finance-card__meta-item">
                                        <span className="finance-card__meta-label">
                                            <FaUser aria-hidden="true" /> Requester
                                        </span>
                                        <span className="finance-card__meta-value">
                                            {requisition.requestedBy?.fullName || 'Unknown'}
                                        </span>
                                    </div>
                                    <div className="finance-card__meta-item">
                                        <span className="finance-card__meta-label">
                                            <FaCalendarAlt aria-hidden="true" /> Date Needed
                                        </span>
                                        <span className="finance-card__meta-value">
                                            {formatDate(requisition.dateNeeded)}
                                        </span>
                                    </div>
                                    <div className="finance-card__meta-item">
                                        <span className="finance-card__meta-label">Items</span>
                                        <span className="finance-card__meta-value">
                                            {requisition.items?.length || 0} items
                                        </span>
                                    </div>
                                    <div className="finance-card__meta-item">
                                        <span className="finance-card__meta-label">Estimated Cost</span>
                                        <span className="finance-card__meta-value">
                                            {formatCurrency(
                                                requisition.items?.reduce((total, item) => 
                                                    total + (item.quantity * (item.estimatedUnitCost || 0)), 0
                                                )
                                            )}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="finance-empty-state" data-animate="fade-up" data-delay="0.12">
                    <FaFileInvoiceDollar className="finance-empty-state__icon" aria-hidden="true" />
                    <h3 className="finance-empty-state__title">No requisitions found</h3>
                    <p className="finance-empty-state__message">
                        {searchQuery || activeTab !== 'ALL' 
                            ? "No requisitions match your current filters. Try adjusting your search or changing the tab."
                            : "No requisitions have been created yet. Create your first requisition to start managing material requests."
                        }
                    </p>
                </div>
            )}
        </section>
    );
};

export default RequisitionPage;