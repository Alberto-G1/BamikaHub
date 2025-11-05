import React, { useState, useEffect } from 'react';
import { FaPlus, FaTicketAlt, FaFileExcel, FaFilePdf, FaSearch, FaFilter, FaChartLine, FaClock, FaCheckCircle, FaHourglassHalf, FaTimes } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import api from '../../api/api.js';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext.jsx';
import './SupportStyles.css';

const initialFilters = {
    status: '',
    priority: '',
    categoryId: '',
    department: '',
    startDate: '',
    endDate: '',
    search: '',
    includeArchived: false
};

const initialNewTicket = {
    subject: '',
    description: '',
    priority: 'MEDIUM',
    categoryId: '',
    otherCategory: '',
    submitterDepartment: ''
};

const sanitizeFilters = (filters) => {
    const cleaned = {};
    Object.entries(filters).forEach(([key, value]) => {
        if (value === undefined || value === null) {
            return;
        }
        if (typeof value === 'string' && value.trim() === '') {
            return;
        }
        if (key === 'includeArchived') {
            if (value) {
                cleaned[key] = true;
            }
            return;
        }
        cleaned[key] = value;
    });
    return cleaned;
};

const areFiltersEqual = (a, b) => JSON.stringify(a) === JSON.stringify(b);

const SupportTicketPage = () => {
    const navigate = useNavigate();
    const { hasPermission } = useAuth();
    const canManageTickets = hasPermission('TICKET_MANAGE');

    const [tickets, setTickets] = useState([]);
    const [categories, setCategories] = useState([]);
    const [analytics, setAnalytics] = useState(null);

    const [filters, setFilters] = useState(initialFilters);
    const [appliedFilters, setAppliedFilters] = useState({});

    const [loadingTickets, setLoadingTickets] = useState(false);
    const [loadingAnalytics, setLoadingAnalytics] = useState(false);
    const [downloadingFormat, setDownloadingFormat] = useState(null);

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [isModalClosing, setIsModalClosing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showOtherCategory, setShowOtherCategory] = useState(false);
    const [newTicket, setNewTicket] = useState({ ...initialNewTicket });

    useEffect(() => {
        const loadReferenceData = async () => {
            try {
                const response = await api.get('/support/tickets/categories');
                setCategories(response.data || []);
            } catch (error) {
                toast.error('Failed to load ticket categories.');
            }
        };
        loadReferenceData();
    }, []);

    useEffect(() => {
        fetchTickets(appliedFilters);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [appliedFilters]);

    useEffect(() => {
        const sanitized = sanitizeFilters(filters);
        const timeout = setTimeout(() => {
            setAppliedFilters((previous) => (areFiltersEqual(previous, sanitized) ? previous : sanitized));
        }, 300);

        return () => clearTimeout(timeout);
    }, [filters]);

    useEffect(() => {
        if (canManageTickets) {
            fetchAnalytics();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [canManageTickets]);

    useEffect(() => {
        if (!isModalClosing) {
            return;
        }
        const timeout = setTimeout(() => {
            setShowCreateModal(false);
            setIsModalClosing(false);
            setShowOtherCategory(false);
            setNewTicket({ ...initialNewTicket });
        }, 320);

        return () => clearTimeout(timeout);
    }, [isModalClosing]);

    const fetchTickets = async (params = {}) => {
        setLoadingTickets(true);
        try {
            const response = await api.get('/support/tickets', { params });
            setTickets(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            toast.error('Failed to load support tickets.');
        } finally {
            setLoadingTickets(false);
        }
    };

    const fetchAnalytics = async () => {
        setLoadingAnalytics(true);
        try {
            const response = await api.get('/support/tickets/analytics/summary');
            setAnalytics(response.data);
        } catch (error) {
            toast.error('Failed to load ticket analytics.');
        } finally {
            setLoadingAnalytics(false);
        }
    };

    const handleFilterChange = (event) => {
        const { name, value, type, checked } = event.target;
        setFilters((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleResetFilters = () => {
        setFilters(initialFilters);
        setAppliedFilters({});
    };

    const handleFormChange = (event) => {
        const { name, value } = event.target;
        setNewTicket((prev) => ({ ...prev, [name]: value }));
    };

    const handleCategoryChange = (event) => {
        const categoryId = event.target.value;
        const selectedCategory = categories.find((category) => category.id.toString() === categoryId);
        setNewTicket((prev) => ({ ...prev, categoryId }));
        setShowOtherCategory(Boolean(selectedCategory && selectedCategory.name === 'OTHER'));
    };

    const openCreateModal = () => {
        setShowCreateModal(true);
        setIsModalClosing(false);
        setShowOtherCategory(false);
        setNewTicket({ ...initialNewTicket });
    };

    const handleCreateTicket = async (event) => {
        event.preventDefault();
        setIsSubmitting(true);
        try {
            const payload = {
                ...newTicket,
                categoryId: newTicket.categoryId ? Number(newTicket.categoryId) : null,
                otherCategory: showOtherCategory ? newTicket.otherCategory : null
            };
            await api.post('/support/tickets', payload);
            toast.success('Support ticket created successfully.');
            handleCloseModal();
            setAppliedFilters((prev) => ({ ...prev }));
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create support ticket.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCloseModal = () => {
        if (!showCreateModal || isModalClosing) {
            return;
        }
        setIsModalClosing(true);
    };

    const handleExport = async (format) => {
        setDownloadingFormat(format);
        try {
            const response = await api.get(`/support/tickets/export/${format}`, {
                params: appliedFilters,
                responseType: 'blob'
            });
            const disposition = response.headers['content-disposition'];
            const suggestedName = disposition ? disposition.split('filename=')[1]?.replace(/"/g, '') : `tickets.${format === 'excel' ? 'xlsx' : 'pdf'}`;
            const blob = new Blob([response.data], { type: response.headers['content-type'] });
            const url = window.URL.createObjectURL(blob);
            const tempLink = document.createElement('a');
            tempLink.href = url;
            tempLink.setAttribute('download', suggestedName || `tickets.${format}`);
            document.body.appendChild(tempLink);
            tempLink.click();
            tempLink.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            toast.error('Failed to export tickets.');
        } finally {
            setDownloadingFormat(null);
        }
    };

    const statusCounts = analytics?.ticketsByStatus || {};

    return (
        <section className="support-page">
            {/* Hero Banner */}
            <div className="support-banner" data-animate="fade-up">
                <div className="support-banner__content">
                    <div className="support-banner__info">
                        <span className="support-banner__eyebrow">
                            <FaTicketAlt />
                            Support System
                        </span>
                        <h1 className="support-banner__title">Technical Support Tickets</h1>
                        <p className="support-banner__subtitle">
                            Track requests, monitor SLAs, and export reports. Real-time ticket management and analytics.
                        </p>
                    </div>
                    <div className="support-banner__actions">
                        {canManageTickets && (
                            <>
                                <button
                                    className="support-btn support-btn--green"
                                    disabled={downloadingFormat === 'excel'}
                                    onClick={() => handleExport('excel')}
                                >
                                    <FaFileExcel />
                                    {downloadingFormat === 'excel' ? 'Exporting…' : 'Export Excel'}
                                </button>
                                <button
                                    className="support-btn support-btn--red"
                                    disabled={downloadingFormat === 'pdf'}
                                    onClick={() => handleExport('pdf')}
                                >
                                    <FaFilePdf />
                                    {downloadingFormat === 'pdf' ? 'Exporting…' : 'Export PDF'}
                                </button>
                            </>
                        )}
                        <button className="support-btn support-btn--gold" onClick={openCreateModal}>
                            <FaPlus /> Create Ticket
                        </button>
                    </div>
                </div>

                {/* Status Stats */}
                <div className="support-banner__meta">
                    <div className="support-banner__meta-item">
                        <div className="support-banner__meta-icon support-banner__meta-icon--blue">
                            <FaHourglassHalf />
                        </div>
                        <div className="support-banner__meta-content">
                            <span className="support-banner__meta-label">Open</span>
                            <span className="support-banner__meta-value">{statusCounts.OPEN || 0}</span>
                        </div>
                    </div>
                    <div className="support-banner__meta-item">
                        <div className="support-banner__meta-icon support-banner__meta-icon--gold">
                            <FaClock />
                        </div>
                        <div className="support-banner__meta-content">
                            <span className="support-banner__meta-label">In Progress</span>
                            <span className="support-banner__meta-value">{statusCounts.IN_PROGRESS || 0}</span>
                        </div>
                    </div>
                    <div className="support-banner__meta-item">
                        <div className="support-banner__meta-icon support-banner__meta-icon--green">
                            <FaCheckCircle />
                        </div>
                        <div className="support-banner__meta-content">
                            <span className="support-banner__meta-label">Resolved</span>
                            <span className="support-banner__meta-value">{statusCounts.RESOLVED || 0}</span>
                        </div>
                    </div>
                    <div className="support-banner__meta-item">
                        <div className="support-banner__meta-icon support-banner__meta-icon--purple">
                            <FaTimes />
                        </div>
                        <div className="support-banner__meta-content">
                            <span className="support-banner__meta-label">Closed</span>
                            <span className="support-banner__meta-value">{statusCounts.CLOSED || 0}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Support Analytics */}
            {canManageTickets && (
                <div className="support-analytics" data-animate="fade-up" data-delay="0.08">
                    <div className="support-analytics__header">
                        <div className="support-analytics__icon">
                            <FaChartLine />
                        </div>
                        <h2 className="support-analytics__title">Support Analytics</h2>
                    </div>
                    {loadingAnalytics ? (
                        <div className="support-loading">
                            <div className="support-spinner"></div>
                        </div>
                    ) : analytics ? (
                        <div className="support-analytics__grid">
                            <div className="support-analytics__card support-analytics__card--primary">
                                <div className="support-analytics__card-label">Open Tickets</div>
                                <div className="support-analytics__card-value">{statusCounts.OPEN || 0}</div>
                            </div>
                            <div className="support-analytics__card support-analytics__card--warning">
                                <div className="support-analytics__card-label">In Progress</div>
                                <div className="support-analytics__card-value">{statusCounts.IN_PROGRESS || 0}</div>
                            </div>
                            <div className="support-analytics__card support-analytics__card--success">
                                <div className="support-analytics__card-label">Resolved</div>
                                <div className="support-analytics__card-value">{statusCounts.RESOLVED || 0}</div>
                            </div>
                            <div className="support-analytics__card support-analytics__card--info">
                                <div className="support-analytics__card-label">Closed</div>
                                <div className="support-analytics__card-value">{statusCounts.CLOSED || 0}</div>
                            </div>
                            <div className="support-analytics__card support-analytics__card--primary">
                                <div className="support-analytics__card-label">Avg Resolution</div>
                                <div className="support-analytics__card-value">
                                    {analytics.averageResolutionHours?.toFixed(1) || 0}
                                    <span className="support-analytics__card-unit">hrs</span>
                                </div>
                            </div>
                            <div className="support-analytics__card support-analytics__card--success">
                                <div className="support-analytics__card-label">Avg Response</div>
                                <div className="support-analytics__card-value">
                                    {analytics.averageResponseHours?.toFixed(1) || 0}
                                    <span className="support-analytics__card-unit">hrs</span>
                                </div>
                            </div>
                            <div className="support-analytics__card support-analytics__card--warning">
                                <div className="support-analytics__card-label">SLA Compliance</div>
                                <div className="support-analytics__card-value">
                                    {analytics.slaCompliancePercentage?.toFixed(0) || 0}
                                    <span className="support-analytics__card-unit">%</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="support-empty-state">No analytics available.</div>
                    )}
                </div>
            )}

            {/* Filters */}
            <div className="support-filters" data-animate="fade-up" data-delay="0.12">
                <div className="support-filters__header">
                    <div className="support-filters__icon">
                        <FaFilter />
                    </div>
                    <h2 className="support-filters__title">Filters</h2>
                </div>
                <div className="support-filters__grid">
                    <div className="support-filters__group">
                        <label htmlFor="filterStatus" className="support-filters__label">Status</label>
                        <select
                            id="filterStatus"
                            name="status"
                            value={filters.status}
                            onChange={handleFilterChange}
                            className="support-filters__select"
                        >
                            <option value="">All statuses</option>
                            <option value="OPEN">Open</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="RESOLVED">Resolved</option>
                            <option value="CLOSED">Closed</option>
                        </select>
                    </div>
                    <div className="support-filters__group">
                        <label htmlFor="filterPriority" className="support-filters__label">Priority</label>
                        <select
                            id="filterPriority"
                            name="priority"
                            value={filters.priority}
                            onChange={handleFilterChange}
                            className="support-filters__select"
                        >
                            <option value="">All priorities</option>
                            <option value="LOW">Low</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="HIGH">High</option>
                            <option value="URGENT">Urgent</option>
                        </select>
                    </div>
                    <div className="support-filters__group">
                        <label htmlFor="filterCategory" className="support-filters__label">Category</label>
                        <select
                            id="filterCategory"
                            name="categoryId"
                            value={filters.categoryId}
                            onChange={handleFilterChange}
                            className="support-filters__select"
                        >
                            <option value="">All categories</option>
                            {categories.map((category) => (
                                <option key={category.id} value={category.id}>{category.name.replace(/_/g, ' ')}</option>
                            ))}
                        </select>
                    </div>
                    <div className="support-filters__group">
                        <label htmlFor="filterDepartment" className="support-filters__label">Department</label>
                        <input
                            type="text"
                            id="filterDepartment"
                            name="department"
                            value={filters.department}
                            onChange={handleFilterChange}
                            placeholder="e.g., Finance"
                            className="support-filters__input"
                        />
                    </div>
                    <div className="support-filters__group">
                        <label htmlFor="filterStartDate" className="support-filters__label">Start Date</label>
                        <input
                            type="date"
                            id="filterStartDate"
                            name="startDate"
                            value={filters.startDate}
                            onChange={handleFilterChange}
                            className="support-filters__input"
                        />
                    </div>
                    <div className="support-filters__group">
                        <label htmlFor="filterEndDate" className="support-filters__label">End Date</label>
                        <input
                            type="date"
                            id="filterEndDate"
                            name="endDate"
                            value={filters.endDate}
                            onChange={handleFilterChange}
                            className="support-filters__input"
                        />
                    </div>
                    <div className="support-filters__group">
                        <label htmlFor="filterSearch" className="support-filters__label">
                            <FaSearch /> Search
                        </label>
                        <input
                            type="search"
                            id="filterSearch"
                            name="search"
                            value={filters.search}
                            onChange={handleFilterChange}
                            placeholder="Search by subject, ticket number, or description"
                            className="support-filters__input"
                        />
                    </div>
                    <div className="support-filters__group">
                        <label className="support-filters__label">Options</label>
                        <div className="support-filters__checkbox">
                            <input
                                type="checkbox"
                                id="filterIncludeArchived"
                                name="includeArchived"
                                checked={filters.includeArchived}
                                onChange={handleFilterChange}
                            />
                            <label htmlFor="filterIncludeArchived">Include archived</label>
                        </div>
                    </div>
                </div>
                <div className="support-filters__actions">
                    <button type="button" className="support-btn support-btn--secondary" onClick={handleResetFilters}>
                        Reset Filters
                    </button>
                </div>
            </div>

            {/* Tickets Table */}
            <div className="support-table-container" data-animate="fade-up" data-delay="0.16">
                {loadingTickets ? (
                    <div className="support-loading">
                        <div className="support-spinner"></div>
                        <p>Loading tickets...</p>
                    </div>
                ) : (
                    <div className="support-table-wrapper">
                        <table className="support-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Subject</th>
                                    <th>Category</th>
                                    <th>Submitted By</th>
                                    <th>Priority</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tickets.length === 0 ? (
                                    <tr>
                                        <td colSpan={6}>
                                            <div className="support-empty-state">
                                                No tickets match the selected filters.
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    tickets.map((ticket) => (
                                        <tr key={ticket.id}>
                                            <td>TICKET-{String(ticket.id).padStart(4, '0')}</td>
                                            <td>{ticket.subject}</td>
                                            <td>{ticket.categoryName === 'OTHER' ? ticket.otherCategory : ticket.categoryName?.replace(/_/g, ' ') || '—'}</td>
                                            <td>{ticket.submittedByName || '—'}</td>
                                            <td>
                                                <span className={`support-badge ${['HIGH', 'URGENT'].includes(ticket.priority) ? 'support-badge--danger' : 'support-badge--info'}`}>
                                                    {ticket.priority}
                                                </span>
                                            </td>
                                            <td>
                                                <button 
                                                    className="support-btn support-btn--blue support-btn--sm"
                                                    onClick={() => navigate(`/support/tickets/${ticket.id}`)}
                                                >
                                                    View
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Create Ticket Modal */}
            {showCreateModal && (
                <div
                    className={`support-modal ${isModalClosing ? 'support-modal--closing' : ''}`}
                    onClick={handleCloseModal}
                >
                    <div
                        className={`support-modal__dialog ${isModalClosing ? 'support-modal__dialog--closing' : ''}`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="support-modal__header">
                            <h2 className="support-modal__title">Create Support Ticket</h2>
                            <button className="support-modal__close" onClick={handleCloseModal}>
                                <FaTimes size={18} />
                            </button>
                        </div>
                        <form onSubmit={handleCreateTicket}>
                            <div className="support-modal__body">
                                <div className="support-form">
                                    <div className="support-form-group">
                                        <label htmlFor="newTicketCategory">Category</label>
                                        <select
                                            id="newTicketCategory"
                                            name="categoryId"
                                            value={newTicket.categoryId}
                                            onChange={handleCategoryChange}
                                            required
                                            className="support-select"
                                        >
                                            <option value="">Select a category</option>
                                            {categories.map((category) => (
                                                <option key={category.id} value={category.id}>
                                                    {category.name.replace(/_/g, ' ')}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="support-form-group">
                                        <label htmlFor="newTicketPriority">Priority</label>
                                        <select
                                            id="newTicketPriority"
                                            name="priority"
                                            value={newTicket.priority}
                                            onChange={handleFormChange}
                                            className="support-select"
                                        >
                                            <option value="LOW">Low</option>
                                            <option value="MEDIUM">Medium</option>
                                            <option value="HIGH">High</option>
                                            <option value="URGENT">Urgent</option>
                                        </select>
                                    </div>
                                    {showOtherCategory && (
                                        <div className="support-form-group">
                                            <label htmlFor="newTicketOtherCategory">Specify Category</label>
                                            <input
                                                type="text"
                                                id="newTicketOtherCategory"
                                                name="otherCategory"
                                                value={newTicket.otherCategory}
                                                onChange={handleFormChange}
                                                required
                                                placeholder="e.g., Printer Issue, Site Access Request"
                                                className="support-input"
                                            />
                                        </div>
                                    )}
                                    <div className="support-form-group">
                                        <label htmlFor="newTicketSubject">Subject</label>
                                        <input
                                            type="text"
                                            id="newTicketSubject"
                                            name="subject"
                                            value={newTicket.subject}
                                            onChange={handleFormChange}
                                            required
                                            placeholder="Brief summary of the request"
                                            className="support-input"
                                        />
                                    </div>
                                    <div className="support-form-group">
                                        <label htmlFor="newTicketDepartment">Department</label>
                                        <input
                                            type="text"
                                            id="newTicketDepartment"
                                            name="submitterDepartment"
                                            value={newTicket.submitterDepartment}
                                            onChange={handleFormChange}
                                            placeholder="Department requesting support"
                                            className="support-input"
                                        />
                                    </div>
                                    <div className="support-form-group">
                                        <label htmlFor="newTicketDescription">Description</label>
                                        <textarea
                                            id="newTicketDescription"
                                            name="description"
                                            value={newTicket.description}
                                            onChange={handleFormChange}
                                            required
                                            placeholder="Provide detailed information about the issue"
                                            className="support-textarea"
                                            rows={5}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="support-modal__footer">
                                <button
                                    type="button"
                                    className="support-btn support-btn--secondary"
                                    onClick={handleCloseModal}
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="support-btn support-btn--gold"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Submitting…' : 'Submit Ticket'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </section>
    );
};

export default SupportTicketPage;