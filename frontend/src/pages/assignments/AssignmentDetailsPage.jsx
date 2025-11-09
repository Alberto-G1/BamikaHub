import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    FaArrowLeft, 
    FaEdit, 
    FaTrash, 
    FaUpload, 
    FaComment, 
    FaPaperPlane, 
    FaCheck, 
    FaTimes, 
    FaPlus,
    FaProjectDiagram,
    FaChartLine,
    FaClock,
    FaCheckCircle,
    FaExclamationCircle,
    FaFileUpload,
    FaPencilAlt
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import api from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import './AssignmentsStyles.css';
import '../reporting/ReportingStyles.css';

const AssignmentDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { hasPermission, user } = useAuth();

    const [assignment, setAssignment] = useState(null);
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newComment, setNewComment] = useState('');
    const [activityReports, setActivityReports] = useState({});
    const [activityFiles, setActivityFiles] = useState({});
    const [finalReportText, setFinalReportText] = useState('');
    const [finalReportFile, setFinalReportFile] = useState(null);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showAddActivity, setShowAddActivity] = useState(false);
    const [creatingActivity, setCreatingActivity] = useState(false);
    const [activityForm, setActivityForm] = useState({
        title: '',
        description: '',
        evidenceType: 'FILE',
        orderIndex: 1,
    });
    
    const isAssignee = assignment && user && assignment.assigneeId === user.id;
    const isAssigner = assignment && user && assignment.assignerId === user.id;

    useEffect(() => {
        fetchAssignmentDetails();
        fetchComments();
    }, [id]);

    const fetchAssignmentDetails = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/assignments/${id}`);
            setAssignment(response.data);
        } catch (error) {
            console.error('Error fetching assignment:', error);
            toast.error('Failed to load assignment details');
        } finally {
            setLoading(false);
        }
    };

    const fetchComments = async () => {
        try {
            const response = await api.get(`/assignments/${id}/comments`);
            setComments(response.data);
        } catch (error) {
            console.error('Error fetching comments:', error);
        }
    };

    const handleActivityFileChange = (activityId, file) => {
        setActivityFiles(prev => ({ ...prev, [activityId]: file }));
    };

    const uploadActivityEvidenceFile = async (activityId) => {
        const file = activityFiles[activityId];
        if (!file) {
            toast.error('Please choose a file');
            return;
        }
        try {
            const formData = new FormData();
            formData.append('file', file);
            await api.post(`/assignments/activities/${activityId}/evidence/file`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success('File evidence uploaded successfully');
            setActivityFiles(prev => ({ ...prev, [activityId]: null }));
            await fetchAssignmentDetails();
        } catch (e) {
            console.error(e);
            toast.error(e.response?.data?.message || 'Upload failed');
        }
    };

    const submitActivityReport = async (activityId) => {
        const report = activityReports[activityId] || '';
        if (!report.trim()) {
            toast.error('Please write your report before submitting');
            return;
        }
        try {
            await api.post(`/assignments/activities/${activityId}/evidence/report`, { report });
            toast.success('Report submitted successfully');
            setActivityReports(prev => ({ ...prev, [activityId]: '' }));
            await fetchAssignmentDetails();
        } catch (e) {
            console.error(e);
            toast.error(e.response?.data?.message || 'Failed to submit report');
        }
    };

    const completeActivity = async (activity) => {
        // Check if evidence has been submitted
        if (!activity.evidenceSubmitted) {
            if (activity.evidenceType === 'FILE') {
                toast.warning('Please upload a file before marking as complete');
                return;
            }
            if (activity.evidenceType === 'REPORT') {
                toast.warning('Please submit your report before marking as complete');
                return;
            }
        }

        try {
            await api.post(`/assignments/activities/${activity.id}/complete`, {});
            toast.success('Activity marked as completed!');
            await fetchAssignmentDetails();
        } catch (e) {
            console.error(e);
            toast.error(e.response?.data?.message || 'Failed to complete activity');
        }
    };

    const submitFinalReport = async () => {
        try {
            const formData = new FormData();
            if (finalReportFile) formData.append('file', finalReportFile);
            if (finalReportText) formData.append('reportText', finalReportText);
            await api.post(`/assignments/${id}/final-report`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success('Final report submitted');
            setFinalReportText('');
            setFinalReportFile(null);
            await fetchAssignmentDetails();
        } catch (e) {
            console.error(e);
            toast.error(e.response?.data?.message || 'Failed to submit final report');
        }
    };

    const approveAssignment = async () => {
        try {
            await api.post(`/assignments/${id}/review/approve`);
            toast.success('Assignment approved');
            await fetchAssignmentDetails();
        } catch (e) {
            console.error(e);
            toast.error(e.response?.data?.message || 'Failed to approve');
        }
    };

    const rejectAssignment = async () => {
        const comments = window.prompt('Reviewer comments (optional):', '') || '';
        try {
            await api.post(`/assignments/${id}/review/reject`, { comments, returnForRework: true });
            toast.info('Assignment returned for rework');
            await fetchAssignmentDetails();
        } catch (e) {
            console.error(e);
            toast.error(e.response?.data?.message || 'Failed to reject');
        }
    };

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        try {
            await api.post(`/assignments/${id}/comments`, { comment: newComment });
            setNewComment('');
            toast.success('Comment added');
            fetchComments();
        } catch (error) {
            console.error('Error adding comment:', error);
            toast.error('Failed to add comment');
        }
    };

    const openAddActivity = () => {
        if (!assignment) {
            toast.error('Assignment not loaded yet');
            return;
        }
        const nextIndex = assignment.activities && assignment.activities.length > 0
            ? Math.max(...assignment.activities.map(a => a.orderIndex || 0)) + 1
            : 1;
        setActivityForm(prev => ({ ...prev, orderIndex: nextIndex }));
        setShowAddActivity(true);
    };

    const createActivity = async () => {
        if (!activityForm.title.trim()) {
            toast.error('Activity title is required');
            return;
        }
        try {
            setCreatingActivity(true);
            const res = await api.post(`/assignments/${id}/activities`, {
                title: activityForm.title.trim(),
                description: activityForm.description?.trim() || '',
                orderIndex: Number(activityForm.orderIndex) || 1,
                evidenceType: activityForm.evidenceType,
            });
            toast.success(`Activity '${res.data.title}' added`);
            setShowAddActivity(false);
            setActivityForm({ title: '', description: '', evidenceType: 'FILE', orderIndex: 1 });
            await fetchAssignmentDetails();
        } catch (e) {
            console.error(e);
            toast.error(e.response?.data?.message || 'Failed to add activity');
        } finally {
            setCreatingActivity(false);
        }
    };

    const handleDeleteAssignment = async () => {
        try {
            await api.delete(`/assignments/${id}`);
            toast.success('Assignment deleted successfully');
            navigate('/assignments/created-by-me');
        } catch (error) {
            console.error('Error deleting assignment:', error);
            toast.error('Failed to delete assignment');
        }
    };

    const getPriorityBadge = (priority) => {
        const badgeMap = {
            LOW: { variant: 'info', text: 'Low' },
            MEDIUM: { variant: 'neutral', text: 'Medium' },
            HIGH: { variant: 'warning', text: 'High' },
            URGENT: { variant: 'danger', text: 'Urgent' }
        };
        const badge = badgeMap[priority] || badgeMap.MEDIUM;
        return <span className={`reporting-badge reporting-badge--${badge.variant}`}>{badge.text}</span>;
    };

    const getStatusBadge = (status, overdue) => {
        if (overdue) return <span className="reporting-badge reporting-badge--danger">Overdue</span>;
        
        const badgeMap = {
            PENDING: { variant: 'neutral', text: 'Pending' },
            IN_PROGRESS: { variant: 'info', text: 'In Progress' },
            UNDER_REVIEW: { variant: 'info', text: 'Under Review' },
            COMPLETED: { variant: 'success', text: 'Completed' },
            CANCELLED: { variant: 'neutral', text: 'Cancelled' }
        };
        const badge = badgeMap[status] || badgeMap.PENDING;
        return <span className={`reporting-badge reporting-badge--${badge.variant}`}>{badge.text}</span>;
    };

    const formatDate = (dateString) => {
        if (!dateString) return '—';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '—';
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <section className="reporting-page">
                <div className="reporting-loading">
                    <div className="reporting-spinner" />
                    <p className="reporting-card__subtitle">Loading assignment details…</p>
                </div>
            </section>
        );
    }

    if (!assignment) {
        return (
            <section className="reporting-page">
                <div className="reporting-card">
                    <div className="reporting-empty-state">
                        Assignment not found
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="reporting-page">
            {/* Header */}
            <div className="reporting-back" data-animate="fade-up">
                <button
                    type="button"
                    className="reporting-btn reporting-btn--secondary reporting-btn--sm"
                    onClick={() => navigate(-1)}
                >
                    <FaArrowLeft /> Back
                </button>
                <p className="reporting-back__title">Assignments • Details</p>
            </div>

            {/* Assignment Banner */}
            <div className="reporting-banner reporting-banner--compact" data-animate="fade-up" data-delay="0.04">
                <div className="reporting-banner__content">
                    <div className="reporting-banner__info">
                        <span className="reporting-banner__eyebrow">
                            <FaProjectDiagram /> Assignment
                        </span>
                        <h1 className="reporting-banner__title">{assignment.title}</h1>
                        <p className="reporting-banner__subtitle">
                            {assignment.description || 'Track progress and completion of assigned tasks.'}
                        </p>
                    </div>
                    <div className="reporting-banner__actions">
                        {hasPermission('ASSIGNMENT_UPDATE') && (
                            <button
                                className="reporting-btn reporting-btn--secondary"
                                onClick={() => navigate(`/assignments/edit/${id}`)}
                            >
                                <FaEdit /> Edit
                            </button>
                        )}
                        {hasPermission('ASSIGNMENT_DELETE') && (
                            <button
                                className="reporting-btn reporting-btn--secondary"
                                onClick={() => setShowDeleteDialog(true)}
                            >
                                <FaTrash /> Delete
                            </button>
                        )}
                    </div>
                </div>

                <div className="reporting-banner__meta">
                    <div className="reporting-banner__meta-item">
                        <div className="reporting-banner__meta-icon reporting-banner__meta-icon--blue">
                            <FaProjectDiagram />
                        </div>
                        <div className="reporting-banner__meta-content">
                            <span className="reporting-banner__meta-label">Assignee</span>
                            <span className="reporting-banner__meta-value">{assignment.assigneeName}</span>
                        </div>
                    </div>
                    <div className="reporting-banner__meta-item">
                        <div className="reporting-banner__meta-icon reporting-banner__meta-icon--green">
                            <FaCheckCircle />
                        </div>
                        <div className="reporting-banner__meta-content">
                            <span className="reporting-banner__meta-label">Status</span>
                            <span className="reporting-banner__meta-value">
                                {assignment.status === 'COMPLETED' ? 'Completed' : 'Active'}
                            </span>
                        </div>
                    </div>
                    <div className="reporting-banner__meta-item">
                        <div className="reporting-banner__meta-icon reporting-banner__meta-icon--purple">
                            <FaChartLine />
                        </div>
                        <div className="reporting-banner__meta-content">
                            <span className="reporting-banner__meta-label">Progress</span>
                            <span className="reporting-banner__meta-value">{assignment.progressPercentage || 0}%</span>
                        </div>
                    </div>
                    <div className="reporting-banner__meta-item">
                        <div className="reporting-banner__meta-icon reporting-banner__meta-icon--gold">
                            <FaClock />
                        </div>
                        <div className="reporting-banner__meta-content">
                            <span className="reporting-banner__meta-label">Due Date</span>
                            <span className="reporting-banner__meta-value">{formatDate(assignment.dueDate)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Assignment Details */}
            <div className="reporting-card" data-animate="fade-up" data-delay="0.08">
                <div className="reporting-card__header">
                    <div>
                        <h2 className="reporting-card__title">Assignment Details</h2>
                        <p className="reporting-card__subtitle">Priority, timeline, and progress information</p>
                    </div>
                    <div className="reporting-card__actions">
                        {getPriorityBadge(assignment.priority)}
                        {getStatusBadge(assignment.status, assignment.overdue)}
                    </div>
                </div>

                <div className="reporting-card__content">
                    <div className="reporting-metrics">
                        <div className="reporting-metric reporting-metric--blue">
                            <span className="reporting-metric__label">Assigner</span>
                            <span className="reporting-metric__value">{assignment.assignerName}</span>
                        </div>
                        <div className="reporting-metric reporting-metric--purple">
                            <span className="reporting-metric__label">Created</span>
                            <span className="reporting-metric__value">{formatDate(assignment.createdAt)}</span>
                        </div>
                        <div className="reporting-metric reporting-metric--gold">
                            <span className="reporting-metric__label">Days Remaining</span>
                            <span className="reporting-metric__value">
                                {assignment.daysRemaining > 0 ? assignment.daysRemaining : 'Overdue'}
                            </span>
                        </div>
                    </div>

                    {/* Progress Section */}
                    <div className="progress-section">
                        <h4 className="reporting-card__subtitle">Progress Overview</h4>
                        <div className="reporting-progress-wrapper">
                            <div className="reporting-progress" aria-label={`Completion ${assignment.progressPercentage || 0}%`}>
                                <div 
                                    className="reporting-progress__bar" 
                                    style={{ width: `${assignment.progressPercentage || 0}%` }}
                                />
                            </div>
                            <span className="reporting-progress__label">{assignment.progressPercentage || 0}%</span>
                        </div>
                        {assignment.manualProgressAllowed ? (
                            <p className="reporting-text--muted">Manual progress updates allowed</p>
                        ) : (
                            <p className="reporting-text--muted">Progress updates are automatic based on activities</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Activities Section */}
            <div className="reporting-card" data-animate="fade-up" data-delay="0.12">
                <div className="reporting-card__header">
                    <div>
                        <h2 className="reporting-card__title">Activities</h2>
                        <p className="reporting-card__subtitle">Track completion of individual tasks and evidence submission</p>
                    </div>
                    {(isAssigner || isAssignee) && (
                        <button className="reporting-btn reporting-btn--blue reporting-btn--sm" onClick={openAddActivity}>
                            <FaPlus /> Add Activity
                        </button>
                    )}
                </div>

                <div className="reporting-card__content">
                    {!assignment.activities || assignment.activities.length === 0 ? (
                        <div className="reporting-empty-state">
                            <FaProjectDiagram style={{ fontSize: '3rem', opacity: 0.3, marginBottom: '1rem' }} />
                            <p>No activities defined yet.</p>
                            <small className="reporting-text--muted">Add activities to track progress</small>
                        </div>
                    ) : (
                        <div className="activities-grid">
                            {assignment.activities.map((activity) => (
                                <div 
                                    key={activity.id} 
                                    className={`activity-card ${activity.status === 'COMPLETED' ? 'activity-card--completed' : ''}`}
                                >
                                    <div className="activity-card__header">
                                        <div className={`activity-card__icon ${activity.status === 'COMPLETED' ? 'activity-card__icon--green' : 'activity-card__icon--blue'}`}>
                                            {activity.status === 'COMPLETED' ? <FaCheckCircle /> : <FaClock />}
                                        </div>
                                        <div className="activity-card__info">
                                            <h3 className="activity-card__title">{activity.title}</h3>
                                            <p className="activity-card__description">
                                                {activity.description || 'No description provided'}
                                            </p>
                                        </div>
                                        <span className={`reporting-badge activity-card__badge ${activity.status === 'COMPLETED' ? 'reporting-badge--success' : 'reporting-badge--info'}`}>
                                            {activity.status === 'COMPLETED' ? 'Completed' : 'Pending'}
                                        </span>
                                    </div>

                                    {/* Evidence submission section - only for assignee and pending activities */}
                                    {activity.status !== 'COMPLETED' && isAssignee && (
                                        <div className="activity-card__body">
                                            <div className="activity-actions">
                                                {activity.evidenceType === 'FILE' && (
                                                    <div className="activity-evidence">
                                                        <label className="activity-evidence__label">
                                                            <FaFileUpload /> Upload Evidence File
                                                        </label>
                                                        <div className="activity-evidence__file-input">
                                                            <input 
                                                                type="file" 
                                                                className="reporting-input"
                                                                onChange={(e) => handleActivityFileChange(activity.id, e.target.files[0])}
                                                                accept="*/*"
                                                            />
                                                            {activityFiles[activity.id] && (
                                                                <div className="reporting-text--muted" style={{ fontSize: '0.85rem' }}>
                                                                    Selected: {activityFiles[activity.id].name}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="activity-actions__group">
                                                            <button 
                                                                className="reporting-btn reporting-btn--blue reporting-btn--sm"
                                                                onClick={() => uploadActivityEvidenceFile(activity.id)}
                                                                disabled={!activityFiles[activity.id]}
                                                            >
                                                                <FaUpload /> Upload File
                                                            </button>
                                                            {activity.evidenceSubmitted && (
                                                                <span className="reporting-badge reporting-badge--success">
                                                                    <FaCheckCircle /> Evidence Uploaded
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                {activity.evidenceType === 'REPORT' && (
                                                    <div className="activity-report">
                                                        <label className="activity-evidence__label">
                                                            <FaPencilAlt /> Write Your Report
                                                        </label>
                                                        <textarea
                                                            className="reporting-textarea"
                                                            rows="4"
                                                            value={activityReports[activity.id] || ''}
                                                            onChange={(e) => setActivityReports(prev => ({ ...prev, [activity.id]: e.target.value }))}
                                                            placeholder="Describe what you did, findings, results, or any relevant details..."
                                                            disabled={activity.evidenceSubmitted}
                                                        />
                                                        <div className="activity-actions__group">
                                                            <button 
                                                                className="reporting-btn reporting-btn--blue reporting-btn--sm"
                                                                onClick={() => submitActivityReport(activity.id)}
                                                                disabled={!activityReports[activity.id]?.trim() || activity.evidenceSubmitted}
                                                            >
                                                                <FaPaperPlane /> Submit Report
                                                            </button>
                                                            {activity.evidenceSubmitted && (
                                                                <span className="reporting-badge reporting-badge--success">
                                                                    <FaCheckCircle /> Report Submitted
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Complete Activity Button */}
                                                <button 
                                                    className="reporting-btn reporting-btn--gold reporting-btn--sm"
                                                    onClick={() => completeActivity(activity)}
                                                    disabled={!activity.evidenceSubmitted}
                                                    title={!activity.evidenceSubmitted ? 'Submit evidence first' : 'Mark activity as complete'}
                                                >
                                                    <FaCheck /> Mark as Complete
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Completion meta info and evidence review for completed activities */}
                                    {activity.completedAt && (
                                        <>
                                            <div className="activity-meta">
                                                <span className="activity-meta__item">
                                                    <FaCheckCircle className="activity-meta__icon" />
                                                    Completed on {formatDate(activity.completedAt)}
                                                </span>
                                                {activity.completedByName && (
                                                    <span className="activity-meta__item">
                                                        by {activity.completedByName}
                                                    </span>
                                                )}
                                            </div>
                                            
                                            {/* Evidence Review Section - visible to assigners and admins */}
                                            {(isAssigner || hasPermission('ASSIGNMENT_UPDATE')) && activity.evidenceSubmitted && (
                                                <div className="activity-card__review">
                                                    <h4 className="activity-review__title">Submitted Evidence</h4>
                                                    
                                                    {activity.evidenceType === 'REPORT' && activity.evidenceReport && (
                                                        <div className="activity-review__section">
                                                            <label className="activity-review__label">
                                                                <FaPencilAlt /> Written Report
                                                            </label>
                                                            <div className="activity-review__content">
                                                                {activity.evidenceReport}
                                                            </div>
                                                            {activity.evidenceSubmittedByName && activity.evidenceSubmittedAt && (
                                                                <div className="activity-review__meta">
                                                                    Submitted by {activity.evidenceSubmittedByName} on {formatDate(activity.evidenceSubmittedAt)}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                    
                                                    {activity.evidenceType === 'FILE' && activity.evidenceFilePath && (
                                                        <div className="activity-review__section">
                                                            <label className="activity-review__label">
                                                                <FaFileUpload /> Uploaded File
                                                            </label>
                                                            <div className="activity-review__file">
                                                                <a 
                                                                    href={`${import.meta.env.VITE_BACKEND_BASE_URL || 'http://localhost:8080'}/api/assignments/activities/${activity.id}/evidence/download`}
                                                                    className="reporting-btn reporting-btn--blue reporting-btn--sm"
                                                                    download
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                >
                                                                    <FaFileUpload /> Download Evidence File
                                                                </a>
                                                            </div>
                                                            {activity.evidenceSubmittedByName && activity.evidenceSubmittedAt && (
                                                                <div className="activity-review__meta">
                                                                    Submitted by {activity.evidenceSubmittedByName} on {formatDate(activity.evidenceSubmittedAt)}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Final Report Section */}
            {assignment.activities && assignment.activities.length > 0 && 
             assignment.activities.every(a => a.status === 'COMPLETED') && 
             assignment.status !== 'UNDER_REVIEW' && 
             assignment.status !== 'COMPLETED' && 
             isAssignee && (
                <div className="reporting-card" data-animate="fade-up" data-delay="0.16">
                    <div className="reporting-card__header">
                        <h2 className="reporting-card__title">Final Report Submission</h2>
                        <p className="reporting-card__subtitle">Submit your final report for review</p>
                    </div>
                    <div className="reporting-card__content">
                        <div className="reporting-form-group">
                            <label className="reporting-form-label">Attach Final Report (Optional)</label>
                            <input 
                                type="file" 
                                className="reporting-input"
                                onChange={(e) => setFinalReportFile(e.target.files[0])} 
                            />
                        </div>
                        <div className="reporting-form-group">
                            <label className="reporting-form-label">Final Report Summary</label>
                            <textarea
                                className="reporting-textarea"
                                rows="4"
                                placeholder="Summarize your work, findings, or outcome..."
                                value={finalReportText}
                                onChange={(e) => setFinalReportText(e.target.value)}
                            />
                        </div>
                        <button 
                            className="reporting-btn reporting-btn--gold"
                            onClick={submitFinalReport}
                        >
                            <FaPaperPlane /> Submit Final Report
                        </button>
                    </div>
                </div>
            )}

            {/* Review Section */}
            {assignment.status === 'UNDER_REVIEW' && isAssigner && (
                <div className="reporting-card" data-animate="fade-up" data-delay="0.2">
                    <div className="reporting-card__header">
                        <h2 className="reporting-card__title">Review Assignment</h2>
                        <p className="reporting-card__subtitle">Approve or return for rework</p>
                    </div>
                    <div className="reporting-card__content">
                        <div className="review-actions">
                            <button className="reporting-btn reporting-btn--green" onClick={approveAssignment}>
                                <FaCheck /> Approve Assignment
                            </button>
                            <button className="reporting-btn reporting-btn--red" onClick={rejectAssignment}>
                                <FaTimes /> Return for Rework
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Comments Section */}
            <div className="reporting-card" data-animate="fade-up" data-delay="0.24">
                <div className="reporting-card__header">
                    <h2 className="reporting-card__title">
                        <FaComment /> Comments ({comments.length})
                    </h2>
                </div>

                <div className="reporting-card__content">
                    {(isAssignee || isAssigner || hasPermission('ASSIGNMENT_READ')) && (
                        <form onSubmit={handleAddComment} className="comment-form">
                            <textarea
                                className="reporting-textarea"
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Add a comment..."
                                rows="3"
                                required
                            />
                            <button 
                                type="submit" 
                                className="reporting-btn reporting-btn--blue"
                                disabled={!newComment.trim()}
                            >
                                Post Comment
                            </button>
                        </form>
                    )}

                    <div className="comments-list">
                        {comments.length === 0 ? (
                            <div className="reporting-empty-state">
                                No comments yet
                            </div>
                        ) : (
                            comments.map(comment => (
                                <div key={comment.id} className="comment-item">
                                    <div className="comment-header">
                                        <strong>{comment.userName}</strong>
                                        <span className="reporting-text--muted">{comment.createdAt}</span>
                                    </div>
                                    <p className="comment-text">{comment.comment}</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Add Activity Modal */}
            {showAddActivity && (
                <div className="reporting-overlay">
                    <div className="reporting-card reporting-modal">
                        <div className="reporting-card__header">
                            <h2 className="reporting-card__title">Add Activity</h2>
                            <button 
                                className="reporting-btn reporting-btn--secondary reporting-btn--sm"
                                onClick={() => !creatingActivity && setShowAddActivity(false)}
                                disabled={creatingActivity}
                            >
                                <FaTimes />
                            </button>
                        </div>
                        <div className="reporting-card__content">
                            <div className="reporting-form-group">
                                <label className="reporting-form-label">Title</label>
                                <input
                                    type="text"
                                    className="reporting-input"
                                    value={activityForm.title}
                                    onChange={(e) => setActivityForm(prev => ({ ...prev, title: e.target.value }))}
                                    placeholder="Activity title"
                                    required
                                />
                            </div>
                            <div className="reporting-form-group">
                                <label className="reporting-form-label">Description</label>
                                <textarea
                                    className="reporting-textarea"
                                    rows="3"
                                    value={activityForm.description}
                                    onChange={(e) => setActivityForm(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="Optional details or instructions"
                                />
                            </div>
                            <div className="reporting-filters__grid">
                                <div className="reporting-form-group">
                                    <label className="reporting-form-label">Order</label>
                                    <input
                                        type="number"
                                        className="reporting-input"
                                        min="1"
                                        value={activityForm.orderIndex}
                                        onChange={(e) => setActivityForm(prev => ({ ...prev, orderIndex: e.target.value }))}
                                    />
                                    <small className="reporting-text--muted">Controls display sequence</small>
                                </div>
                                <div className="reporting-form-group">
                                    <label className="reporting-form-label">Evidence Type</label>
                                    <select
                                        className="reporting-select"
                                        value={activityForm.evidenceType}
                                        onChange={(e) => setActivityForm(prev => ({ ...prev, evidenceType: e.target.value }))}
                                    >
                                        <option value="FILE">File Upload</option>
                                        <option value="REPORT">Written Report</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="reporting-card__actions">
                            <button
                                className="reporting-btn reporting-btn--secondary"
                                onClick={() => setShowAddActivity(false)}
                                disabled={creatingActivity}
                            >
                                Cancel
                            </button>
                            <button
                                className="reporting-btn reporting-btn--gold"
                                onClick={createActivity}
                                disabled={creatingActivity}
                            >
                                {creatingActivity ? 'Adding…' : 'Add Activity'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation */}
            <ConfirmDialog
                isOpen={showDeleteDialog}
                title="Delete Assignment"
                message="Are you sure you want to delete this assignment? This action cannot be undone."
                onConfirm={handleDeleteAssignment}
                onCancel={() => setShowDeleteDialog(false)}
                confirmText="Delete"
                cancelText="Cancel"
                variant="danger"
            />
        </section>
    );
};

export default AssignmentDetailsPage;