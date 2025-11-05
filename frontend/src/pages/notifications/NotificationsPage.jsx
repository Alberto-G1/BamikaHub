import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
	FaBell,
	FaCheckDouble,
	FaFilter,
	FaExternalLinkAlt,
	FaTrashAlt,
	FaSync,
	FaInbox,
	FaChevronLeft,
	FaChevronRight,
	FaExclamationTriangle,
	FaClock
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import api from '../../api/api.js';
import { toast } from 'react-toastify';
import './NotificationsStyles.css';

const typeOptions = [
	{ value: '', label: 'All Types' },
	{ value: 'REQUISITION_APPROVED', label: 'Requisition Approved' },
	{ value: 'REQUISITION_REJECTED', label: 'Requisition Rejected' },
	{ value: 'REQUISITION_CREATED', label: 'Requisition Created' },
	{ value: 'TICKET_ASSIGNED', label: 'Ticket Assigned' },
	{ value: 'TICKET_RESOLVED', label: 'Ticket Resolved' },
	{ value: 'TICKET_CLOSED', label: 'Ticket Closed' },
	{ value: 'PROJECT_UPDATED', label: 'Project Updated' },
	{ value: 'PROJECT_COMPLETED', label: 'Project Completed' },
	{ value: 'PROJECT_ASSIGNED', label: 'Project Assigned' },
	{ value: 'USER_APPROVED', label: 'User Approved' },
	{ value: 'USER_DEACTIVATED', label: 'User Deactivated' },
	{ value: 'STOCK_LOW', label: 'Stock Low' },
	{ value: 'STOCK_CRITICAL', label: 'Stock Critical' },
	{ value: 'REPORT_READY', label: 'Report Ready' },
	{ value: 'SYSTEM_ALERT', label: 'System Alert' },
	{ value: 'FIELD_REPORT_SUBMITTED', label: 'Field Report Submitted' }
];

const priorityOptions = [
	{ value: '', label: 'All Priorities' },
	{ value: 'LOW', label: 'Low' },
	{ value: 'NORMAL', label: 'Normal' },
	{ value: 'HIGH', label: 'High' },
	{ value: 'URGENT', label: 'Urgent' }
];

const readOptions = [
	{ value: '', label: 'All Statuses' },
	{ value: 'false', label: 'Unread' },
	{ value: 'true', label: 'Read' }
];

const getNotificationIcon = (type) => {
	const icons = {
		REQUISITION_APPROVED: '✅',
		REQUISITION_REJECTED: '❌',
		REQUISITION_CREATED: '📝',
		TICKET_ASSIGNED: '🎫',
		TICKET_RESOLVED: '✔️',
		TICKET_CLOSED: '🔒',
		PROJECT_UPDATED: '📊',
		PROJECT_COMPLETED: '🎉',
		PROJECT_ASSIGNED: '👷',
		USER_APPROVED: '👤',
		USER_DEACTIVATED: '🔒',
		STOCK_LOW: '⚠️',
		STOCK_CRITICAL: '🚨',
		REPORT_READY: '📄',
		SYSTEM_ALERT: '🔔',
		FIELD_REPORT_SUBMITTED: '📋'
	};
	return icons[type] || '📬';
};

const toTitleCase = (value = '') =>
	value
		.toString()
		.replace(/_/g, ' ')
		.toLowerCase()
		.replace(/\b\w/g, (char) => char.toUpperCase());

const formatDate = (timestamp) => {
	if (!timestamp) {
		return '—';
	}
	const date = new Date(timestamp);
	if (Number.isNaN(date.getTime())) {
		return '—';
	}
	return date.toLocaleString();
};

