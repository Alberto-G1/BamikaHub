import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaFilter, FaSearch, FaCheckCircle, FaClock, FaExclamationTriangle } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/api';
import { toast } from 'react-toastify';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Badge from '../../components/common/Badge';
import './MyAssignmentsPage.css';

const MyAssignmentsPage = () => {
    const navigate = useNavigate();
    const { hasPermission } = useAuth();
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, pending, in_progress, completed, overdue
    const [searchTerm, setSearchTerm] = useState('');
    const [statistics, setStatistics] = useState(null);

    useEffect(() => {
        fetchMyAssignments();
        fetchStatistics();
    }, []);

    const fetchMyAssignments = async () => {
        try {
            setLoading(true);
            const response = await api.get('/assignments/my-assignments');
            setAssignments(response.data);
        } catch (error) {
            console.error('Error fetching assignments:', error);
            toast.error('Failed to load assignments');
        } finally {
            setLoading(false);
        }
    };

    const fetchStatistics = async () => {
        try {
            const response = await api.get('/assignments/statistics');
            setStatistics(response.data);
        } catch (error) {
            console.error('Error fetching statistics:', error);
        }
    };

    const handleProgressUpdate = async (assignmentId, newProgress) => {
        try {
            await api.patch(`/assignments/${assignmentId}/progress?progress=${newProgress}`);
            toast.success('Progress updated successfully');
            fetchMyAssignments();
            fetchStatistics();
        } catch (error) {
            console.error('Error updating progress:', error);
            toast.error('Failed to update progress');
        }
    };

    const filteredAssignments = assignments.filter(assignment => {
        // Filter by status
        let statusMatch = true;
        if (filter === 'pending') statusMatch = assignment.status === 'PENDING';
        else if (filter === 'in_progress') statusMatch = assignment.status === 'IN_PROGRESS';
        else if (filter === 'completed') statusMatch = assignment.status === 'COMPLETED';
        else if (filter === 'overdue') statusMatch = assignment.overdue;

        // Filter by search term
        const searchMatch = assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           assignment.description?.toLowerCase().includes(searchTerm.toLowerCase());

        return statusMatch && searchMatch;
    });

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

    const getDaysRemainingDisplay = (assignment) => {
        if (assignment.status === 'COMPLETED') return 'Completed';
        if (assignment.overdue) return <span className="text-danger">Overdue</span>;
        
        const days = assignment.daysRemaining;
        if (days < 0) return <span className="text-danger">Overdue</span>;
        if (days === 0) return <span className="text-warning">Due Today</span>;
        if (days === 1) return <span className="text-warning">1 day left</span>;
        return `${days} days left`;
    };

    if (loading) {
        return (
            <div className="my-assignments-page">
                <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="my-assignments-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">My Assignments</h1>
                    <p className="page-subtitle">Track and manage your assigned tasks</p>
                </div>
                {hasPermission('ASSIGNMENT_CREATE') && (
                    <Button 
                        variant="primary" 
                        onClick={() => navigate('/assignments/create')}
                        icon={<FaPlus />}
                    >
                        Create Assignment
                    </Button>
                )}
            </div>

            {/* Statistics Cards */}
            {statistics && (
                <div className="statistics-grid">
                    <Card className="stat-card">
                        <div className="stat-icon total">
                            <FaCheckCircle />
                        </div>
                        <div className="stat-content">
                            <h3>{statistics.totalAssignments}</h3>
                            <p>Total Assignments</p>
                        </div>
                    </Card>
                    <Card className="stat-card">
                        <div className="stat-icon pending">
                            <FaClock />
                        </div>
                        <div className="stat-content">
                            <h3>{statistics.pendingAssignments}</h3>
                            <p>Pending</p>
                        </div>
                    </Card>
                    <Card className="stat-card">
                        <div className="stat-icon in-progress">
                            <FaClock />
                        </div>
                        <div className="stat-content">
                            <h3>{statistics.inProgressAssignments}</h3>
                            <p>In Progress</p>
                        </div>
                    </Card>
                    <Card className="stat-card">
                        <div className="stat-icon completed">
                            <FaCheckCircle />
                        </div>
                        <div className="stat-content">
                            <h3>{statistics.completedAssignments}</h3>
                            <p>Completed</p>
                        </div>
                    </Card>
                    <Card className="stat-card">
                        <div className="stat-icon overdue">
                            <FaExclamationTriangle />
                        </div>
                        <div className="stat-content">
                            <h3>{statistics.overdueAssignments}</h3>
                            <p>Overdue</p>
                        </div>
                    </Card>
                </div>
            )}

            {/* Filters and Search */}
            <Card className="filters-card">
                <div className="filters-container">
                    <div className="filter-buttons">
                        <Button 
                            variant={filter === 'all' ? 'primary' : 'outline-secondary'}
                            onClick={() => setFilter('all')}
                        >
                            All
                        </Button>
                        <Button 
                            variant={filter === 'pending' ? 'primary' : 'outline-secondary'}
                            onClick={() => setFilter('pending')}
                        >
                            Pending
                        </Button>
                        <Button 
                            variant={filter === 'in_progress' ? 'primary' : 'outline-secondary'}
                            onClick={() => setFilter('in_progress')}
                        >
                            In Progress
                        </Button>
                        <Button 
                            variant={filter === 'completed' ? 'primary' : 'outline-secondary'}
                            onClick={() => setFilter('completed')}
                        >
                            Completed
                        </Button>
                        <Button 
                            variant={filter === 'overdue' ? 'danger' : 'outline-danger'}
                            onClick={() => setFilter('overdue')}
                        >
                            Overdue
                        </Button>
                    </div>
                    <div className="search-box">
                        <FaSearch className="search-icon" />
                        <Input
                            type="text"
                            placeholder="Search assignments..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </Card>

            {/* Assignments List */}
            <div className="assignments-list">
                {filteredAssignments.length === 0 ? (
                    <Card>
                        <div className="empty-state">
                            <p>No assignments found</p>
                        </div>
                    </Card>
                ) : (
                    filteredAssignments.map(assignment => (
                        <Card 
                            key={assignment.id} 
                            className={`assignment-card ${assignment.overdue ? 'overdue' : ''}`}
                            onClick={() => {
                                if (assignment.id) {
                                    navigate(`/assignments/${assignment.id}`);
                                } else {
                                    toast.error('Assignment ID is missing');
                                }
                            }}
                        >
                            <div className="assignment-header">
                                <h3 className="assignment-title">{assignment.title || 'Untitled Assignment'}</h3>
                                <div className="assignment-badges">
                                    {getPriorityBadge(assignment.priority)}
                                    {getStatusBadge(assignment.status, assignment.overdue)}
                                </div>
                            </div>
                            
                            {assignment.description && (
                                <p className="assignment-description">{assignment.description}</p>
                            )}
                            
                            <div className="assignment-meta">
                                <div className="meta-item">
                                    <strong>Assigned by:</strong> {assignment.assignerName || '—'}
                                </div>
                                <div className="meta-item">
                                    <strong>Due:</strong> {formatDate(assignment.dueDate)}
                                </div>
                                <div className="meta-item">
                                    <strong>Time remaining:</strong> {getDaysRemainingDisplay(assignment)}
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="progress-section">
                                <div className="progress-header">
                                    <span>Progress</span>
                                    <span className="progress-percentage">{assignment.progressPercentage || 0}%</span>
                                </div>
                                <div className="progress-bar-container">
                                    <div 
                                        className="progress-bar-fill"
                                        style={{ width: `${assignment.progressPercentage || 0}%` }}
                                    />
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
};

export default MyAssignmentsPage;
