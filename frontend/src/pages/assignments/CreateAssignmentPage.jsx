import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../api/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import './CreateAssignmentPage.css';

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
                dueDate: assignment.dueDate.substring(0, 16), // Format for datetime-local input
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
        // Clear error for this field
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
        <div className="create-assignment-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">{isEditMode ? 'Edit Assignment' : 'Create New Assignment'}</h1>
                    <p className="page-subtitle">Assign tasks to team members with clear instructions and deadlines</p>
                </div>
            </div>

            <Card className="assignment-form-card">
                <form onSubmit={handleSubmit}>
                    <div className="form-grid">
                        {/* Title */}
                        <div className="form-group">
                            <label htmlFor="title">
                                Title <span className="required">*</span>
                            </label>
                            <Input
                                id="title"
                                name="title"
                                type="text"
                                value={formData.title}
                                onChange={handleChange}
                                placeholder="Enter assignment title"
                                error={errors.title}
                            />
                            {errors.title && <span className="error-text">{errors.title}</span>}
                        </div>

                        {/* Assignee */}
                        <div className="form-group">
                            <label htmlFor="assigneeId">
                                Assign To <span className="required">*</span>
                            </label>
                            <select
                                id="assigneeId"
                                name="assigneeId"
                                value={formData.assigneeId}
                                onChange={handleChange}
                                className={`form-select ${errors.assigneeId ? 'error' : ''}`}
                            >
                                <option value="">Select a user</option>
                                {users.map(user => (
                                    <option key={user.id} value={user.id}>
                                        {user.firstName} {user.lastName} - {user.email}
                                    </option>
                                ))}
                            </select>
                            {errors.assigneeId && <span className="error-text">{errors.assigneeId}</span>}
                        </div>

                        {/* Priority */}
                        <div className="form-group">
                            <label htmlFor="priority">
                                Priority <span className="required">*</span>
                            </label>
                            <select
                                id="priority"
                                name="priority"
                                value={formData.priority}
                                onChange={handleChange}
                                className="form-select"
                            >
                                <option value="LOW">Low</option>
                                <option value="MEDIUM">Medium</option>
                                <option value="HIGH">High</option>
                                <option value="URGENT">Urgent</option>
                            </select>
                        </div>

                        {/* Due Date */}
                        <div className="form-group">
                            <label htmlFor="dueDate">
                                Due Date <span className="required">*</span>
                            </label>
                            <Input
                                id="dueDate"
                                name="dueDate"
                                type="datetime-local"
                                value={formData.dueDate}
                                onChange={handleChange}
                                error={errors.dueDate}
                            />
                            {errors.dueDate && <span className="error-text">{errors.dueDate}</span>}
                        </div>

                        {/* Description */}
                        <div className="form-group full-width">
                            <label htmlFor="description">Description</label>
                            <textarea
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Provide detailed instructions for this assignment..."
                                rows="6"
                                className="form-textarea"
                            />
                        </div>
                    </div>

                    {/* Form Actions */}
                    <div className="form-actions">
                        <Button
                            type="button"
                            variant="outline-secondary"
                            onClick={() => navigate(-1)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            disabled={loading}
                        >
                            {loading ? 'Saving...' : isEditMode ? 'Update Assignment' : 'Create Assignment'}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default CreateAssignmentPage;