const NotificationsPage = () => {
	const [notifications, setNotifications] = useState([]);
	const [loading, setLoading] = useState(false);
	const [filters, setFilters] = useState({
		type: '',
		priority: '',
		isRead: ''
	});
	const [pagination, setPagination] = useState({
		page: 0,
		size: 20,
		totalPages: 0,
		totalElements: 0
	});
	const [lastRefreshed, setLastRefreshed] = useState(new Date());
	const navigate = useNavigate();

	const fetchNotifications = useCallback(async () => {
		setLoading(true);
		try {
			const params = {
				page: pagination.page,
				size: pagination.size,
				...Object.fromEntries(
					Object.entries(filters).filter(([_, value]) => value !== '')
				)
			};

			const response = await api.get('/notifications', { params });
			const payload = response.data;

			if (Array.isArray(payload?.content)) {
				setNotifications(payload.content);
				setPagination((prev) => ({
					...prev,
					totalPages: payload.totalPages ?? prev.totalPages,
					totalElements: payload.totalElements ?? payload.content.length,
					size: payload.size ?? prev.size
				}));
			} else if (Array.isArray(payload)) {
				setNotifications(payload);
				setPagination((prev) => ({
					...prev,
					totalPages: payload.length > 0 ? 1 : 0,
					totalElements: payload.length
				}));
			} else {
				setNotifications([]);
				setPagination((prev) => ({
					...prev,
					totalPages: 0,
					totalElements: 0
				}));
			}

			setLastRefreshed(new Date());
		} catch (error) {
			console.error('Failed to fetch notifications', error);
			toast.error('Failed to fetch notifications');
		} finally {
			setLoading(false);
		}
	}, [filters, pagination.page, pagination.size]);

	useEffect(() => {
		fetchNotifications();
	}, [fetchNotifications]);

	const hasNotifications = notifications.length > 0;
	const allRead = hasNotifications && notifications.every((notification) => notification.isRead);
	const totalCount = pagination.totalElements || notifications.length;

	const metrics = useMemo(() => {
		const unreadCount = notifications.filter((notification) => !notification.isRead).length;
		const urgentCount = notifications.filter(
			(notification) => (notification.priority ?? '').toUpperCase() === 'URGENT'
		).length;

		return [
			{
				label: 'Total Notifications',
				value: totalCount,
				icon: FaBell,
				modifier: 'notifications-banner__meta-icon--primary'
			},
			{
				label: 'Unread',
				value: unreadCount,
				icon: FaInbox,
				modifier: 'notifications-banner__meta-icon--accent'
			},
			{
				label: 'Urgent',
				value: urgentCount,
				icon: FaExclamationTriangle,
				modifier: 'notifications-banner__meta-icon--danger'
			},
			{
				label: 'Last Synced',
				value: lastRefreshed.toLocaleString(),
				icon: FaClock,
				modifier: 'notifications-banner__meta-icon--muted'
			}
		];
	}, [notifications, totalCount, lastRefreshed]);

	const handleFilterChange = (event) => {
		const { name, value } = event.target;
		setFilters((prev) => ({
			...prev,
			[name]: value
		}));
		setPagination((prev) => ({
			...prev,
			page: 0
		}));
	};

	const handlePageChange = (targetPage) => {
		setPagination((prev) => {
			const maxPage = Math.max((prev.totalPages || 0) - 1, 0);
			const nextPage = Math.max(0, Math.min(targetPage, maxPage));
			if (nextPage === prev.page) {
				return prev;
			}
			return {
				...prev,
				page: nextPage
			};
		});
	};

	const handleRefresh = () => {
		fetchNotifications();
	};

	const markNotificationAsRead = async (id, { showToast = false } = {}) => {
		try {
			await api.put(`/notifications/${id}/read`);
			setNotifications((prev) =>
				prev.map((notification) =>
					notification.id === id ? { ...notification, isRead: true } : notification
				)
			);
			if (showToast) {
				toast.success('Notification marked as read');
			}
		} catch (error) {
			toast.error('Failed to mark as read');
		}
	};

	const markAllAsRead = async () => {
		try {
			await api.put('/notifications/mark-all-read');
			setNotifications((prev) => prev.map((notification) => ({ ...notification, isRead: true })));
			toast.success('All notifications marked as read');
			fetchNotifications();
		} catch (error) {
			toast.error('Failed to mark all as read');
		}
	};

	const handleNotificationClick = (notification) => {
		if (!notification.isRead) {
			markNotificationAsRead(notification.id);
		}
		if (notification.link) {
			navigate(notification.link);
		}
	};

	const handleRowKeyDown = (event, notification) => {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			handleNotificationClick(notification);
		}
	};

	const handleMarkAsRead = async (event, notification) => {
		event.stopPropagation();
		if (!notification.isRead) {
			await markNotificationAsRead(notification.id, { showToast: true });
		}
	};

	const handleDeleteNotification = async (event, notification) => {
		event.stopPropagation();
		const confirmed = window.confirm('Delete this notification?');
		if (!confirmed) {
			return;
		}
		try {
			await api.delete(`/notifications/${notification.id}`);
			setNotifications((prev) => prev.filter((item) => item.id !== notification.id));
			toast.success('Notification deleted');
			fetchNotifications();
		} catch (error) {
			toast.error('Failed to delete notification');
		}
	};

	const renderPriorityBadge = (priority) => {
		const normalized = (priority ?? 'NORMAL').toUpperCase();
		const className = `notifications-badge notifications-badge--priority-${normalized.toLowerCase()}`;
		return <span className={className}>{toTitleCase(normalized)}</span>;
	};

	const renderTypeBadge = (type) => (
		<span className="notifications-badge notifications-badge--type">{toTitleCase(type || 'General')}</span>
	);

	const renderPagination = () => {
		const totalPages = pagination.totalPages || (hasNotifications ? 1 : 0);
		if (totalPages <= 1) {
			return null;
		}

		const pages = [];
		for (let index = 0; index < totalPages; index += 1) {
			pages.push(
				<button
					key={index}
					type="button"
					className={`notifications-pagination__button${index === pagination.page ? ' is-active' : ''}`}
					onClick={() => handlePageChange(index)}
				>
					{index + 1}
				</button>
			);
		}

		return (
			<div className="notifications-pagination" role="navigation" aria-label="Notifications pagination">
				<button
					type="button"
					className="notifications-pagination__button"
					onClick={() => handlePageChange(0)}
					disabled={pagination.page === 0}
				>
					<span aria-hidden="true">«</span>
					<span className="sr-only">First page</span>
				</button>
				<button
					type="button"
					className="notifications-pagination__button"
					onClick={() => handlePageChange(pagination.page - 1)}
					disabled={pagination.page === 0}
				>
					<FaChevronLeft aria-hidden="true" />
					<span className="sr-only">Previous page</span>
				</button>
				{pages}
				<button
					type="button"
					className="notifications-pagination__button"
					onClick={() => handlePageChange(pagination.page + 1)}
					disabled={pagination.page >= totalPages - 1}
				>
					<FaChevronRight aria-hidden="true" />
					<span className="sr-only">Next page</span>
				</button>
				<button
					type="button"
					className="notifications-pagination__button"
					onClick={() => handlePageChange(totalPages - 1)}
					disabled={pagination.page >= totalPages - 1}
				>
					<span aria-hidden="true">»</span>
					<span className="sr-only">Last page</span>
				</button>
			</div>
		);
	};

	return (
		<section className="notifications-page">
			<div className="notifications-banner" data-animate="fade-up">
				<div className="notifications-banner__content">
					<div className="notifications-banner__info">
						<span className="notifications-banner__eyebrow">
							<FaBell aria-hidden="true" />
							Alerts Center
						</span>
						<h1 className="notifications-banner__title">Notifications Hub</h1>
						<p className="notifications-banner__subtitle">
							Monitor every approval, alert, and update from suppliers, operations, reporting, and support in one consistent workspace.
						</p>
					</div>
					<div className="notifications-banner__actions">
						<button
							type="button"
							className="notifications-btn notifications-btn--ghost"
							onClick={handleRefresh}
							disabled={loading}
						>
							<FaSync aria-hidden="true" className={loading ? 'notifications-icon--spin' : ''} />
							<span>{loading ? 'Refreshing…' : 'Refresh'}</span>
						</button>
						<button
							type="button"
							className="notifications-btn notifications-btn--primary"
							onClick={markAllAsRead}
							disabled={!hasNotifications || allRead}
						>
							<FaCheckDouble aria-hidden="true" />
							<span>Mark all as read</span>
						</button>
					</div>
				</div>

				<div className="notifications-banner__meta">
					{metrics.map((metric) => {
						const MetricIcon = metric.icon;
						return (
							<div key={metric.label} className="notifications-banner__meta-item">
								<div className={`notifications-banner__meta-icon ${metric.modifier}`} aria-hidden="true">
									<MetricIcon />
								</div>
								<div className="notifications-banner__meta-content">
									<span className="notifications-banner__meta-label">{metric.label}</span>
									<span className="notifications-banner__meta-value">{metric.value}</span>
								</div>
							</div>
						);
					})}
				</div>
			</div>

			<div className="notifications-filters" data-animate="fade-up" data-delay="0.08">
				<div className="notifications-filters__header">
					<div className="notifications-filters__icon" aria-hidden="true">
						<FaFilter />
					</div>
					<div>
						<h2 className="notifications-filters__title">Filters</h2>
						<p className="notifications-filters__subtitle">Refine notifications by functional area, urgency, and read state.</p>
					</div>
				</div>
				<div className="notifications-filters__grid">
					<div className="notifications-filters__group">
						<label htmlFor="filterType" className="notifications-filters__label">Type</label>
						<select
							id="filterType"
							name="type"
							value={filters.type}
							onChange={handleFilterChange}
							className="notifications-select"
						>
							{typeOptions.map((option) => (
								<option key={option.value} value={option.value}>
									{option.label}
								</option>
							))}
						</select>
					</div>
					<div className="notifications-filters__group">
						<label htmlFor="filterPriority" className="notifications-filters__label">Priority</label>
						<select
							id="filterPriority"
							name="priority"
							value={filters.priority}
							onChange={handleFilterChange}
							className="notifications-select"
						>
							{priorityOptions.map((option) => (
								<option key={option.value} value={option.value}>
									{option.label}
								</option>
							))}
						</select>
					</div>
					<div className="notifications-filters__group">
						<label htmlFor="filterIsRead" className="notifications-filters__label">Status</label>
						<select
							id="filterIsRead"
							name="isRead"
							value={filters.isRead}
							onChange={handleFilterChange}
							className="notifications-select"
						>
							{readOptions.map((option) => (
								<option key={option.value} value={option.value}>
									{option.label}
								</option>
							))}
						</select>
					</div>
				</div>
			</div>

			<div className="notifications-results" data-animate="fade-up" data-delay="0.12">
				{loading ? (
					<div className="notifications-loading" role="status" aria-live="polite">
						<div className="notifications-spinner" aria-hidden="true" />
						<p>Loading notifications…</p>
					</div>
				) : hasNotifications ? (
					<>
						<div className="notifications-summary">
							Showing {notifications.length} of {totalCount} notification{totalCount !== 1 ? 's' : ''}.
						</div>
						<div className="notifications-table" role="table" aria-label="Notifications list">
							<div className="notifications-table__head" role="row">
								<div className="notifications-table__cell notifications-table__cell--icon" role="columnheader" aria-label="Category" />
								<div className="notifications-table__cell" role="columnheader">Notification</div>
								<div className="notifications-table__cell" role="columnheader">Type</div>
								<div className="notifications-table__cell" role="columnheader">Priority</div>
								<div className="notifications-table__cell" role="columnheader">Date</div>
								<div className="notifications-table__cell notifications-table__cell--actions" role="columnheader">Actions</div>
							</div>
							{notifications.map((notification) => {
								const isUnread = !notification.isRead;
								return (
									<div
										key={notification.id}
										className={`notifications-table__row${isUnread ? ' notifications-table__row--unread' : ''}`}
										role="row"
										tabIndex={0}
										onClick={() => handleNotificationClick(notification)}
										onKeyDown={(event) => handleRowKeyDown(event, notification)}
									>
										<div className="notifications-table__cell notifications-table__cell--icon" role="cell">
											<span className="notifications-emoji" aria-hidden="true">
												{getNotificationIcon(notification.type)}
											</span>
											<span className="sr-only">{toTitleCase(notification.type || 'Notification')}</span>
										</div>
										<div className="notifications-table__cell" role="cell">
											<div className="notifications-row__title">
												<span>{notification.title || 'Notification'}</span>
												{isUnread && <span className="notifications-chip">New</span>}
											</div>
											<p className="notifications-row__message">{notification.message}</p>
										</div>
										<div
											className="notifications-table__cell"
											role="cell"
											data-label="Type"
										>
											{renderTypeBadge(notification.type)}
										</div>
										<div
											className="notifications-table__cell"
											role="cell"
											data-label="Priority"
										>
											{renderPriorityBadge(notification.priority)}
										</div>
										<div
											className="notifications-table__cell"
											role="cell"
											data-label="Date"
										>
											<time dateTime={notification.createdAt || undefined}>{formatDate(notification.createdAt)}</time>
										</div>
										<div
											className="notifications-table__cell notifications-table__cell--actions"
											role="cell"
											data-label="Actions"
										>
											<div className="notifications-row__actions">
												{notification.link && (
													<button
														type="button"
														className="notifications-icon-btn"
														onClick={(event) => {
															event.stopPropagation();
															handleNotificationClick(notification);
														}}
														title="View details"
													>
														<FaExternalLinkAlt aria-hidden="true" />
														<span className="sr-only">Open notification link</span>
													</button>
												)}
												{!notification.isRead && (
													<button
														type="button"
														className="notifications-icon-btn"
														onClick={(event) => handleMarkAsRead(event, notification)}
														title="Mark as read"
													>
														<FaCheckDouble aria-hidden="true" />
														<span className="sr-only">Mark notification as read</span>
													</button>
												)}
												<button
													type="button"
													className="notifications-icon-btn notifications-icon-btn--danger"
													onClick={(event) => handleDeleteNotification(event, notification)}
													title="Delete notification"
												>
													<FaTrashAlt aria-hidden="true" />
													<span className="sr-only">Delete notification</span>
												</button>
											</div>
										</div>
									</div>
								);
							})}
						</div>
					</>
				) : (
					<div className="notifications-empty" role="status" aria-live="polite">
						<FaInbox className="notifications-empty__icon" aria-hidden="true" />
						<h3>You're all caught up</h3>
						<p>No notifications match your current filters.</p>
					</div>
				)}
			</div>

			{renderPagination()}
		</section>
	);
};

export default NotificationsPage;

