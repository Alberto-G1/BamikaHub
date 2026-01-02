import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import api from '../../api/api.js';
import { toast } from 'react-toastify';
import { FaQuestionCircle, FaBook, FaComments, FaFileAlt, FaSearch, FaPlus, FaEye, FaThumbsUp, FaThumbsDown, FaFilter, FaClock, FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa';
import './HelpCenterStyles.css';

const HelpCenter = () => {
    const { user, hasPermission } = useAuth();
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // FAQ states
    const [faqs, setFaqs] = useState([]);
    const [faqCategories, setFaqCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('all');

    // Support ticket states
    const [tickets, setTickets] = useState([]);
    const [showTicketModal, setShowTicketModal] = useState(false);
    const [ticketForm, setTicketForm] = useState({
        subject: '',
        description: '',
        category: 'GENERAL',
        priority: 'MEDIUM'
    });

    // Knowledge base states
    const [articles, setArticles] = useState([]);
    const [articleCategories, setArticleCategories] = useState([]);
    const [selectedArticleCategory, setSelectedArticleCategory] = useState('all');
    const [showArticleModal, setShowArticleModal] = useState(false);
    const [currentArticle, setCurrentArticle] = useState(null);

    useEffect(() => {
        loadHelpData();
    }, []);

    const loadHelpData = async () => {
        setLoading(true);
        try {
            const [faqResponse, ticketResponse, articleResponse] = await Promise.all([
                api.get('/help/faqs'),
                api.get(`/help/tickets?userId=${user?.id || 'guest'}&page=0&size=10`),
                api.get('/help/articles?page=0&size=10')
            ]);

            setFaqs(faqResponse.data);
            setTickets(ticketResponse.data.content || []);
            setArticles(articleResponse.data.content || []);

            // Load categories
            const [faqCatResponse, articleCatResponse] = await Promise.all([
                api.get('/help/faqs/categories'),
                api.get('/help/articles/categories')
            ]);

            setFaqCategories(faqCatResponse.data);
            setArticleCategories(articleCatResponse.data);
        } catch (error) {
            console.error('Error loading help data:', error);
            toast.error('Failed to load help data');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        if (!searchTerm.trim()) {
            loadHelpData();
            return;
        }

        try {
            const [faqResults, articleResults] = await Promise.all([
                api.get(`/help/faqs/search?q=${encodeURIComponent(searchTerm)}`),
                api.get(`/help/articles/search?q=${encodeURIComponent(searchTerm)}&page=0&size=10`)
            ]);

            setFaqs(faqResults.data);
            setArticles(articleResults.data.content || []);
            setSelectedCategory('all');
            setSelectedArticleCategory('all');
        } catch (error) {
            console.error('Error searching:', error);
            toast.error('Search failed');
        }
    };

    const handleCreateTicket = async () => {
        try {
            const ticketData = {
                ...ticketForm,
                userId: user?.id || 'guest',
                createdBy: user?.name || 'Guest User'
            };

            await api.post('/help/tickets', ticketData);
            toast.success('Support ticket created successfully');
            setShowTicketModal(false);
            setTicketForm({
                subject: '',
                description: '',
                category: 'GENERAL',
                priority: 'MEDIUM'
            });
            loadHelpData();
        } catch (error) {
            console.error('Error creating ticket:', error);
            toast.error('Failed to create support ticket');
        }
    };

    const handleViewArticle = async (article) => {
        try {
            await api.post(`/help/articles/${article.id}/view`);
            setCurrentArticle(article);
            setShowArticleModal(true);
        } catch (error) {
            console.error('Error viewing article:', error);
        }
    };

    const handleVoteArticle = async (articleId, helpful) => {
        try {
            await api.post(`/help/articles/${articleId}/vote?helpful=${helpful}`);
            toast.success('Thank you for your feedback!');

            setArticles(prev => prev.map(article =>
                article.id === articleId
                    ? {
                        ...article,
                        helpfulCount: helpful ? article.helpfulCount + 1 : article.helpfulCount,
                        notHelpfulCount: !helpful ? article.notHelpfulCount + 1 : article.notHelpfulCount
                    }
                    : article
            ));
        } catch (error) {
            console.error('Error voting on article:', error);
            toast.error('Failed to submit feedback');
        }
    };

    const filteredFAQs = selectedCategory === 'all'
        ? faqs
        : faqs.filter(faq => faq.category === selectedCategory);

    const filteredArticles = selectedArticleCategory === 'all'
        ? articles
        : articles.filter(article => article.category === selectedArticleCategory);

    const formatDateTime = (dateTime) => {
        return new Date(dateTime).toLocaleString();
    };

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'open': return 'danger';
            case 'in_progress': return 'warning';
            case 'waiting_for_user': return 'info';
            case 'resolved': return 'success';
            case 'closed': return 'secondary';
            default: return 'secondary';
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority?.toLowerCase()) {
            case 'urgent': return 'danger';
            case 'high': return 'warning';
            case 'medium': return 'info';
            case 'low': return 'success';
            default: return 'secondary';
        }
    };

    if (loading) {
        return (
            <div className="reporting-loading">
                <div className="reporting-spinner" />
                <p>Loading help center...</p>
            </div>
        );
    }

    return (
        <section className="reporting-page">
            {/* Hero Banner */}
            <div className="reporting-banner" data-animate="fade-up">
                <div className="reporting-banner__content">
                    <div className="reporting-banner__info">
                        <span className="reporting-banner__eyebrow">
                            <FaQuestionCircle /> Support & Resources
                        </span>
                        <h1 className="reporting-banner__title">Help Center</h1>
                        <p className="reporting-banner__subtitle">
                            Find answers, get support, and learn how to use the system effectively. 
                            Browse FAQs, knowledge base articles, or create support tickets.
                        </p>
                    </div>
                </div>
                <div className="reporting-banner__meta">
                    <div className="reporting-banner__meta-item">
                        <div className="reporting-banner__meta-icon reporting-banner__meta-icon--blue">
                            <FaQuestionCircle />
                        </div>
                        <div className="reporting-banner__meta-content">
                            <span className="reporting-banner__meta-label">FAQs</span>
                            <span className="reporting-banner__meta-value">{faqs.length}</span>
                        </div>
                    </div>
                    <div className="reporting-banner__meta-item">
                        <div className="reporting-banner__meta-icon reporting-banner__meta-icon--green">
                            <FaFileAlt />
                        </div>
                        <div className="reporting-banner__meta-content">
                            <span className="reporting-banner__meta-label">Articles</span>
                            <span className="reporting-banner__meta-value">{articles.length}</span>
                        </div>
                    </div>
                    <div className="reporting-banner__meta-item">
                        <div className="reporting-banner__meta-icon reporting-banner__meta-icon--purple">
                            <FaComments />
                        </div>
                        <div className="reporting-banner__meta-content">
                            <span className="reporting-banner__meta-label">Your Tickets</span>
                            <span className="reporting-banner__meta-value">{tickets.length}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search Bar */}
            <div className="reporting-filters" data-animate="fade-up" data-delay="0.04">
                <div className="reporting-filters__header">
                    <div className="reporting-filters__header-icon">
                        <FaSearch />
                    </div>
                    <h2 className="reporting-filters__title">Search Help Resources</h2>
                </div>
                <div className="help-center-search">
                    <div className="help-center-search__container">
                        <input
                            type="text"
                            className="reporting-input"
                            placeholder="Search FAQs, articles, and help topics..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        />
                        <button
                            className="reporting-btn reporting-btn--blue"
                            onClick={handleSearch}
                        >
                            <FaSearch /> Search
                        </button>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="reporting-tabs" data-animate="fade-up" data-delay="0.08">
                <button
                    className={`reporting-tab ${activeTab === 'overview' ? 'is-active' : ''}`}
                    onClick={() => setActiveTab('overview')}
                >
                    <FaBook /> Overview
                </button>
                <button
                    className={`reporting-tab ${activeTab === 'faqs' ? 'is-active' : ''}`}
                    onClick={() => setActiveTab('faqs')}
                >
                    <FaQuestionCircle /> FAQs
                </button>
                <button
                    className={`reporting-tab ${activeTab === 'support' ? 'is-active' : ''}`}
                    onClick={() => setActiveTab('support')}
                >
                    <FaComments /> Support
                </button>
                <button
                    className={`reporting-tab ${activeTab === 'knowledge' ? 'is-active' : ''}`}
                    onClick={() => setActiveTab('knowledge')}
                >
                    <FaFileAlt /> Knowledge Base
                </button>
            </div>

            <div className="help-center-content">
                {activeTab === 'overview' && (
                    <div data-animate="fade-up" data-delay="0.12">
                        {/* Quick Stats */}
                        <div className="reporting-metrics">
                            <div className="reporting-metric reporting-metric--blue">
                                <span className="reporting-metric__label">Total FAQs</span>
                                <span className="reporting-metric__value">{faqs.length}</span>
                            </div>
                            <div className="reporting-metric reporting-metric--green">
                                <span className="reporting-metric__label">Knowledge Articles</span>
                                <span className="reporting-metric__value">{articles.length}</span>
                            </div>
                            <div className="reporting-metric reporting-metric--purple">
                                <span className="reporting-metric__label">Your Support Tickets</span>
                                <span className="reporting-metric__value">{tickets.length}</span>
                            </div>
                        </div>

                        {/* Popular FAQs */}
                        <div className="reporting-card" data-animate="fade-up" data-delay="0.16">
                            <div className="reporting-card__header">
                                <div>
                                    <h2 className="reporting-card__title">Popular FAQs</h2>
                                    <p className="reporting-card__subtitle">Most frequently asked questions</p>
                                </div>
                                <button
                                    onClick={() => setActiveTab('faqs')}
                                    className="reporting-btn reporting-btn--secondary"
                                >
                                    View All FAQs
                                </button>
                            </div>
                            <div className="reporting-card__content">
                                <div className="help-center-grid">
                                    {faqs.slice(0, 6).map(faq => (
                                        <div key={faq.id} className="help-center-card help-center-card--faq">
                                            <div className="help-center-card__header">
                                                <h3 className="help-center-card__title">{faq.question}</h3>
                                                <span className="reporting-badge reporting-badge--info">{faq.category}</span>
                                            </div>
                                            <div className="help-center-card__content">
                                                <p className="help-center-card__description">
                                                    {faq.answer.substring(0, 120)}...
                                                </p>
                                                <div className="help-center-card__meta">
                                                    <span className="help-center-meta-item">
                                                        <FaEye /> {faq.viewCount} views
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Recent Articles */}
                        <div className="reporting-card" data-animate="fade-up" data-delay="0.2">
                            <div className="reporting-card__header">
                                <div>
                                    <h2 className="reporting-card__title">Recent Knowledge Base Articles</h2>
                                    <p className="reporting-card__subtitle">Latest help documentation</p>
                                </div>
                                <button
                                    onClick={() => setActiveTab('knowledge')}
                                    className="reporting-btn reporting-btn--secondary"
                                >
                                    View Knowledge Base
                                </button>
                            </div>
                            <div className="reporting-card__content">
                                <div className="help-center-grid">
                                    {articles.slice(0, 6).map(article => (
                                        <div key={article.id} className="help-center-card help-center-card--article">
                                            <div className="help-center-card__header">
                                                <h3 className="help-center-card__title">{article.title}</h3>
                                                <span className="reporting-badge reporting-badge--neutral">{article.category}</span>
                                            </div>
                                            <div className="help-center-card__content">
                                                <p className="help-center-card__description">{article.summary}</p>
                                                <div className="help-center-card__meta">
                                                    <span className="help-center-meta-item">
                                                        <FaEye /> {article.viewCount} views
                                                    </span>
                                                    <span className="help-center-meta-item">
                                                        By {article.authorName}
                                                    </span>
                                                </div>
                                                <div className="help-center-card__actions">
                                                    <button
                                                        className="reporting-btn reporting-btn--secondary reporting-btn--sm"
                                                        onClick={() => handleViewArticle(article)}
                                                    >
                                                        Read More
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'faqs' && (
                    <div data-animate="fade-up" data-delay="0.12">
                        <div className="reporting-card">
                            <div className="reporting-card__header">
                                <div>
                                    <h2 className="reporting-card__title">Frequently Asked Questions</h2>
                                    <p className="reporting-card__subtitle">Find answers to common questions</p>
                                </div>
                                <div className="help-center-filters">
                                    <div className="reporting-form-group">
                                        <label className="reporting-form-label">Filter by Category</label>
                                        <select
                                            value={selectedCategory}
                                            onChange={(e) => setSelectedCategory(e.target.value)}
                                            className="reporting-select"
                                        >
                                            <option value="all">All Categories</option>
                                            {faqCategories.map(category => (
                                                <option key={category} value={category}>{category}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className="reporting-card__content">
                                <div className="help-center-faqs">
                                    {filteredFAQs.length > 0 ? (
                                        filteredFAQs.map(faq => (
                                            <div key={faq.id} className="help-center-faq">
                                                <div className="help-center-faq__question">
                                                    <h3>{faq.question}</h3>
                                                    <span className="reporting-badge reporting-badge--info">{faq.category}</span>
                                                </div>
                                                <div className="help-center-faq__answer">
                                                    <pre>{faq.answer}</pre>
                                                </div>
                                                <div className="help-center-faq__meta">
                                                    <span className="help-center-meta-item">
                                                        <FaEye /> {faq.viewCount} views
                                                    </span>
                                                    <span className="help-center-meta-item">
                                                        Updated {formatDateTime(faq.updatedAt)}
                                                    </span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="reporting-empty-state">
                                            <FaQuestionCircle className="empty-icon" />
                                            <p>No FAQs found for the selected criteria.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'support' && (
                    <div data-animate="fade-up" data-delay="0.12">
                        <div className="reporting-card">
                            <div className="reporting-card__header">
                                <div>
                                    <h2 className="reporting-card__title">Support Tickets</h2>
                                    <p className="reporting-card__subtitle">Manage your support requests</p>
                                </div>
                                <button
                                    onClick={() => setShowTicketModal(true)}
                                    className="reporting-btn reporting-btn--gold"
                                >
                                    <FaPlus /> Create Support Ticket
                                </button>
                            </div>
                            <div className="reporting-card__content">
                                {tickets.length > 0 ? (
                                    <div className="reporting-table-container">
                                        <table className="reporting-table">
                                            <thead>
                                                <tr>
                                                    <th>Ticket #</th>
                                                    <th>Subject</th>
                                                    <th>Category</th>
                                                    <th>Priority</th>
                                                    <th>Status</th>
                                                    <th>Created</th>
                                                    <th>Messages</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {tickets.map(ticket => (
                                                    <tr key={ticket.id}>
                                                        <td><strong>{ticket.ticketNumber}</strong></td>
                                                        <td>
                                                            {ticket.subject}
                                                            {(ticket.responseBreached || ticket.resolutionBreached) && (
                                                                <span className="help-sla-breach-indicator" title="SLA breached">
                                                                    <FaExclamationTriangle />
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td>{ticket.category.replace(/_/g, ' ')}</td>
                                                        <td>
                                                            <span className={`reporting-badge reporting-badge--${getPriorityColor(ticket.priority)}`}>
                                                                {ticket.priority}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <span className={`reporting-badge reporting-badge--${getStatusColor(ticket.status)}`}>
                                                                {ticket.status.replace(/_/g, ' ')}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <div className="help-sla-column">
                                                                <span>{formatDateTime(ticket.createdAt)}</span>
                                                                {ticket.responseDueAt && ticket.status === 'OPEN' && (
                                                                    <span className={`help-sla-tag ${ticket.responseBreached ? 'help-sla-tag--breached' : 'help-sla-tag--pending'}`}>
                                                                        <FaClock /> Response due {formatDateTime(ticket.responseDueAt)}
                                                                    </span>
                                                                )}
                                                                {ticket.resolutionDueAt && !['RESOLVED', 'CLOSED'].includes(ticket.status) && (
                                                                    <span className={`help-sla-tag ${ticket.resolutionBreached ? 'help-sla-tag--breached' : 'help-sla-tag--pending'}`}>
                                                                        <FaClock /> Resolution due {formatDateTime(ticket.resolutionDueAt)}
                                                                    </span>
                                                                )}
                                                                {ticket.firstResponseAt && (
                                                                    <span className="help-sla-tag help-sla-tag--success">
                                                                        <FaCheckCircle /> First response logged
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <span className="reporting-badge reporting-badge--neutral">
                                                                {ticket.messageCount}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="reporting-empty-state">
                                        <FaComments className="empty-icon" />
                                        <p>No support tickets found. Create your first ticket to get help.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'knowledge' && (
                    <div data-animate="fade-up" data-delay="0.12">
                        <div className="reporting-card">
                            <div className="reporting-card__header">
                                <div>
                                    <h2 className="reporting-card__title">Knowledge Base</h2>
                                    <p className="reporting-card__subtitle">Browse help articles and documentation</p>
                                </div>
                                <div className="help-center-filters">
                                    <div className="reporting-form-group">
                                        <label className="reporting-form-label">Filter by Category</label>
                                        <select
                                            value={selectedArticleCategory}
                                            onChange={(e) => setSelectedArticleCategory(e.target.value)}
                                            className="reporting-select"
                                        >
                                            <option value="all">All Categories</option>
                                            {articleCategories.map(category => (
                                                <option key={category} value={category}>{category}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className="reporting-card__content">
                                <div className="help-center-grid">
                                    {filteredArticles.length > 0 ? (
                                        filteredArticles.map(article => (
                                            <div key={article.id} className="help-center-card help-center-card--article">
                                                <div className="help-center-card__header">
                                                    <h3 className="help-center-card__title">{article.title}</h3>
                                                    <span className="reporting-badge reporting-badge--neutral">{article.category}</span>
                                                </div>
                                                <div className="help-center-card__content">
                                                    <p className="help-center-card__description">{article.summary}</p>
                                                    <div className="help-center-card__meta">
                                                        <span className="help-center-meta-item">
                                                            <FaEye /> {article.viewCount} views
                                                        </span>
                                                        <span className="help-center-meta-item">
                                                            By {article.authorName}
                                                        </span>
                                                        <span className="help-center-meta-item">
                                                            {formatDateTime(article.updatedAt)}
                                                        </span>
                                                    </div>
                                                    <div className="help-center-card__actions">
                                                        <button
                                                            className="reporting-btn reporting-btn--secondary reporting-btn--sm"
                                                            onClick={() => handleViewArticle(article)}
                                                        >
                                                            Read More
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="reporting-empty-state">
                                            <FaFileAlt className="empty-icon" />
                                            <p>No articles found for the selected criteria.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Create Ticket Modal */}
            {showTicketModal && (
                <div className="reporting-modal-overlay">
                    <div className="reporting-modal" data-animate="fade-up">
                        <div className="reporting-modal__header">
                            <h3>Create Support Ticket</h3>
                            <button 
                                onClick={() => setShowTicketModal(false)}
                                className="reporting-modal__close"
                            >
                                &times;
                            </button>
                        </div>
                        <div className="reporting-modal__content">
                            <div className="reporting-form-group">
                                <label className="reporting-form-label">Subject *</label>
                                <input
                                    type="text"
                                    value={ticketForm.subject}
                                    onChange={(e) => setTicketForm(prev => ({...prev, subject: e.target.value}))}
                                    className="reporting-input"
                                    placeholder="Brief description of your issue"
                                    required
                                />
                            </div>
                            <div className="reporting-filters__grid">
                                <div className="reporting-form-group">
                                    <label className="reporting-form-label">Category</label>
                                    <select
                                        value={ticketForm.category}
                                        onChange={(e) => setTicketForm(prev => ({...prev, category: e.target.value}))}
                                        className="reporting-select"
                                    >
                                        <option value="GENERAL">General</option>
                                        <option value="TECHNICAL">Technical</option>
                                        <option value="ACCOUNT">Account</option>
                                        <option value="BILLING">Billing</option>
                                        <option value="FEATURE_REQUEST">Feature Request</option>
                                        <option value="BUG_REPORT">Bug Report</option>
                                    </select>
                                </div>
                                <div className="reporting-form-group">
                                    <label className="reporting-form-label">Priority</label>
                                    <select
                                        value={ticketForm.priority}
                                        onChange={(e) => setTicketForm(prev => ({...prev, priority: e.target.value}))}
                                        className="reporting-select"
                                    >
                                        <option value="LOW">Low</option>
                                        <option value="MEDIUM">Medium</option>
                                        <option value="HIGH">High</option>
                                        <option value="URGENT">Urgent</option>
                                    </select>
                                </div>
                            </div>
                            <div className="reporting-form-group">
                                <label className="reporting-form-label">Description *</label>
                                <textarea
                                    value={ticketForm.description}
                                    onChange={(e) => setTicketForm(prev => ({...prev, description: e.target.value}))}
                                    className="reporting-textarea"
                                    rows="5"
                                    placeholder="Please provide detailed information about your issue..."
                                    required
                                />
                            </div>
                        </div>
                        <div className="reporting-modal__actions">
                            <button 
                                onClick={() => setShowTicketModal(false)}
                                className="reporting-btn reporting-btn--secondary"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleCreateTicket}
                                className="reporting-btn reporting-btn--gold"
                            >
                                Create Ticket
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Article Modal */}
            {showArticleModal && currentArticle && (
                <div className="reporting-modal-overlay">
                    <div className="reporting-modal reporting-modal--large" data-animate="fade-up">
                        <div className="reporting-modal__header">
                            <h3>{currentArticle.title}</h3>
                            <button 
                                onClick={() => setShowArticleModal(false)}
                                className="reporting-modal__close"
                            >
                                &times;
                            </button>
                        </div>
                        <div className="reporting-modal__content">
                            <div className="help-center-article-meta">
                                <span className="reporting-badge reporting-badge--neutral">{currentArticle.category}</span>
                                <span>By {currentArticle.authorName}</span>
                                <span>{formatDateTime(currentArticle.updatedAt)}</span>
                                <span><FaEye /> {currentArticle.viewCount} views</span>
                            </div>
                            <div className="help-center-article-content">
                                <pre>{currentArticle.content}</pre>
                            </div>
                            <div className="help-center-article-feedback">
                                <p>Was this article helpful?</p>
                                <div className="help-center-feedback-buttons">
                                    <button
                                        onClick={() => handleVoteArticle(currentArticle.id, true)}
                                        className="reporting-btn reporting-btn--success"
                                    >
                                        <FaThumbsUp /> Yes ({currentArticle.helpfulCount})
                                    </button>
                                    <button
                                        onClick={() => handleVoteArticle(currentArticle.id, false)}
                                        className="reporting-btn reporting-btn--danger"
                                    >
                                        <FaThumbsDown /> No ({currentArticle.notHelpfulCount})
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
};

export default HelpCenter;