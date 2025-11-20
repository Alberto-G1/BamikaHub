import React, { useState, useEffect } from 'react';
import { FaSave, FaTimes, FaCode, FaInfoCircle } from 'react-icons/fa';
import adminApi from '../../../api/adminApi';
import { toast } from 'react-toastify';

const EmailTemplateEditor = ({ editing, onSaved, onCancel }) => {
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editing) {
      setName(editing.name || '');
      setSubject(editing.subject || '');
      setBody(editing.body || '');
    } else {
      setName(''); setSubject(''); setBody('');
    }
  }, [editing]);

  const handleSave = async () => {
    if (!name.trim() || !subject.trim() || !body.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      const payload = { name, subject, body };
      if (editing && editing.id) {
        await adminApi.put(`/admin/email/templates/${editing.id}`, payload);
        toast.success('Template updated successfully');
      } else {
        await adminApi.post(`/admin/email/templates`, payload);
        toast.success('Template created successfully');
      }
      onSaved && onSaved();
      setName(''); setSubject(''); setBody('');
    } catch (err) {
      console.error('Save template failed', err);
      toast.error('Save failed: ' + (err?.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="template-editor" data-animate="fade-up" data-delay="0.08">
      <div className="reporting-card">
        <div className="reporting-card__header">
          <div>
            <h2 className="reporting-card__title">
              <FaCode /> {editing ? 'Edit Template' : 'Create New Template'}
            </h2>
            <p className="reporting-card__subtitle">
              {editing ? 'Update your email template' : 'Design a new email template for automated communications'}
            </p>
          </div>
        </div>
        <div className="reporting-card__content">
          <div className="template-form">
            <div className="reporting-form-group">
              <label className="reporting-form-label">
                Template Name *
                <span className="form-help">Unique identifier for this template</span>
              </label>
              <input 
                value={name} 
                onChange={e => setName(e.target.value)}
                className="reporting-input"
                placeholder="Enter template name..."
              />
            </div>

            <div className="reporting-form-group">
              <label className="reporting-form-label">
                Email Subject *
                <span className="form-help">Subject line for the email</span>
              </label>
              <input 
                value={subject} 
                onChange={e => setSubject(e.target.value)}
                className="reporting-input"
                placeholder="Enter email subject..."
              />
            </div>

            <div className="reporting-form-group">
              <label className="reporting-form-label">
                Email Body (Thymeleaf HTML) *
                <span className="form-help">
                  Use Thymeleaf syntax for dynamic content. Variables: {'{{variableName}}'}
                </span>
              </label>
              <textarea 
                value={body} 
                onChange={e => setBody(e.target.value)} 
                rows={16}
                className="reporting-textarea reporting-textarea--code"
                placeholder="Enter email body with Thymeleaf HTML..."
              />
            </div>

            <div className="template-variables-help">
              <div className="help-header">
                <FaInfoCircle />
                <span>Available Template Variables</span>
              </div>
              <div className="variables-grid">
                <div className="variable-item">
                  <code>{'{{user.fullName}}'}</code>
                  <span>User's full name</span>
                </div>
                <div className="variable-item">
                  <code>{'{{user.email}}'}</code>
                  <span>User's email address</span>
                </div>
                <div className="variable-item">
                  <code>{'{{user.username}}'}</code>
                  <span>User's username</span>
                </div>
                <div className="variable-item">
                  <code>{'{{company.name}}'}</code>
                  <span>Company name</span>
                </div>
                <div className="variable-item">
                  <code>{'{{currentDate}}'}</code>
                  <span>Current date</span>
                </div>
                <div className="variable-item">
                  <code>{'{{currentYear}}'}</code>
                  <span>Current year</span>
                </div>
              </div>
            </div>

            <div className="template-actions">
              {editing && (
                <button 
                  onClick={onCancel}
                  className="reporting-btn reporting-btn--secondary"
                  disabled={saving}
                >
                  <FaTimes /> Cancel
                </button>
              )}
              <button 
                onClick={handleSave} 
                disabled={saving}
                className="reporting-btn reporting-btn--gold"
              >
                <FaSave /> {saving ? 'Saving...' : (editing ? 'Update Template' : 'Create Template')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailTemplateEditor;