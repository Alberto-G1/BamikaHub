import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
    FaArrowLeft, 
    FaPaperPlane, 
    FaUser, 
    FaCalendarAlt, 
    FaExclamationCircle,
    FaAlignLeft,
    FaFlag,
    FaInfoCircle
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import api from '../../api/api';
import './AssignmentsStyles.css';
import '../reporting/ReportingStyles.css';

const CreateAssignmentPage = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = Boolean(id);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        priority: 'MEDIUM',
        dueDate: '',
        assigneeId: '',
    });

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        fetchUsers();
        if (isEditMode) {
            fetchAssignment();
        }
    }, [id]);

    const fetchUsers = async () => {
        try {
            const response = await api.get('/users');
            setUsers(response.data);
        } catch (error) {
            console.error('Error fetching users:', error);
            toast.error('Failed to load users');
        }
    };

    const fetchAssignment = async () => {
        try {
            const response = await api.get(`/assignments/${id}`);
            const assignment = response.data;
            setFormData({
                title: assignment.title,
                description: assignment.description || '',
                priority: assignment.priority,
                dueDate: assignment.dueDate.substring(0, 16),
                assigneeId: assignment.assigneeId,
            });
        } catch (error) {
            console.error('Error fetching assignment:', error);
            toast.error('Failed to load assignment');
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: null
            }));
        }
    };

    const validate = () => {
        const newErrors = {};

        if (!formData.title.trim()) {
            newErrors.title = 'Title is required';
        }

        if (!formData.assigneeId) {
            newErrors.assigneeId = 'Please select an assignee';
        }

        if (!formData.dueDate) {
            newErrors.dueDate = 'Due date is required';
        } else {
            const dueDate = new Date(formData.dueDate);
            const now = new Date();
            if (dueDate <= now) {
                newErrors.dueDate = 'Due date must be in the future';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validate()) {
            toast.error('Please fix the errors in the form');
            return;
        }

        setLoading(true);

        try {
            const payload = {
                ...formData,
                assigneeId: parseInt(formData.assigneeId)
            };

            if (isEditMode) {
                await api.put(`/assignments/${id}`, payload);
                toast.success('Assignment updated successfully');
            } else {
                await api.post('/assignments', payload);
                toast.success('Assignment created successfully');
            }

            navigate('/assignments/created-by-me');
        } catch (error) {
            console.error('Error saving assignment:', error);
            toast.error(error.response?.data?.message || 'Failed to save assignment');
        } finally {
            setLoading(false);
        }
    };

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
                <p className="reporting-back__title">Assignments • {isEditMode ? 'Edit' : 'Create'}</p>
            </div>

            {/* Form Banner */}
            <div className="reporting-banner reporting-banner--compact" data-animate="fade-up" data-delay="0.04">
                <div className="reporting-banner__content">
                    <div className="reporting-banner__info">
                        <span className="reporting-banner__eyebrow">
                            Assignment Form
                        </span>
                        <h1 className="reporting-banner__title">
                            {isEditMode ? 'Edit Assignment' : 'Create New Assignment'}
                        </h1>
                        <p className="reporting-banner__subtitle">
                            Assign tasks to team members with clear instructions and deadlines
                        </p>
                    </div>
                </div>
            </div>

            {/* Form Card */}
            <div className="reporting-card" data-animate="fade-up" data-delay="0.08">
                <form onSubmit={handleSubmit} className="assignments-form-section">
                    <div className="reporting-card__header">
                        <div>
                            <h2 className="reporting-card__title">Assignment Details</h2>
                            <p className="reporting-card__subtitle">Provide all necessary information for the assignment</p>
                        </div>
                    </div>

                    <div className="reporting-card__content">
                        <div className="assignments-form-grid">
                            {/* Title */}
                            <div className="assignments-form-group assignments-form-group--full">
                                <label className="assignments-form-label" htmlFor="title">
                                    <FaAlignLeft className="assignments-form-label__icon" />
                                    Assignment Title
                                    <span className="assignments-form-label__required">*</span>
                                </label>
                                <input
                                    id="title"
                                    name="title"
                                    type="text"
                                    className={`assignments-input ${errors.title ? 'error' : ''}`}
                                    value={formData.title}
                                    onChange={handleChange}
                                    placeholder="e.g., Complete monthly inventory audit"
                                />
                                {errors.title && (
                                    <span className="assignments-error-message">
                                        <FaExclamationCircle />
                                        {errors.title}
                                    </span>
                                )}
                            </div>

                            {/* Assignee */}
                            <div className="assignments-form-group">
                                <label className="assignments-form-label" htmlFor="assigneeId">
                                    <FaUser className="assignments-form-label__icon" />
                                    Assign To
                                    <span className="assignments-form-label__required">*</span>
                                </label>
                                <select
                                    id="assigneeId"
                                    name="assigneeId"
                                    className={`assignments-select ${errors.assigneeId ? 'error' : ''}`}
                                    value={formData.assigneeId}
                                    onChange={handleChange}
                                >
                                    <option value="">Select a team member</option>
                                    {users.map(user => (
                                        <option key={user.id} value={user.id}>
                                            {user.firstName} {user.lastName} ({user.email})
                                        </option>
                                    ))}
                                </select>
                                {errors.assigneeId && (
                                    <span className="assignments-error-message">
                                        <FaExclamationCircle />
                                        {errors.assigneeId}
                                    </span>
                                )}
                            </div>

                            {/* Priority */}
                            <div className="assignments-form-group">
                                <label className="assignments-form-label" htmlFor="priority">
                                    <FaFlag className="assignments-form-label__icon" />
                                    Priority Level
                                    <span className="assignments-form-label__required">*</span>
                                </label>
                                <select
                                    id="priority"
                                    name="priority"
                                    className="assignments-select"
                                    value={formData.priority}
                                    onChange={handleChange}
                                >
                                    <option value="LOW">🟢 Low - Can be done later</option>
                                    <option value="MEDIUM">🟡 Medium - Normal priority</option>
                                    <option value="HIGH">🟠 High - Important task</option>
                                    <option value="URGENT">🔴 Urgent - Needs immediate attention</option>
                                </select>
                            </div>

                            {/* Due Date */}
                            <div className="assignments-form-group assignments-form-group--full">
                                <label className="assignments-form-label" htmlFor="dueDate">
                                    <FaCalendarAlt className="assignments-form-label__icon" />
                                    Due Date & Time
                                    <span className="assignments-form-label__required">*</span>
                                </label>
                                <input
                                    id="dueDate"
                                    name="dueDate"
                                    type="datetime-local"
                                    className={`assignments-input ${errors.dueDate ? 'error' : ''}`}
                                    value={formData.dueDate}
                                    onChange={handleChange}
                                />
                                {errors.dueDate && (
                                    <span className="assignments-error-message">
                                        <FaExclamationCircle />
                                        {errors.dueDate}
                                    </span>
                                )}
                                <span className="assignments-form-label__hint">
                                    Set a deadline for this assignment to be completed
                                </span>
                            </div>
                        </div>

                        <div className="assignments-form-divider"></div>

                        {/* Description */}
                        <div className="assignments-form-group">
                            <label className="assignments-form-label" htmlFor="description">
                                <FaAlignLeft className="assignments-form-label__icon" />
                                Detailed Instructions
                            </label>
                            <textarea
                                id="description"
                                name="description"
                                className="assignments-textarea"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Provide detailed instructions, context, and any specific requirements for this assignment..."
                                rows="7"
                            />
                            <span className="assignments-form-label__hint">
                                Add comprehensive details to help the assignee understand what needs to be done
                            </span>
                        </div>

                        {/* Info Box */}
                        <div className="assignments-form-info">
                            <FaInfoCircle className="assignments-form-info__icon" />
                            <p className="assignments-form-info__text">
                                After creating the assignment, you can add specific activities with individual evidence requirements (file uploads or reports). 
                                Progress will be automatically calculated based on activity completion.
                            </p>
                        </div>
                    </div>

                    {/* Form Actions */}
                    <div className="assignments-form-actions">
                        <button
                            type="button"
                            className="reporting-btn reporting-btn--secondary"
                            onClick={() => navigate(-1)}
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="reporting-btn reporting-btn--gold"
                            disabled={loading}
                        >
                            <FaPaperPlane /> {loading ? 'Saving...' : isEditMode ? 'Update Assignment' : 'Create Assignment'}
                        </button>
                    </div>
                </form>
            </div>
        </section>
    );
};

export default CreateAssignmentPage;