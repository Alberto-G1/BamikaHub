import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaEye } from 'react-icons/fa';
import api from '../../api/api';
import { toast } from 'react-toastify';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Table from '../../components/common/Table';
import './CreatedAssignmentsPage.css';

const CreatedAssignmentsPage = () => {
    const navigate = useNavigate();
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCreatedAssignments();
    }, []);

    const fetchCreatedAssignments = async () => {
        try {
            setLoading(true);
            const response = await api.get('/assignments/created-by-me');
            setAssignments(response.data);
        } catch (error) {
            console.error('Error fetching assignments:', error);
            toast.error('Failed to load assignments');
        } finally {
            setLoading(false);
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
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    const columns = [
        {
            key: 'title',
            label: 'Title',
            render: (value) => <strong>{value || '—'}</strong>
        },
        {
            key: 'assigneeName',
            label: 'Assigned To',
            render: (value) => value || '—'
        },
        {
            key: 'priority',
            label: 'Priority',
            render: (value) => getPriorityBadge(value)
        },
        {
            key: 'status',
            label: 'Status',
            render: (value, row) => getStatusBadge(value, row.overdue)
        },
        {
            key: 'progressPercentage',
            label: 'Progress',
            render: (value) => {
                const progress = value || 0;
                return (
                    <div className="progress-cell">
                        <div className="progress-bar-mini">
                            <div 
                                className="progress-bar-mini-fill"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <span>{progress}%</span>
                    </div>
                );
            }
        },
        {
            key: 'dueDate',
            label: 'Due Date',
            render: (value) => formatDate(value)
        },
        {
            key: 'id',
            label: 'Actions',
            render: (value, row) => (
                <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={() => {
                        if (row.id) {
                            navigate(`/assignments/${row.id}`);
                        } else {
                            toast.error('Assignment ID is missing');
                        }
                    }}
                    icon={<FaEye />}
                >
                    View
                </Button>
            )
        }
    ];

    return (
        <div className="created-assignments-page">
            {/* Page Header */}
            <div className="page-header-section">
                <div className="page-header-content">
                    <h1 className="page-title">Assignments Created by Me</h1>
                    <p className="page-description">Manage assignments you've delegated to team members</p>
                </div>
                <div className="page-header-actions">
                    <Button 
                        variant="primary" 
                        onClick={() => navigate('/assignments/create')}
                        icon={<FaPlus />}
                    >
                        Create Assignment
                    </Button>
                </div>
            </div>

            {/* Main Content */}
            <div className="page-content">
                <Card>
                    {loading ? (
                        <div className="text-center py-5">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                        </div>
                    ) : (
                        <Table
                            columns={columns}
                            data={assignments}
                            emptyMessage="No assignments created yet"
                        />
                    )}
                </Card>
            </div>
        </div>
    );
};

export default CreatedAssignmentsPage;
