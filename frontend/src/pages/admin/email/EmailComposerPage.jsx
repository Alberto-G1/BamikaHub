import React, { useState, useEffect } from 'react';
import { FaPaperPlane, FaEye, FaPlus, FaTrash, FaUpload, FaEnvelope, FaUser, FaFileAlt, FaCode } from 'react-icons/fa';
import adminApi from '../../../api/adminApi';
import api from '../../../api/api';
import { toast } from 'react-toastify';
import './EmailComposer.css';

const EmailComposerPage = () => {
    const [emailsInput, setEmailsInput] = useState('');
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [attachmentPaths, setAttachmentPaths] = useState([]);
    const [uploadProgress, setUploadProgress] = useState(null);
    const [templates, setTemplates] = useState([]);
    const [templateId, setTemplateId] = useState(null);
    const [templateVars, setTemplateVars] = useState([]);
    const [previewHtml, setPreviewHtml] = useState(null);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [users, setUsers] = useState([]);
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [activeTab, setActiveTab] = useState('compose');

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const form = new FormData();
        form.append('file', file);
        try {
            setUploadProgress('Uploading...');
            const res = await adminApi.post('/admin/email/attachments', form, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setAttachmentPaths((prev) => [...prev, res.data.path]);
            setUploadProgress('Uploaded successfully');
            toast.success('Attachment uploaded successfully');
        } catch (err) {
            console.error(err);
            setUploadProgress('Upload failed');
            toast.error('Failed to upload attachment');
        }
    }

    useEffect(() => {
        const loadTemplates = async () => {
            try {
                const res = await adminApi.get('/admin/email/templates');
                setTemplates(res.data);
            } catch (err) {
                console.error(err);
                toast.error('Failed to load email templates');
            }
        }
        loadTemplates();
        
        const loadUsers = async () => {
            try {
                const r = await api.get('/users');
                setUsers(r.data || []);
            } catch (err) {
                console.error('Failed to load users', err);
                toast.error('Failed to load users');
            }
        }
        loadUsers();
    }, []);

    const handleTemplateChange = (id) => {
        setTemplateId(id);
        const t = templates.find(x => x.id === Number(id));
        if (t) {
            setSubject(t.subject);
            setBody(t.body);
        }
    }

    const handlePreview = async () => {
        setPreviewLoading(true);
        try {
            const varsObj = templateVars.reduce((acc, kv) => {
                if (kv.key) acc[kv.key] = kv.value;
                return acc;
            }, {});
            const payload = {
                templateId: templateId ? Number(templateId) : null,
                templateVars: varsObj,
                body: body,
                preview: true
            };
            if (selectedUserId) payload.userIds = [selectedUserId];
            const res = await adminApi.post('/admin/email/templates/send', payload);
            const html = (res && res.data && (res.data.previewHtml || (typeof res.data === 'string' ? res.data : null)));
            setPreviewHtml(html || '');
            setActiveTab('preview');
            toast.success('Preview generated successfully');
        } catch (err) {
            console.error('Preview error', err?.response || err);
            const serverMessage = err?.response?.data || err.message || 'Unknown error';
            toast.error(typeof serverMessage === 'string' ? serverMessage : JSON.stringify(serverMessage));
            setPreviewHtml(null);
        } finally {
            setPreviewLoading(false);
        }
    }

    const handleSend = async () => {
        try {
            const varsObj = templateVars.reduce((acc, kv) => { if (kv.key) acc[kv.key] = kv.value; return acc; }, {});
            const request = {
                emails: emailsInput.split(',').map(s => s.trim()).filter(Boolean),
                subject,
                body,
                attachmentPaths,
                templateId: templateId ? Number(templateId) : null,
                templateVars: varsObj,
                userIds: selectedUserId ? [selectedUserId] : []
            };
            await adminApi.post('/admin/email/templates/send', request);
            toast.success('Emails sent successfully!');
            // Reset form
            setEmailsInput('');
            setSubject('');
            setBody('');
            setAttachmentPaths([]);
            setTemplateId(null);
            setTemplateVars([]);
            setPreviewHtml(null);
            setSelectedUserId(null);
        } catch (err) {
            console.error(err);
            toast.error('Failed to send emails');
        }
    }

    const handleUserSelection = async (userId) => {
        setSelectedUserId(userId);
        if (!userId) {
            setTemplateVars([]);
            return;
        }
        try {
            const res = await adminApi.post('/admin/email/templates/variables', [userId]);
            const merged = res.data.merged || {};
            if (Object.keys(merged).length > 0) {
                const kvs = Object.keys(merged).map(k => ({ key: k, value: merged[k] }));
                setTemplateVars(kvs);
                toast.success('User variables loaded successfully');
            }
        } catch (err) {
            console.error('Failed to fetch user variables', err);
            toast.error('Failed to load user variables');
        }
    }

    const removeAttachment = (index) => {
        setAttachmentPaths(prev => prev.filter((_, i) => i !== index));
        toast.info('Attachment removed');
    }

    return (
        <section className="reporting-page">
            <div className="reporting-banner" data-animate="fade-up">
                <div className="reporting-banner__content">
                    <div className="reporting-banner__info">
                        <span className="reporting-banner__eyebrow">
                            <FaEnvelope /> Communication
                        </span>
                        <h1 className="reporting-banner__title">Email Composer</h1>
                        <p className="reporting-banner__subtitle">
                            Create and send professional emails to users. Use templates, 
                            personalize content, and preview before sending.
                        </p>
                    </div>
                </div>
            </div>

            <div className="reporting-tabs" data-animate="fade-up" data-delay="0.04">
                <button
                    className={`reporting-tab ${activeTab === 'compose' ? 'is-active' : ''}`}
                    onClick={() => setActiveTab('compose')}
                >
                    <FaEnvelope /> Compose Email
                </button>
                <button
                    className={`reporting-tab ${activeTab === 'preview' ? 'is-active' : ''}`}
                    onClick={() => setActiveTab('preview')}
                    disabled={!previewHtml}
                >
                    <FaEye /> Preview
                </button>
            </div>

            <div className="email-composer-content">
                {activeTab === 'compose' && (
                    <div className="email-composer-grid" data-animate="fade-up" data-delay="0.08">
                        {/* Template Selection */}
                        <div className="reporting-card">
                            <div className="reporting-card__header">
                                <div>
                                    <h2 className="reporting-card__title">Template Selection</h2>
                                    <p className="reporting-card__subtitle">Choose from pre-designed email templates</p>
                                </div>
                            </div>
                            <div className="reporting-card__content">
                                <div className="reporting-form-group">
                                    <label className="reporting-form-label">Email Template</label>
                                    <select 
                                        value={templateId || ''} 
                                        onChange={(e) => handleTemplateChange(e.target.value)}
                                        className="reporting-select"
                                    >
                                        <option value="">(Start from scratch)</option>
                                        {templates.map(t => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Recipients */}
                        <div className="reporting-card">
                            <div className="reporting-card__header">
                                <div>
                                    <h2 className="reporting-card__title">Recipients</h2>
                                    <p className="reporting-card__subtitle">Specify who should receive this email</p>
                                </div>
                            </div>
                            <div className="reporting-card__content">
                                <div className="reporting-form-group">
                                    <label className="reporting-form-label">Email Addresses</label>
                                    <input 
                                        value={emailsInput} 
                                        onChange={(e) => setEmailsInput(e.target.value)}
                                        className="reporting-input"
                                        placeholder="Enter comma-separated email addresses..."
                                    />
                                    <small className="reporting-form-help">
                                        Separate multiple emails with commas
                                    </small>
                                </div>
                                
                                <div className="reporting-form-group">
                                    <label className="reporting-form-label">Select User</label>
                                    <select 
                                        value={selectedUserId || ''} 
                                        onChange={(e) => {
                                            const id = e.target.value ? Number(e.target.value) : null;
                                            handleUserSelection(id);
                                        }}
                                        className="reporting-select"
                                    >
                                        <option value="">(Select user for auto-fill)</option>
                                        {users.map(u => (
                                            <option key={u.id} value={u.id}>
                                                {u.fullName || u.username || u.email}
                                            </option>
                                        ))}
                                    </select>
                                    <small className="reporting-form-help">
                                        Select a user to auto-fill template variables
                                    </small>
                                </div>
                            </div>
                        </div>

                        {/* Email Content */}
                        <div className="reporting-card">
                            <div className="reporting-card__header">
                                <div>
                                    <h2 className="reporting-card__title">Email Content</h2>
                                    <p className="reporting-card__subtitle">Compose your email message</p>
                                </div>
                            </div>
                            <div className="reporting-card__content">
                                <div className="reporting-form-group">
                                    <label className="reporting-form-label">Subject</label>
                                    <input 
                                        value={subject} 
                                        onChange={(e) => setSubject(e.target.value)}
                                        className="reporting-input"
                                        placeholder="Enter email subject..."
                                    />
                                </div>
                                
                                <div className="reporting-form-group">
                                    <label className="reporting-form-label">Body Content</label>
                                    <textarea 
                                        value={body} 
                                        onChange={(e) => setBody(e.target.value)}
                                        className="reporting-textarea"
                                        rows={12}
                                        placeholder="Compose your email message here. HTML is supported..."
                                    />
                                    <small className="reporting-form-help">
                                        HTML tags are supported for rich formatting
                                    </small>
                                </div>
                            </div>
                        </div>

                        {/* Template Variables */}
                        <div className="reporting-card">
                            <div className="reporting-card__header">
                                <div>
                                    <h2 className="reporting-card__title">
                                        <FaCode /> Template Variables
                                    </h2>
                                    <p className="reporting-card__subtitle">Personalize email content with variables</p>
                                </div>
                            </div>
                            <div className="reporting-card__content">
                                <div className="template-variables">
                                    {templateVars.map((kv, idx) => (
                                        <div key={idx} className="template-variable-item">
                                            <input 
                                                placeholder="Variable key" 
                                                value={kv.key} 
                                                onChange={(e) => {
                                                    const arr = [...templateVars]; 
                                                    arr[idx].key = e.target.value; 
                                                    setTemplateVars(arr);
                                                }}
                                                className="reporting-input"
                                            />
                                            <input 
                                                placeholder="Variable value" 
                                                value={kv.value} 
                                                onChange={(e) => {
                                                    const arr = [...templateVars]; 
                                                    arr[idx].value = e.target.value; 
                                                    setTemplateVars(arr);
                                                }}
                                                className="reporting-input"
                                            />
                                            <button 
                                                onClick={() => setTemplateVars(templateVars.filter((_, i) => i !== idx))}
                                                className="reporting-btn reporting-btn--danger reporting-btn--sm"
                                            >
                                                <FaTrash />
                                            </button>
                                        </div>
                                    ))}
                                    
                                    {templateVars.length === 0 && (
                                        <div className="reporting-empty-state">
                                            <p>No template variables added. Select a user or add variables manually.</p>
                                        </div>
                                    )}
                                    
                                    <button 
                                        onClick={() => setTemplateVars([...templateVars, {key: '', value: ''}])}
                                        className="reporting-btn reporting-btn--secondary"
                                    >
                                        <FaPlus /> Add Variable
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Attachments */}
                        <div className="reporting-card">
                            <div className="reporting-card__header">
                                <div>
                                    <h2 className="reporting-card__title">
                                        <FaFileAlt /> Attachments
                                    </h2>
                                    <p className="reporting-card__subtitle">Add files to your email</p>
                                </div>
                            </div>
                            <div className="reporting-card__content">
                                <div className="file-upload-section">
                                    <div className="file-upload-wrapper">
                                        <input 
                                            type="file" 
                                            onChange={handleUpload} 
                                            id="file-upload"
                                            className="file-upload-input"
                                        />
                                        <label htmlFor="file-upload" className="reporting-btn reporting-btn--secondary">
                                            <FaUpload /> Choose File
                                        </label>
                                        {uploadProgress && (
                                            <span className="upload-progress">{uploadProgress}</span>
                                        )}
                                    </div>
                                    
                                    {attachmentPaths.length > 0 && (
                                        <div className="attachments-list">
                                            <h4>Attached Files:</h4>
                                            {attachmentPaths.map((p, i) => (
                                                <div key={i} className="attachment-item">
                                                    <span className="attachment-name">{p}</span>
                                                    <button 
                                                        onClick={() => removeAttachment(i)}
                                                        className="reporting-btn reporting-btn--danger reporting-btn--sm"
                                                    >
                                                        <FaTrash />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="reporting-card">
                            <div className="reporting-card__content">
                                <div className="email-composer-actions">
                                    <button 
                                        onClick={handlePreview}
                                        disabled={previewLoading}
                                        className="reporting-btn reporting-btn--secondary"
                                    >
                                        <FaEye /> {previewLoading ? 'Generating Preview...' : 'Preview Email'}
                                    </button>
                                    <button 
                                        onClick={handleSend}
                                        className="reporting-btn reporting-btn--gold"
                                    >
                                        <FaPaperPlane /> Send Email
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'preview' && previewHtml && (
                    <div className="reporting-card" data-animate="fade-up">
                        <div className="reporting-card__header">
                            <div>
                                <h2 className="reporting-card__title">Email Preview</h2>
                                <p className="reporting-card__subtitle">Review your email before sending</p>
                            </div>
                            <button 
                                onClick={() => setActiveTab('compose')}
                                className="reporting-btn reporting-btn--secondary"
                            >
                                Back to Compose
                            </button>
                        </div>
                        <div className="reporting-card__content">
                            <div className="email-preview-container">
                                <div 
                                    className="email-preview-content"
                                    dangerouslySetInnerHTML={{ __html: previewHtml }}
                                />
                            </div>
                            <div className="preview-actions">
                                <button 
                                    onClick={() => setActiveTab('compose')}
                                    className="reporting-btn reporting-btn--secondary"
                                >
                                    Back to Compose
                                </button>
                                <button 
                                    onClick={handleSend}
                                    className="reporting-btn reporting-btn--gold"
                                >
                                    <FaPaperPlane /> Send Email
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}

export default EmailComposerPage;