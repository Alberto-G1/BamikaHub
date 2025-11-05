import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaPaperPlane, FaDownload, FaTimes, FaUserCheck, FaCheckCircle, FaTicketAlt, FaExclamationTriangle, FaClock, FaHourglassHalf } from 'react-icons/fa';
import api from '../../api/api.js';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext.jsx';
import './SupportStyles.css';

const formatDateTime = (value) => (value ? new Date(value).toLocaleString() : '—');

const TicketDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, hasPermission } = useAuth();

    const [ticket, setTicket] = useState(null);
    const [loading, setLoading] = useState(true);

    const [newComment, setNewComment] = useState('');
    const [attachmentFile, setAttachmentFile] = useState(null);
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);
    const [resolutionNotes, setResolutionNotes] = useState('');

    const fileInputRef = useRef(null);

    const canManageTickets = hasPermission('TICKET_MANAGE');

    const fetchData = async () => {
        try {
            const response = await api.get(`/support/tickets/${id}`);
            setTicket(response.data);
        } catch (error) {
            toast.error('Failed to load ticket details.');
            navigate('/support/tickets');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setLoading(true);
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const handleAddComment = async (event) => {
        event.preventDefault();
        if (!newComment.trim() && !attachmentFile) {
            toast.warn('Please add a comment or attach a file.');
            return;
        }
        setIsSubmittingComment(true);

        const formData = new FormData();
        formData.append('comment', JSON.stringify({ comment: newComment }));
        if (attachmentFile) {
            formData.append('file', attachmentFile);
        }

        try {
            await api.post(`/support/tickets/${id}/comments`, formData);
            toast.success('Update posted successfully.');
            setNewComment('');
            setAttachmentFile(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = null;
            }
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to post update.');
        } finally {
            setIsSubmittingComment(false);
        }
    };

    const handleAssignToSelf = async () => {
        try {
            await api.post(`/support/tickets/${id}/assign`);
            toast.success('Ticket assigned to you.');
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to assign ticket.');
        }
    };

    const handleResolve = async () => {
        if (!resolutionNotes.trim()) {
            toast.error('Resolution notes are required.');
            return;
        }
        try {
            await api.post(`/support/tickets/${id}/resolve`, { comment: resolutionNotes });
            toast.success('Ticket marked as resolved.');
            setResolutionNotes('');
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to resolve ticket.');
        }
    };

    const handleClose = async () => {
        try {
            await api.post(`/support/tickets/${id}/close`);
            toast.info('Ticket has been closed.');
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to close ticket.');
        }
    };

    if (loading) {
        return (
            <section className="support-page support-page--centered">
                <div className="support-loading">
                    <div className="support-spinner"></div>
                    <p>Loading ticket details...</p>
                </div>
            </section>
        );
    }

    if (!ticket) {
        return (
            <section className="support-page support-page--centered">
                <div className="support-empty-state">Ticket not found.</div>
            </section>
        );
    }

    const attachments = ticket.attachments || [];
    const activityLog = ticket.activityLog || [];
    const isSubmitter = user?.id === ticket.submittedById;
    const ticketNumber = `#${String(ticket.id).padStart(4, '0')}`;
    const statusLabel = ticket.status.replace(/_/g, ' ');
    const statusBadgeClass = `support-badge ${
        ticket.status === 'OPEN' ? 'support-badge--primary' :
        ticket.status === 'IN_PROGRESS' ? 'support-badge--warning' :
        ticket.status === 'RESOLVED' ? 'support-badge--success' :
        'support-badge--secondary'
    }`;
    const priorityBadgeClass = `support-badge ${['HIGH', 'URGENT'].includes(ticket.priority) ? 'support-badge--danger' : 'support-badge--info'}`;
    const responseStatusClass = `support-badge ${ticket.responseBreached ? 'support-badge--danger' : 'support-badge--success'}`;
    const resolutionStatusClass = `support-badge ${ticket.resolutionBreached ? 'support-badge--danger' : 'support-badge--success'}`;
    const responseDueLabel = formatDateTime(ticket.responseDueAt);
    const resolutionDueLabel = formatDateTime(ticket.resolutionDueAt);

    return (
        <section className="support-page">
            <div className="support-banner" data-animate="fade-up">
                <div className="support-banner__content">
                    <div className="support-banner__info">
                        <span className="support-banner__eyebrow">
                            <FaTicketAlt /> Ticket Details
                        </span>
                        <h1 className="support-banner__title">{ticket.subject}</h1>
                        <p className="support-banner__subtitle">
                            {ticketNumber} • Priority {ticket.priority} • Submitted by {ticket.submittedByName || '—'}
                        </p>
                    </div>
                    <div className="support-banner__actions">
                        <button className="support-btn support-btn--secondary" onClick={() => navigate('/support/tickets')}>
                            <FaArrowLeft /> Back to Tickets
                        </button>
                    </div>
                </div>
                <div className="support-banner__meta">
                    <div className="support-banner__meta-item">
                        <div className="support-banner__meta-icon support-banner__meta-icon--blue">
                            <FaTicketAlt />
                        </div>
                        <div className="support-banner__meta-content">
                            <span className="support-banner__meta-label">Status</span>
                            <span className="support-banner__meta-value">
                                <span className={statusBadgeClass}>{statusLabel}</span>
                            </span>
                        </div>
                    </div>
                    <div className="support-banner__meta-item">
                        <div className="support-banner__meta-icon support-banner__meta-icon--gold">
                            <FaExclamationTriangle />
                        </div>
                        <div className="support-banner__meta-content">
                            <span className="support-banner__meta-label">Priority</span>
                            <span className="support-banner__meta-value">
                                <span className={priorityBadgeClass}>{ticket.priority}</span>
                            </span>
                        </div>
                    </div>
                    <div className="support-banner__meta-item">
                        <div className="support-banner__meta-icon support-banner__meta-icon--green">
                            <FaUserCheck />
                        </div>
                        <div className="support-banner__meta-content">
                            <span className="support-banner__meta-label">Assigned To</span>
                            <span className="support-banner__meta-value">{ticket.assignedToName || 'Unassigned'}</span>
                        </div>
                    </div>
                    <div className="support-banner__meta-item">
                        <div className="support-banner__meta-icon support-banner__meta-icon--gold">
                            <FaClock />
                        </div>
                        <div className="support-banner__meta-content">
                            <span className="support-banner__meta-label">Response Due</span>
                            <span className="support-banner__meta-value">{responseDueLabel}</span>
                            <span className={`${responseStatusClass} support-badge--sm`}>
                                {ticket.responseBreached ? 'Breached' : 'On Track'}
                            </span>
                        </div>
                    </div>
                    <div className="support-banner__meta-item">
                        <div className="support-banner__meta-icon support-banner__meta-icon--purple">
                            <FaHourglassHalf />
                        </div>
                        <div className="support-banner__meta-content">
                            <span className="support-banner__meta-label">Resolution Due</span>
                            <span className="support-banner__meta-value">{resolutionDueLabel}</span>
                            <span className={`${resolutionStatusClass} support-badge--sm`}>
                                {ticket.resolutionBreached ? 'Breached' : 'On Track'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="support-details" data-animate="fade-up" data-delay="0.08">
                <div className="support-details__grid" data-animate="fade-up" data-delay="0.12">
                    <div className="support-details__main">
                        {/* Ticket Information */}
                        <div className="support-card">
                            <div className="support-card__header">
                                <div>
                                    <h2 className="support-card__title">{ticket.subject}</h2>
                                    <p className="support-card__subtitle">
                                        Ticket {ticketNumber}
                                    </p>
                                </div>
                                <span className={statusBadgeClass}>{statusLabel}</span>
                            </div>
                            <div className="support-card__content">
                                <p className="support-card__description">
                                    {ticket.description}
                                </p>
                                <div className="support-info-list">
                                    <div className="support-info-item">
                                        <span className="support-info-label">Submitted By</span>
                                        <span className="support-info-value">{ticket.submittedByName || '—'}</span>
                                    </div>
                                    <div className="support-info-item">
                                        <span className="support-info-label">Department</span>
                                        <span className="support-info-value">{ticket.submitterDepartment || '—'}</span>
                                    </div>
                                    <div className="support-info-item">
                                        <span className="support-info-label">Category</span>
                                        <span className="support-info-value">
                                            {ticket.categoryName === 'OTHER' ? ticket.otherCategory : ticket.categoryName?.replace(/_/g, ' ') || '—'}
                                        </span>
                                    </div>
                                    <div className="support-info-item">
                                        <span className="support-info-label">Assigned To</span>
                                        <span className="support-info-value">{ticket.assignedToName || 'Unassigned'}</span>
                                    </div>
                                    <div className="support-info-item">
                                        <span className="support-info-label">Priority</span>
                                        <span className="support-info-value">
                                            <span className={priorityBadgeClass}>{ticket.priority}</span>
                                        </span>
                                    </div>
                                    <div className="support-info-item">
                                        <span className="support-info-label">Created</span>
                                        <span className="support-info-value">{formatDateTime(ticket.createdAt)}</span>
                                    </div>
                                    <div className="support-info-item">
                                        <span className="support-info-label">Updated</span>
                                        <span className="support-info-value">{formatDateTime(ticket.updatedAt)}</span>
                                    </div>
                                    {ticket.inventoryItemName && (
                                        <div className="support-info-item">
                                            <span className="support-info-label">Related Item</span>
                                            <span className="support-info-value">{ticket.inventoryItemName}</span>
                                        </div>
                                    )}
                                    {ticket.projectName && (
                                        <div className="support-info-item">
                                            <span className="support-info-label">Project</span>
                                            <span className="support-info-value">{ticket.projectName}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* SLA Tracking */}
                        <div className="support-card">
                            <div className="support-card__header">
                                <h3 className="support-card__title">SLA Tracking</h3>
                            </div>
                            <div className="support-card__content">
                                <div className="support-info-list">
                                    <div className="support-info-item">
                                        <span className="support-info-label">Response Due</span>
                                        <span className="support-info-value">{responseDueLabel}</span>
                                    </div>
                                    <div className="support-info-item">
                                        <span className="support-info-label">First Response</span>
                                        <span className="support-info-value">{formatDateTime(ticket.firstResponseAt)}</span>
                                    </div>
                                    <div className="support-info-item">
                                        <span className="support-info-label">Response Status</span>
                                        <span className="support-info-value">
                                            <span className={responseStatusClass}>{ticket.responseBreached ? 'Breached' : 'On Track'}</span>
                                        </span>
                                    </div>
                                    <div className="support-info-item">
                                        <span className="support-info-label">Resolution Due</span>
                                        <span className="support-info-value">{resolutionDueLabel}</span>
                                    </div>
                                    <div className="support-info-item">
                                        <span className="support-info-label">Resolved At</span>
                                        <span className="support-info-value">{formatDateTime(ticket.resolvedAt)}</span>
                                    </div>
                                    <div className="support-info-item">
                                        <span className="support-info-label">Resolution Status</span>
                                        <span className="support-info-value">
                                            <span className={resolutionStatusClass}>{ticket.resolutionBreached ? 'Breached' : 'On Track'}</span>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Conversation */}
                        <div className="support-card">
                            <div className="support-card__header">
                                <h3 className="support-card__title">Conversation</h3>
                            </div>
                            <div className="support-card__content">
                                {(ticket.comments || []).length > 0 ? (
                                    (ticket.comments || []).map((comment) => (
                                        <div key={comment.id} className={`support-comment ${comment.fromSubmitter ? 'support-comment--submitter' : ''}`}>
                                            <div className="support-comment__header">
                                                <span className="support-comment__author">{comment.commenterName || 'System'}</span>
                                                <span className="support-comment__date">{formatDateTime(comment.createdAt)}</span>
                                            </div>
                                            <div className="support-comment__body">{comment.comment}</div>
                                            {comment.fileUrl && (
                                                <a
                                                    href={comment.fileUrl.startsWith('http') ? comment.fileUrl : `http://localhost:8080${comment.fileUrl}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="support-comment__attachment"
                                                >
                                                    <FaDownload /> View Attachment
                                                </a>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div className="support-empty-state">No updates yet.</div>
                                )}

                                {ticket.status !== 'CLOSED' && (
                                    <form onSubmit={handleAddComment} className="support-comment-form">
                                        <div className="support-form-group">
                                            <label htmlFor="newComment">Add Comment</label>
                                            <textarea
                                                id="newComment"
                                                value={newComment}
                                                onChange={(event) => setNewComment(event.target.value)}
                                                placeholder="Share progress updates or request more info"
                                                className="support-textarea"
                                                rows={3}
                                            />
                                        </div>
                                        <div className="support-form-group">
                                            <label htmlFor="newCommentAttachment">Attach File (optional)</label>
                                            <input
                                                type="file"
                                                id="newCommentAttachment"
                                                ref={fileInputRef}
                                                onChange={(event) => setAttachmentFile(event.target.files[0])}
                                                className="support-input"
                                            />
                                        </div>
                                        <button type="submit" className="support-btn support-btn--gold" disabled={isSubmittingComment}>
                                            {isSubmittingComment ? 'Posting…' : <><FaPaperPlane /> Post Update</>}
                                        </button>
                                    </form>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="support-details__sidebar">
                        {/* Ticket Actions */}
                        <div className="support-card">
                            <div className="support-card__header">
                                <h3 className="support-card__title">Ticket Actions</h3>
                            </div>
                            <div className="support-card__content">
                                {canManageTickets && ticket.status === 'OPEN' && (
                                    <button className="support-btn support-btn--blue support-btn--block" onClick={handleAssignToSelf}>
                                        <FaUserCheck /> Assign to Me
                                    </button>
                                )}
                                {canManageTickets && ticket.status === 'IN_PROGRESS' && (
                                    <div className="support-action-stack">
                                        <div className="support-form-group">
                                            <label htmlFor="resolutionNotes">Resolution Notes</label>
                                            <textarea
                                                id="resolutionNotes"
                                                value={resolutionNotes}
                                                onChange={(event) => setResolutionNotes(event.target.value)}
                                                placeholder="Describe how the issue was resolved"
                                                className="support-textarea"
                                                rows={3}
                                            />
                                        </div>
                                        <button className="support-btn support-btn--green support-btn--block" onClick={handleResolve}>
                                            <FaCheckCircle /> Mark as Resolved
                                        </button>
                                    </div>
                                )}
                                {isSubmitter && ticket.status === 'RESOLVED' && (
                                    <button className="support-btn support-btn--secondary support-btn--block" onClick={handleClose}>
                                        <FaTimes /> Close Ticket
                                    </button>
                                )}
                                {!canManageTickets && !isSubmitter && (
                                    <div className="support-empty-state">No actions available.</div>
                                )}
                            </div>
                        </div>

                        {/* Attachments */}
                        <div className="support-card">
                            <div className="support-card__header">
                                <h3 className="support-card__title">Attachments</h3>
                            </div>
                            <div className="support-card__content">
                                {attachments.length > 0 ? (
                                    <div className="support-info-list">
                                        {attachments.map((file) => (
                                            <div key={file.id} className="support-info-item support-info-item--column">
                                                <div className="support-attachment-title">{file.originalFilename}</div>
                                                <div className="support-attachment-meta">
                                                    Uploaded {formatDateTime(file.uploadedAt)} by {file.uploadedByName || 'Unknown'}
                                                </div>
                                                <a
                                                    href={file.fileUrl?.startsWith('http') ? file.fileUrl : `http://localhost:8080${file.fileUrl}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="support-btn support-btn--blue support-btn--sm"
                                                >
                                                    <FaDownload /> Download
                                                </a>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="support-empty-state">No attachments</div>
                                )}
                            </div>
                        </div>

                        {/* Activity Log */}
                        <div className="support-card">
                            <div className="support-card__header">
                                <h3 className="support-card__title">Activity Log</h3>
                            </div>
                            <div className="support-card__content">
                                {activityLog.length > 0 ? (
                                    <div className="support-info-list">
                                        {activityLog.map((activity) => (
                                            <div key={activity.id} className="support-info-item support-info-item--column support-activity-item">
                                                <div className="support-activity-title">
                                                    {activity.actionType ? activity.actionType.replace(/_/g, ' ') : 'Activity'}
                                                </div>
                                                <div className="support-activity-detail">{activity.details}</div>
                                                <div className="support-activity-meta">
                                                    {(activity.performedByName || 'System')} • {formatDateTime(activity.createdAt)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="support-empty-state">No activity recorded</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default TicketDetailsPage;