import React, { useState, useEffect } from 'react';
import { FaEnvelope, FaEdit, FaTrash, FaEye, FaCode, FaSpinner, FaTimes } from 'react-icons/fa';
import adminApi from '../../../api/adminApi';
import { toast } from 'react-toastify';

const PreviewModal = ({ html, onClose }) => {
  if (!html) return null;
  
  return (
    <div className="modal-overlay">
      <div className="modal-content" data-animate="fade-up">
        <div className="modal-header">
          <h3>Email Preview</h3>
          <button onClick={onClose} className="modal-close">
            <FaTimes />
          </button>
        </div>
        <div className="modal-body">
          <div className="email-preview" dangerouslySetInnerHTML={{ __html: html }} />
        </div>
        <div className="modal-actions">
          <button onClick={onClose} className="reporting-btn reporting-btn--secondary">
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
};

const EmailTemplatesList = ({ onEdit }) => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [previewHtml, setPreviewHtml] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => { fetchTemplates(); }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await adminApi.get('/admin/email/templates');
      setTemplates(res.data || []);
    } catch (err) {
      console.error('Failed to load templates', err);
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (template) => {
    if (!confirm(`Are you sure you want to delete the template "${template.name}"? This action cannot be undone.`)) return;
    
    setDeletingId(template.id);
    try {
      await adminApi.delete(`/admin/email/templates/${template.id}`);
      await fetchTemplates();
      toast.success('Template deleted successfully');
    } catch (err) {
      console.error('Delete failed', err);
      toast.error('Delete failed: ' + (err?.response?.data?.message || err.message));
    } finally {
      setDeletingId(null);
    }
  };

  const handlePreview = async (template) => {
    setPreviewLoading(true);
    setPreviewHtml(null);
    try {
      const payload = { templateId: template.id, vars: {} };
      const res = await adminApi.post('/admin/email/templates/preview', payload);
      const html = res.data;
      setPreviewHtml(html);
    } catch (err) {
      console.error('Preview failed', err);
      toast.error('Preview failed: ' + (err?.response?.data || err.message));
    } finally {
      setPreviewLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="reporting-loading">
        <div className="reporting-spinner" />
        <p>Loading templates...</p>
      </div>
    );
  }

  return (
    <div className="templates-list" data-animate="fade-up" data-delay="0.08">
      <div className="reporting-card">
        <div className="reporting-card__header">
          <div>
            <h2 className="reporting-card__title">
              <FaEnvelope /> Email Templates
            </h2>
            <p className="reporting-card__subtitle">
              Manage your email templates for automated communications
            </p>
          </div>
          <div className="templates-count">
            <span className="reporting-badge reporting-badge--info">
              {templates.length} {templates.length === 1 ? 'Template' : 'Templates'}
            </span>
          </div>
        </div>
        <div className="reporting-card__content">
          {templates.length === 0 ? (
            <div className="reporting-empty-state">
              <FaCode className="empty-icon" />
              <h3>No Templates Found</h3>
              <p>Get started by creating your first email template</p>
            </div>
          ) : (
            <div className="templates-grid">
              {templates.map(template => (
                <div key={template.id} className="template-card">
                  <div className="template-header">
                    <h3 className="template-name">{template.name}</h3>
                    <div className="template-actions">
                      <button 
                        onClick={() => handlePreview(template)}
                        disabled={previewLoading}
                        className="reporting-btn reporting-btn--secondary reporting-btn--sm"
                        title="Preview Template"
                      >
                        <FaEye /> {previewLoading ? 'Loading...' : 'Preview'}
                      </button>
                      <button 
                        onClick={() => onEdit && onEdit(template)}
                        className="reporting-btn reporting-btn--secondary reporting-btn--sm"
                        title="Edit Template"
                      >
                        <FaEdit />
                      </button>
                      <button 
                        onClick={() => handleDelete(template)}
                        disabled={deletingId === template.id}
                        className="reporting-btn reporting-btn--danger reporting-btn--sm"
                        title="Delete Template"
                      >
                        {deletingId === template.id ? <FaSpinner className="spinner" /> : <FaTrash />}
                      </button>
                    </div>
                  </div>
                  
                  <div className="template-content">
                    <div className="template-subject">
                      <strong>Subject:</strong> {template.subject}
                    </div>
                    <div className="template-body-preview">
                      <strong>Body Preview:</strong> 
                      <div className="body-snippet">
                        {template.body.substring(0, 150)}...
                      </div>
                    </div>
                  </div>
                  
                  <div className="template-footer">
                    <span className="template-id">ID: {template.id}</span>
                    <span className="template-date">
                      Updated: {new Date(template.updatedAt || template.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <PreviewModal html={previewHtml} onClose={() => setPreviewHtml(null)} />
    </div>
  );
};

export default EmailTemplatesList;