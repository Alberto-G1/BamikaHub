import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import api from '../../api/api.js';
import { toast } from 'react-toastify';
import { FaQuestionCircle, FaBook, FaComments, FaVideo, FaFileAlt, FaSearch, FaPlus, FaEye, FaThumbsUp, FaThumbsDown } from 'react-icons/fa';
import Card from '../../components/common/Card.jsx';
import Button from '../../components/common/Button.jsx';
import Input from '../../components/common/Input.jsx';
import Modal from '../../components/common/Modal.jsx';
import Spinner from '../../components/common/Spinner.jsx';
import Table from '../../components/common/Table.jsx';
import Badge from '../../components/common/Badge.jsx';
import './HelpCenter.css';

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
            loadHelpData(); // Refresh tickets
        } catch (error) {
            console.error('Error creating ticket:', error);
            toast.error('Failed to create support ticket');
        }
    };

    const handleViewArticle = async (article) => {
        try {
            // Increment view count
            await api.post(`/help/articles/${article.id}/view`);

            // Show article in modal
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

            // Update local state
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
            <div className="help-center-loading">
                <Spinner />
                <p>Loading help center...</p>
            </div>
        );
    }

    return (
        <div className="help-center-page">
            <div className="help-center-header">
                <h1>Help Center</h1>
                <p>Find answers, get support, and learn how to use the system</p>

                {/* Search Bar */}
                <div className="help-search">
                    <div className="search-input-group">
                        <Input
                            type="text"
                            placeholder="Search FAQs, articles, and help topics..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                            className="search-input"
                        />
                        <Button onClick={handleSearch} className="search-button">
                            <FaSearch /> Search
                        </Button>
                    </div>
                </div>
            </div>

            <div className="help-center-tabs">
                <button
                    className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
                    onClick={() => setActiveTab('overview')}
                >
                    <FaBook /> Overview
                </button>
                <button
                    className={`tab-button ${activeTab === 'faqs' ? 'active' : ''}`}
                    onClick={() => setActiveTab('faqs')}
                >
                    <FaQuestionCircle /> FAQs
                </button>
                <button
                    className={`tab-button ${activeTab === 'support' ? 'active' : ''}`}
                    onClick={() => setActiveTab('support')}
                >
                    <FaComments /> Support
                </button>
                <button
                    className={`tab-button ${activeTab === 'knowledge' ? 'active' : ''}`}
                    onClick={() => setActiveTab('knowledge')}
                >
                    <FaFileAlt /> Knowledge Base
                </button>
            </div>

            <div className="help-center-content">
                {activeTab === 'overview' && (
                    <div className="help-overview">
                        <div className="overview-stats">
                            <Card className="stat-card">
                                <div className="stat-content">
                                    <FaQuestionCircle className="stat-icon" />
                                    <div className="stat-info">
                                        <h3>{faqs.length}</h3>
                                        <p>FAQ Articles</p>
                                    </div>
                                </div>
                            </Card>
                            <Card className="stat-card">
                                <div className="stat-content">
                                    <FaFileAlt className="stat-icon" />
                                    <div className="stat-info">
                                        <h3>{articles.length}</h3>
                                        <p>Knowledge Base Articles</p>
                                    </div>
                                </div>
                            </Card>
                            <Card className="stat-card">
                                <div className="stat-content">
                                    <FaComments className="stat-icon" />
                                    <div className="stat-info">
                                        <h3>{tickets.length}</h3>
                                        <p>Your Support Tickets</p>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        <div className="overview-sections">
                            <Card className="overview-card">
                                <div className="card-header">
                                    <h2>Popular FAQs</h2>
                                </div>
                                <div className="card-body">
                                    <div className="popular-faqs">
                                        {faqs.slice(0, 5).map(faq => (
                                            <div key={faq.id} className="faq-item">
                                                <h4>{faq.question}</h4>
                                                <p>{faq.answer.substring(0, 100)}...</p>
                                                <Badge variant="info">{faq.category}</Badge>
                                            </div>
                                        ))}
                                    </div>
                                    <Button
                                        onClick={() => setActiveTab('faqs')}
                                        className="view-all-button"
                                    >
                                        View All FAQs
                                    </Button>
                                </div>
                            </Card>

                            <Card className="overview-card">
                                <div className="card-header">
                                    <h2>Recent Articles</h2>
                                </div>
                                <div className="card-body">
                                    <div className="recent-articles">
                                        {articles.slice(0, 5).map(article => (
                                            <div key={article.id} className="article-item">
                                                <h4>{article.title}</h4>
                                                <p>{article.summary}</p>
                                                <div className="article-meta">
                                                    <Badge variant="secondary">{article.category}</Badge>
                                                    <span><FaEye /> {article.viewCount}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <Button
                                        onClick={() => setActiveTab('knowledge')}
                                        className="view-all-button"
                                    >
                                        View Knowledge Base
                                    </Button>
                                </div>
                            </Card>
                        </div>
                    </div>
                )}

                {activeTab === 'faqs' && (
                    <div className="help-faqs">
                        <div className="faq-filters">
                            <div className="filter-group">
                                <label>Category:</label>
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    className="filter-select"
                                >
                                    <option value="all">All Categories</option>
                                    {faqCategories.map(category => (
                                        <option key={category} value={category}>{category}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="faq-list">
                            {filteredFAQs.length > 0 ? (
                                filteredFAQs.map(faq => (
                                    <Card key={faq.id} className="faq-card">
                                        <div className="card-header">
                                            <h3>{faq.question}</h3>
                                            <Badge variant="info">{faq.category}</Badge>
                                        </div>
                                        <div className="card-body">
                                            <div className="faq-answer">
                                                <pre>{faq.answer}</pre>
                                            </div>
                                            <div className="faq-meta">
                                                <span>Views: {faq.viewCount}</span>
                                                <span>Last updated: {formatDateTime(faq.updatedAt)}</span>
                                            </div>
                                        </div>
                                    </Card>
                                ))
                            ) : (
                                <div className="no-results">
                                    <FaQuestionCircle className="no-results-icon" />
                                    <h3>No FAQs found</h3>
                                    <p>Try adjusting your search or category filter.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'support' && (
                    <div className="help-support">
                        <div className="support-actions">
                            <Button
                                onClick={() => setShowTicketModal(true)}
                                className="primary"
                            >
                                <FaPlus /> Create Support Ticket
                            </Button>
                        </div>

                        <Card className="support-card">
                            <div className="card-header">
                                <h2>Your Support Tickets</h2>
                            </div>
                            <div className="card-body">
                                <Table
                                    columns={[
                                        { key: 'ticketNumber', header: 'Ticket #', render: (value) => <strong>{value}</strong> },
                                        { key: 'subject', header: 'Subject' },
                                        { key: 'category', header: 'Category', render: (value) => value.replace(/_/g, ' ') },
                                        { key: 'priority', header: 'Priority', render: (value) => (
                                            <Badge variant={getPriorityColor(value)}>
                                                {value}
                                            </Badge>
                                        )},
                                        { key: 'status', header: 'Status', render: (value) => (
                                            <Badge variant={getStatusColor(value)}>
                                                {value.replace(/_/g, ' ')}
                                            </Badge>
                                        )},
                                        { key: 'createdAt', header: 'Created', render: (value) => formatDateTime(value) },
                                        { key: 'messageCount', header: 'Messages', render: (value) => (
                                            <Badge variant="secondary">{value}</Badge>
                                        )}
                                    ]}
                                    data={tickets}
                                    emptyMessage="No support tickets found. Create your first ticket to get help."
                                />
                            </div>
                        </Card>
                    </div>
                )}

                {activeTab === 'knowledge' && (
                    <div className="help-knowledge">
                        <div className="knowledge-filters">
                            <div className="filter-group">
                                <label>Category:</label>
                                <select
                                    value={selectedArticleCategory}
                                    onChange={(e) => setSelectedArticleCategory(e.target.value)}
                                    className="filter-select"
                                >
                                    <option value="all">All Categories</option>
                                    {articleCategories.map(category => (
                                        <option key={category} value={category}>{category}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="articles-grid">
                            {filteredArticles.length > 0 ? (
                                filteredArticles.map(article => (
                                    <Card key={article.id} className="article-card">
                                        <div className="card-header">
                                            <h3>{article.title}</h3>
                                            <Badge variant="secondary">{article.category}</Badge>
                                        </div>
                                        <div className="card-body">
                                            <p className="article-summary">{article.summary}</p>
                                            <div className="article-meta">
                                                <span><FaEye /> {article.viewCount} views</span>
                                                <span>By {article.authorName}</span>
                                                <span>{formatDateTime(article.updatedAt)}</span>
                                            </div>
                                            <div className="article-actions">
                                                <Button
                                                    onClick={() => handleViewArticle(article)}
                                                    className="outline"
                                                >
                                                    Read More
                                                </Button>
                                            </div>
                                        </div>
                                    </Card>
                                ))
                            ) : (
                                <div className="no-results">
                                    <FaFileAlt className="no-results-icon" />
                                    <h3>No articles found</h3>
                                    <p>Try adjusting your search or category filter.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Create Ticket Modal */}
            <Modal
                isOpen={showTicketModal}
                onClose={() => setShowTicketModal(false)}
                title="Create Support Ticket"
            >
                <div className="ticket-form">
                    <div className="form-group">
                        <label>Subject *</label>
                        <Input
                            type="text"
                            value={ticketForm.subject}
                            onChange={(e) => setTicketForm(prev => ({...prev, subject: e.target.value}))}
                            placeholder="Brief description of your issue"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Category</label>
                        <select
                            value={ticketForm.category}
                            onChange={(e) => setTicketForm(prev => ({...prev, category: e.target.value}))}
                            className="form-control"
                        >
                            <option value="GENERAL">General</option>
                            <option value="TECHNICAL">Technical</option>
                            <option value="ACCOUNT">Account</option>
                            <option value="BILLING">Billing</option>
                            <option value="FEATURE_REQUEST">Feature Request</option>
                            <option value="BUG_REPORT">Bug Report</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Priority</label>
                        <select
                            value={ticketForm.priority}
                            onChange={(e) => setTicketForm(prev => ({...prev, priority: e.target.value}))}
                            className="form-control"
                        >
                            <option value="LOW">Low</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="HIGH">High</option>
                            <option value="URGENT">Urgent</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Description *</label>
                        <textarea
                            value={ticketForm.description}
                            onChange={(e) => setTicketForm(prev => ({...prev, description: e.target.value}))}
                            className="form-control"
                            rows="5"
                            placeholder="Please provide detailed information about your issue..."
                            required
                        />
                    </div>
                    <div className="modal-actions">
                        <Button onClick={() => setShowTicketModal(false)} variant="secondary">
                            Cancel
                        </Button>
                        <Button onClick={handleCreateTicket} className="primary">
                            Create Ticket
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Article Modal */}
            <Modal
                isOpen={showArticleModal}
                onClose={() => setShowArticleModal(false)}
                title={currentArticle?.title || 'Article'}
                size="large"
            >
                {currentArticle && (
                    <div className="article-modal-content">
                        <div className="article-header">
                            <div className="article-meta">
                                <Badge variant="secondary">{currentArticle.category}</Badge>
                                <span>By {currentArticle.authorName}</span>
                                <span>{formatDateTime(currentArticle.updatedAt)}</span>
                                <span><FaEye /> {currentArticle.viewCount} views</span>
                            </div>
                        </div>
                        <div className="article-content">
                            <pre>{currentArticle.content}</pre>
                        </div>
                        <div className="article-feedback">
                            <p>Was this article helpful?</p>
                            <div className="feedback-buttons">
                                <Button
                                    onClick={() => handleVoteArticle(currentArticle.id, true)}
                                    className="outline success"
                                >
                                    <FaThumbsUp /> Yes ({currentArticle.helpfulCount})
                                </Button>
                                <Button
                                    onClick={() => handleVoteArticle(currentArticle.id, false)}
                                    className="outline danger"
                                >
                                    <FaThumbsDown /> No ({currentArticle.notHelpfulCount})
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default HelpCenter;