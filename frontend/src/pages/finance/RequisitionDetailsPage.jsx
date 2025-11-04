import React, { useState, useEffect } from 'react';
import { FaEdit, FaTrash, FaCheckCircle, FaTimesCircle, FaClipboardCheck, FaArrowLeft } from 'react-icons/fa';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/api.js';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext.jsx';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import FulfillmentModal from '../../components/finance/FulfillmentModal.jsx';
import './FinanceStyles.css';

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
        month: 'long',
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

const RequisitionDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, hasPermission } = useAuth();
    const [requisition, setRequisition] = useState(null);
    const [loading, setLoading] = useState(true);
    const [dialogConfig, setDialogConfig] = useState({ open: false });
    const [showFulfillmentModal, setShowFulfillmentModal] = useState(false);
    const [actionLoading, setActionLoading] = useState('');

    useEffect(() => {
        fetchRequisition();
    }, [id]);

    const fetchRequisition = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/requisitions/${id}`);
            setRequisition(response.data);
        } catch (error) {
            toast.error('Failed to load requisition details.');
            navigate('/requisitions');
        } finally {
            setLoading(false);
        }
    };

    const closeDialog = () => setDialogConfig(prev => ({ ...prev, open: false }));

    const confirmDelete = () => {
        setDialogConfig({
            open: true,
            tone: 'danger',
            title: 'Delete Requisition',
            message: `Delete requisition REQ-${String(requisition.id).padStart(4, '0')}?`,
            detail: 'This action cannot be undone. All associated data will be permanently removed.',
            confirmLabel: 'Delete',
            cancelLabel: 'Cancel',
            onConfirm: handleDelete,
        });
    };

    const handleDelete = async () => {
        closeDialog();
        try {
            await api.delete(`/requisitions/${id}`);
            toast.success('Requisition deleted successfully.');
            navigate('/requisitions');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete requisition.');
        }
    };

    const handleApproval = async (action, notes = '') => {
        setActionLoading(action);
        try {
            await api.post(`/requisitions/${id}/${action}`, { notes });
            toast.success(`Requisition ${action}d successfully.`);
            fetchRequisition();
        } catch (error) {
            toast.error(error.response?.data?.message || `Failed to ${action} requisition.`);
        } finally {
            setActionLoading('');
        }
    };

    const handleClose = async (notes) => {
        setActionLoading('close');
        try {
            await api.post(`/requisitions/${id}/close`, { notes });
            toast.success('Requisition closed successfully.');
            fetchRequisition();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to close requisition.');
        } finally {
            setActionLoading('');
        }
    };

    const canEdit = () => {
        return hasPermission('REQUISITION_UPDATE') && 
               (requisition.status === 'PENDING' || requisition.status === 'REJECTED') &&
               requisition.requestedBy?.id === user?.id;
    };

    const canDelete = () => {
        return hasPermission('REQUISITION_DELETE') && 
               requisition.status === 'PENDING' &&
               requisition.requestedBy?.id === user?.id;
    };

    const canApprove = () => {
        return hasPermission('REQUISITION_APPROVE') && requisition.status === 'PENDING';
    };

    const canFulfill = () => {
        return hasPermission('REQUISITION_FULFILL') && requisition.status === 'APPROVED';
    };

    const canClose = () => {
        return hasPermission('REQUISITION_CLOSE') && requisition.status === 'FULFILLED';
    };

    if (loading) {
        return (
            <section className="finance-page">
                <div className="finance-loading">
                    <span className="finance-spinner" aria-hidden="true" />
                    <p>Loading requisition details...</p>
                </div>
            </section>
        );
    }

    if (!requisition) {
        return (
            <section className="finance-page">
                <div className="finance-empty-state">
                    <h3 className="finance-empty-state__title">Requisition not found</h3>
                    <p className="finance-empty-state__message">
                        The requested requisition could not be found or you don't have permission to view it.
                    </p>
                    <button
                        className="finance-btn finance-btn--blue"
                        onClick={() => navigate('/requisitions')}
                    >
                        Back to Requisitions
                    </button>
                </div>
            </section>
        );
    }

    const totalEstimatedCost = requisition.items?.reduce((total, item) => {
        return total + (item.quantity * (item.estimatedUnitCost || 0));
    }, 0) || 0;

    return (
        <section className="finance-page">
            {/* Header */}
            <div className="finance-banner" data-animate="fade-up">
                <div className="finance-banner__content">
                    <div className="finance-banner__info">
                        <button
                            className="finance-btn finance-btn--secondary finance-btn--sm"
                            onClick={() => navigate('/requisitions')}
                            style={{ marginBottom: '1rem', alignSelf: 'flex-start' }}
                        >
                            <FaArrowLeft aria-hidden="true" />
                            <span>Back to Requisitions</span>
                        </button>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                            <h1 className="finance-banner__title" style={{ margin: 0 }}>
                                REQ-{String(requisition.id).padStart(4, '0')}
                            </h1>
                            <span className={`finance-badge ${getStatusBadgeClass(requisition.status)}`}>
                                {formatStatus(requisition.status)}
                            </span>
                            {requisition.status === 'RESUBMITTED' && (
                                <span className="finance-badge finance-badge--resubmitted">
                                    Resubmitted
                                </span>
                            )}
                        </div>
                        
                        <p className="finance-banner__subtitle" style={{ margin: '0.5rem 0 0 0' }}>
                            Material requisition for {requisition.project?.name}
                        </p>
                    </div>

                    <div className="finance-banner__actions">
                        {canEdit() && (
                            <button
                                className="finance-btn finance-btn--green"
                                onClick={() => navigate(`/requisitions/${id}/edit`)}
                            >
                                <FaEdit aria-hidden="true" />
                                <span>Edit</span>
                            </button>
                        )}
                        {canDelete() && (
                            <button
                                className="finance-btn finance-btn--red"
                                onClick={confirmDelete}
                            >
                                <FaTrash aria-hidden="true" />
                                <span>Delete</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', alignItems: 'flex-start' }}>
                {/* Main Content */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {/* Requisition Info */}
                    <div className="finance-table-container" data-animate="fade-up" data-delay="0.08">
                        <div style={{ padding: '1.75rem' }}>
                            <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1.1rem', fontWeight: '700', color: 'var(--finance-text-primary)' }}>
                                Requisition Information
                            </h3>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
                                <div>
                                    <div className="finance-label">Project</div>
                                    <div style={{ fontWeight: '600', color: 'var(--finance-text-primary)' }}>
                                        {requisition.project?.name || 'Unknown'}
                                    </div>
                                </div>
                                <div>
                                    <div className="finance-label">Requester</div>
                                    <div style={{ fontWeight: '600', color: 'var(--finance-text-primary)' }}>
                                        {requisition.requestedBy?.fullName || 'Unknown'}
                                    </div>
                                </div>
                                <div>
                                    <div className="finance-label">Date Requested</div>
                                    <div style={{ fontWeight: '600', color: 'var(--finance-text-primary)' }}>
                                        {formatDate(requisition.createdAt)}
                                    </div>
                                </div>
                                <div>
                                    <div className="finance-label">Date Needed</div>
                                    <div style={{ fontWeight: '600', color: 'var(--finance-text-primary)' }}>
                                        {formatDate(requisition.dateNeeded)}
                                    </div>
                                </div>
                            </div>

                            {requisition.justification && (
                                <div style={{ marginTop: '1.25rem' }}>
                                    <div className="finance-label">Justification</div>
                                    <div style={{ fontWeight: '600', color: 'var(--finance-text-primary)', marginTop: '0.5rem', lineHeight: '1.5' }}>
                                        {requisition.justification}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="finance-table-container" data-animate="fade-up" data-delay="0.12">
                        <div style={{ padding: '1.75rem' }}>
                            <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1.1rem', fontWeight: '700', color: 'var(--finance-text-primary)' }}>
                                Requested Items
                            </h3>
                            
                            <table className="finance-table">
                                <thead>
                                    <tr>
                                        <th>Item Name</th>
                                        <th>Description</th>
                                        <th>Quantity</th>
                                        <th>Unit</th>
                                        <th>Est. Unit Cost</th>
                                        <th>Total Cost</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {requisition.items?.map((item, index) => (
                                        <tr key={index}>
                                            <td style={{ fontWeight: '600' }}>{item.itemName}</td>
                                            <td>{item.description || 'N/A'}</td>
                                            <td>{item.quantity}</td>
                                            <td>{item.unit || 'pcs'}</td>
                                            <td>{formatCurrency(item.estimatedUnitCost)}</td>
                                            <td style={{ fontWeight: '600' }}>
                                                {formatCurrency(item.quantity * (item.estimatedUnitCost || 0))}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr style={{ borderTop: '2px solid var(--finance-border)', fontWeight: '700' }}>
                                        <td colSpan={5} style={{ textAlign: 'right', padding: '1.25rem' }}>
                                            Total Estimated Cost:
                                        </td>
                                        <td style={{ fontSize: '1.1rem', color: 'var(--finance-gold-hover)' }}>
                                            {formatCurrency(totalEstimatedCost)}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Sidebar Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {/* Pending Actions */}
                    {requisition.status === 'PENDING' && canApprove() && (
                        <div className="finance-table-container" data-animate="fade-up" data-delay="0.16">
                            <div style={{ padding: '1.75rem' }}>
                                <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1.1rem', fontWeight: '700', color: 'var(--finance-text-primary)' }}>
                                    Approval Actions
                                </h3>
                                
                                {requisition.resubmissionHistory && requisition.resubmissionHistory.length > 0 && (
                                    <div className="finance-alert finance-alert--info" style={{ marginBottom: '1rem' }}>
                                        <strong>Resubmission History:</strong>
                                        <ul style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.25rem' }}>
                                            {requisition.resubmissionHistory.map((entry, index) => (
                                                <li key={index} style={{ fontSize: '0.9rem' }}>
                                                    {entry.notes} - {formatDate(entry.date)}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    <button
                                        className="finance-btn finance-btn--green"
                                        onClick={() => handleApproval('approve')}
                                        disabled={actionLoading === 'approve'}
                                    >
                                        <FaCheckCircle aria-hidden="true" />
                                        <span>{actionLoading === 'approve' ? 'Approving...' : 'Approve'}</span>
                                    </button>
                                    <button
                                        className="finance-btn finance-btn--red"
                                        onClick={() => {
                                            const notes = prompt('Rejection reason (optional):');
                                            if (notes !== null) handleApproval('reject', notes);
                                        }}
                                        disabled={actionLoading === 'reject'}
                                    >
                                        <FaTimesCircle aria-hidden="true" />
                                        <span>{actionLoading === 'reject' ? 'Rejecting...' : 'Reject'}</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Approved Actions */}
                    {requisition.status === 'APPROVED' && canFulfill() && (
                        <div className="finance-table-container" data-animate="fade-up" data-delay="0.16">
                            <div style={{ padding: '1.75rem' }}>
                                <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1.1rem', fontWeight: '700', color: 'var(--finance-text-primary)' }}>
                                    Fulfillment Actions
                                </h3>
                                <button
                                    className="finance-btn finance-btn--blue"
                                    onClick={() => setShowFulfillmentModal(true)}
                                >
                                    <FaClipboardCheck aria-hidden="true" />
                                    <span>Fulfill Requisition</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Fulfilled Actions */}
                    {requisition.status === 'FULFILLED' && canClose() && (
                        <div className="finance-table-container" data-animate="fade-up" data-delay="0.16">
                            <div style={{ padding: '1.75rem' }}>
                                <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1.1rem', fontWeight: '700', color: 'var(--finance-text-primary)' }}>
                                    Close Requisition
                                </h3>
                                <button
                                    className="finance-btn finance-btn--secondary"
                                    onClick={() => {
                                        const notes = prompt('Closing notes (optional):');
                                        if (notes !== null) handleClose(notes);
                                    }}
                                    disabled={actionLoading === 'close'}
                                >
                                    <FaCheckCircle aria-hidden="true" />
                                    <span>{actionLoading === 'close' ? 'Closing...' : 'Mark as Closed'}</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Status History */}
                    <div className="finance-table-container" data-animate="fade-up" data-delay="0.20">
                        <div style={{ padding: '1.75rem' }}>
                            <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1.1rem', fontWeight: '700', color: 'var(--finance-text-primary)' }}>
                                Status History
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <div style={{ fontSize: '0.9rem', color: 'var(--finance-text-secondary)' }}>
                                    <strong>Created:</strong> {formatDate(requisition.createdAt)}
                                </div>
                                {requisition.approvedAt && (
                                    <div style={{ fontSize: '0.9rem', color: 'var(--finance-text-secondary)' }}>
                                        <strong>Approved:</strong> {formatDate(requisition.approvedAt)}
                                    </div>
                                )}
                                {requisition.fulfilledAt && (
                                    <div style={{ fontSize: '0.9rem', color: 'var(--finance-text-secondary)' }}>
                                        <strong>Fulfilled:</strong> {formatDate(requisition.fulfilledAt)}
                                    </div>
                                )}
                                {requisition.closedAt && (
                                    <div style={{ fontSize: '0.9rem', color: 'var(--finance-text-secondary)' }}>
                                        <strong>Closed:</strong> {formatDate(requisition.closedAt)}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <ConfirmDialog {...dialogConfig} onClose={closeDialog} />
            <FulfillmentModal
                show={showFulfillmentModal}
                handleClose={() => setShowFulfillmentModal(false)}
                requisition={requisition}
                onFulfillmentSuccess={fetchRequisition}
            />
        </section>
    );
};

export default RequisitionDetailsPage;