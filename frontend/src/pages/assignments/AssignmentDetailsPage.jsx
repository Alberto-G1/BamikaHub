import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaEdit, FaTrash, FaUpload, FaComment, FaPaperPlane, FaCheck, FaTimes, FaPlus } from 'react-icons/fa';
import { toast } from 'react-toastify';
import api from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import './AssignmentDetailsPage.css';

const AssignmentDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { hasPermission, user } = useAuth();

    const [assignment, setAssignment] = useState(null);
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newComment, setNewComment] = useState('');
    // Workflow v2 local state
    const [activityReports, setActivityReports] = useState({}); // { [activityId]: string }
    const [activityFiles, setActivityFiles] = useState({});     // { [activityId]: File }
    const [finalReportText, setFinalReportText] = useState('');
    const [finalReportFile, setFinalReportFile] = useState(null);
    const [progress, setProgress] = useState(0);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [updatingProgress, setUpdatingProgress] = useState(false);
    // Add activity UI
    const [showAddActivity, setShowAddActivity] = useState(false);
    const [creatingActivity, setCreatingActivity] = useState(false);
    const [activityForm, setActivityForm] = useState({
        title: '',
        description: '',
        evidenceType: 'FILE',
        orderIndex: 1,
    });
    
    // Check if current user is assignee or assigner
    const isAssignee = assignment && user && assignment.assigneeId === user.id;
    const isAssigner = assignment && user && assignment.assignerId === user.id;

    useEffect(() => {
        fetchAssignmentDetails();
        fetchComments();
    }, [id]);

    // Sync local progress state when assignment data changes
    useEffect(() => {
        if (assignment) {
            setProgress(assignment.progressPercentage || 0);
        }
    }, [assignment?.progressPercentage]);

    const fetchAssignmentDetails = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/assignments/${id}`);
            setAssignment(response.data);
            setProgress(response.data.progressPercentage || 0);
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

    const handleProgressUpdate = async () => {
        if (!isAssignee) {
            toast.error('Only the assignee can update progress');
            return;
        }
        
        try {
            setUpdatingProgress(true);
            await api.patch(`/assignments/${id}/progress?progress=${progress}`);
            toast.success(`Progress updated to ${progress}%`);
            await fetchAssignmentDetails(); // Refresh to get updated status
        } catch (error) {
            console.error('Error updating progress:', error);
            toast.error(error.response?.data?.message || 'Failed to update progress');
        } finally {
            setUpdatingProgress(false);
        }
    };

    // ===== Workflow v2 actions =====
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
            toast.success('Evidence uploaded');
            await fetchAssignmentDetails();
        } catch (e) {
            console.error(e);
            toast.error(e.response?.data?.message || 'Upload failed');
        }
    };

    const completeActivity = async (activity) => {
        try {
            let payload = undefined;
            if (activity.evidenceType === 'REPORT') {
                const report = activityReports[activity.id] || '';
                if (!report.trim()) {
                    toast.error('Please provide the report text');
                    return;
                }
                payload = { report };
            }
            await api.post(`/assignments/activities/${activity.id}/complete`, payload || {});
            toast.success('Activity completed');
            setActivityReports(prev => ({ ...prev, [activity.id]: '' }));
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

    // Add activity handlers
    const openAddActivity = () => {
        // Defensive: ensure assignment loaded
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
            MEDIUM: { variant: 'secondary', text: 'Medium' },
            HIGH: { variant: 'warning', text: 'High' },
            URGENT: { variant: 'danger', text: 'Urgent' }
        };
        const badge = badgeMap[priority] || badgeMap.MEDIUM;
        return <Badge variant={badge.variant}>{badge.text}</Badge>;
    };

    const getStatusBadge = (status, overdue) => {
        if (overdue) return <Badge variant="danger">Overdue</Badge>;
        
        const badgeMap = {
            PENDING: { variant: 'secondary', text: 'Pending' },
            IN_PROGRESS: { variant: 'primary', text: 'In Progress' },
            UNDER_REVIEW: { variant: 'info', text: 'Under Review' },
            COMPLETED: { variant: 'success', text: 'Completed' },
            CANCELLED: { variant: 'dark', text: 'Cancelled' }
        };
        const badge = badgeMap[status] || badgeMap.PENDING;
        return <Badge variant={badge.variant}>{badge.text}</Badge>;
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

    // No generic attachments support in workflow v2

    if (loading) {
        return (
            <div className="assignment-details-page">
                <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (!assignment) {
        return (
            <div className="assignment-details-page">
                <Card>
                    <div className="text-center py-5">
                        <p>Assignment not found</p>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="assignment-details-page">
            {/* Header */}
            <div className="page-header">
                <Button variant="outline-secondary" onClick={() => navigate(-1)} icon={<FaArrowLeft />}>
                    Back
                </Button>
                <div className="header-actions">
                    {hasPermission('ASSIGNMENT_UPDATE') && (
                        <Button 
                            variant="outline-primary" 
                            onClick={() => navigate(`/assignments/edit/${id}`)}
                            icon={<FaEdit />}
                        >
                            Edit
                        </Button>
                    )}
                    {hasPermission('ASSIGNMENT_DELETE') && (
                        <Button 
                            variant="outline-danger" 
                            onClick={() => setShowDeleteDialog(true)}
                            icon={<FaTrash />}
                        >
                            Delete
                        </Button>
                    )}
                </div>
            </div>

            {/* Assignment Details Card */}
            <Card className="assignment-details-card">
                <div className="assignment-header">
                    <div>
                        <h1 className="assignment-title">{assignment.title}</h1>
                        <div className="assignment-badges">
                            {getPriorityBadge(assignment.priority)}
                            {getStatusBadge(assignment.status, assignment.overdue)}
                        </div>
                    </div>
                </div>

                <div className="assignment-meta-grid">
                    <div className="meta-item">
                        <strong>Assigned To:</strong>
                        <span>{assignment.assigneeName}</span>
                    </div>
                    <div className="meta-item">
                        <strong>Assigned By:</strong>
                        <span>{assignment.assignerName}</span>
                    </div>
                    <div className="meta-item">
                        <strong>Due Date:</strong>
                        <span>{formatDate(assignment.dueDate)}</span>
                    </div>
                    <div className="meta-item">
                        <strong>Created:</strong>
                        <span>{formatDate(assignment.createdAt)}</span>
                    </div>
                </div>

                {assignment.description && (
                    <div className="assignment-description">
                        <h3>Description</h3>
                        <p>{assignment.description}</p>
                    </div>
                )}

                {/* Progress Bar */}
                <div className="progress-section">
                    <h3>Progress</h3>
                    <div className="progress-view-only">
                        <div className="progress-bar-container">
                            <div 
                                className="progress-bar-fill"
                                style={{ width: `${assignment.progressPercentage || 0}%` }}
                            />
                        </div>
                        <span className="progress-value-large">{assignment.progressPercentage || 0}%</span>
                        {assignment.manualProgressAllowed ? (
                            <p className="text-muted">Manual progress allowed for legacy tasks</p>
                        ) : (
                            <p className="text-muted">Progress updates are automatic based on activities and final review</p>
                        )}
                    </div>
                </div>
            </Card>

            {/* Activities Section */}
            <Card className="activities-card">
                <div className="section-header">
                    <h3>Activities {assignment.activities ? `(${assignment.activities.length})` : ''}</h3>
                    {(isAssigner || isAssignee) && (
                        <Button variant="outline-primary" size="sm" onClick={openAddActivity}>
                            <FaPlus className="me-1" /> Add Activity
                        </Button>
                    )}
                </div>
                {!assignment.activities || assignment.activities.length === 0 ? (
                    <p className="empty-message">No activities defined.</p>
                ) : (
                    <div className="activity-list">
                        {assignment.activities.map((act) => (
                            <div key={act.id} className={`activity-item ${act.status === 'COMPLETED' ? 'completed' : ''}`}>
                                <div className="activity-main">
                                    <div className="activity-title-row">
                                        <strong>{act.title}</strong>
                                        <Badge variant={act.status === 'COMPLETED' ? 'success' : 'secondary'}>
                                            {act.status === 'COMPLETED' ? 'Completed' : 'Pending'}
                                        </Badge>
                                    </div>
                                    {act.description && <p className="activity-desc">{act.description}</p>}
                                    <div className="activity-meta">
                                        <small>Evidence: {act.evidenceType || 'NONE'}</small>
                                        {act.completedAt && <small> • Completed at: {new Date(act.completedAt).toLocaleString()}</small>}
                                    </div>
                                </div>
                                {act.status !== 'COMPLETED' && isAssignee && (
                                    <div className="activity-actions">
                                        {act.evidenceType === 'FILE' && (
                                            <div className="activity-evidence">
                                                <input type="file" onChange={(e) => handleActivityFileChange(act.id, e.target.files[0])} />
                                                <Button variant="outline-primary" size="sm" onClick={() => uploadActivityEvidenceFile(act.id)}>
                                                    <FaUpload className="me-1" /> Upload Evidence
                                                </Button>
                                            </div>
                                        )}
                                        {act.evidenceType === 'REPORT' && (
                                            <div className="activity-report">
                                                <textarea
                                                    rows="3"
                                                    value={activityReports[act.id] || ''}
                                                    onChange={(e) => setActivityReports(prev => ({ ...prev, [act.id]: e.target.value }))}
                                                    placeholder="Write your short report here..."
                                                />
                                            </div>
                                        )}
                                        <Button variant="primary" size="sm" onClick={() => completeActivity(act)} disabled={act.locked}>
                                            <FaCheck className="me-1" /> Complete Activity
                                        </Button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            {/* Final Report Section */}
            {assignment.activities && assignment.activities.length > 0 && assignment.activities.every(a => a.status === 'COMPLETED') && assignment.status !== 'UNDER_REVIEW' && assignment.status !== 'COMPLETED' && isAssignee && (
                <Card className="final-report-card">
                    <div className="section-header">
                        <h3>Final Report</h3>
                    </div>
                    <div className="final-report-form">
                        <label className="file-upload-btn">
                            <FaUpload /> Attach File (optional)
                            <input type="file" hidden onChange={(e) => setFinalReportFile(e.target.files[0])} />
                        </label>
                        <textarea
                            rows="4"
                            placeholder="Summarize your work, findings, or outcome... (optional if file attached)"
                            value={finalReportText}
                            onChange={(e) => setFinalReportText(e.target.value)}
                        />
                        <Button variant="primary" onClick={submitFinalReport}>
                            <FaPaperPlane className="me-1" /> Submit Final Report
                        </Button>
                    </div>
                </Card>
            )}

            {/* Review Section */}
            {assignment.status === 'UNDER_REVIEW' && isAssigner && (
                <Card className="review-card">
                    <div className="section-header">
                        <h3>Review Decision</h3>
                    </div>
                    <div className="review-actions">
                        <Button variant="success" onClick={approveAssignment}><FaCheck className="me-1" /> Approve</Button>
                        <Button variant="danger" onClick={rejectAssignment}><FaTimes className="me-1" /> Return for Rework</Button>
                    </div>
                </Card>
            )}

            {/* Attachments removed in workflow v2 */}

            {/* Comments Section */}
            <Card className="comments-card">
                <h3><FaComment /> Comments ({comments.length})</h3>
                
                {(isAssignee || isAssigner || hasPermission('ASSIGNMENT_READ')) && (
                    <form onSubmit={handleAddComment} className="comment-form">
                        <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Add a comment..."
                            rows="3"
                            className="comment-textarea"
                            required
                        />
                        <Button type="submit" variant="primary" disabled={!newComment.trim()}>
                            Post Comment
                        </Button>
                    </form>
                )}

                <div className="comments-list">
                    {comments.length === 0 ? (
                        <p className="empty-message">No comments yet</p>
                    ) : (
                        comments.map(comment => (
                            <div key={comment.id} className="comment-item">
                                <div className="comment-header">
                                    <strong>{comment.userName}</strong>
                                    <span className="comment-date">{comment.createdAt}</span>
                                </div>
                                <p className="comment-text">{comment.comment}</p>
                            </div>
                        ))
                    )}
                </div>
            </Card>

            {/* Add Activity Modal */}
            <Modal
                isOpen={showAddActivity}
                title="Add Activity"
                onClose={() => {
                    if (!creatingActivity) {
                        setShowAddActivity(false);
                    }
                }}
            >
                <div className="modal-body">
                    <Input
                        label="Title"
                        value={activityForm.title}
                        onChange={(e) => setActivityForm(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Activity title"
                        required
                    />
                    <div className="mt-3">
                        <label className="form-label">Description</label>
                        <textarea
                            className="form-control"
                            rows="3"
                            value={activityForm.description}
                            onChange={(e) => setActivityForm(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Optional details or instructions"
                        />
                    </div>
                    <div className="d-flex gap-3 mt-3 flex-wrap">
                        <Input
                            label="Order"
                            type="number"
                            min="1"
                            value={activityForm.orderIndex}
                            onChange={(e) => setActivityForm(prev => ({ ...prev, orderIndex: e.target.value }))}
                            helperText="Controls display sequence"
                        />
                        <div className="flex-grow-1">
                            <label className="form-label">Evidence Type</label>
                            <select
                                className="form-select"
                                value={activityForm.evidenceType}
                                onChange={(e) => setActivityForm(prev => ({ ...prev, evidenceType: e.target.value }))}
                            >
                                <option value="FILE">File Upload</option>
                                <option value="REPORT">Written Report</option>
                            </select>
                            <small className="text-muted d-block mt-1">Each activity automatically shares the 70% activity portion equally.</small>
                        </div>
                    </div>
                </div>
                <div className="modal-footer">
                    <Button
                        variant="outline-secondary"
                        onClick={() => setShowAddActivity(false)}
                        disabled={creatingActivity}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        onClick={createActivity}
                        disabled={creatingActivity}
                    >
                        {creatingActivity ? 'Adding…' : 'Add Activity'}
                    </Button>
                </div>
            </Modal>

            {/* Delete Confirmation Dialog */}
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
        </div>
    );
};

export default AssignmentDetailsPage;
