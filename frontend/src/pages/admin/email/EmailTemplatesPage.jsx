import React, { useState } from 'react';
import { FaEnvelope, FaPlus, FaEdit, FaTrash, FaEye, FaCode, FaSave, FaTimes } from 'react-icons/fa';
import EmailTemplatesList from './EmailTemplatesList';
import EmailTemplateEditor from './EmailTemplateEditor';
import './EmailTemplates.css';

const EmailTemplatesPage = () => {
    const [tab, setTab] = useState('list'); // 'list' or 'create'
    const [editing, setEditing] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);

    const handleSaved = () => {
        setTab('list');
        setEditing(null);
        setRefreshKey(k => k + 1);
    };

    const handleEdit = (template) => {
        setEditing(template);
        setTab('create');
    };

    return (
        <section className="reporting-page">
            <div className="reporting-banner" data-animate="fade-up">
                <div className="reporting-banner__content">
                    <div className="reporting-banner__info">
                        <span className="reporting-banner__eyebrow">
                            <FaEnvelope /> Communication
                        </span>
                        <h1 className="reporting-banner__title">Email Templates</h1>
                        <p className="reporting-banner__subtitle">
                            Create and manage email templates for automated communications. 
                            Use Thymeleaf syntax for dynamic content and personalization.
                        </p>
                    </div>
                </div>
            </div>

            <div className="reporting-tabs" data-animate="fade-up" data-delay="0.04">
                <button
                    className={`reporting-tab ${tab === 'list' ? 'is-active' : ''}`}
                    onClick={() => { setTab('list'); setEditing(null); }}
                >
                    <FaEnvelope /> Template Library
                </button>
                <button
                    className={`reporting-tab ${tab === 'create' ? 'is-active' : ''}`}
                    onClick={() => { setTab('create'); setEditing(null); }}
                >
                    <FaPlus /> {editing ? 'Edit Template' : 'Create Template'}
                </button>
            </div>

            <div className="email-templates-content">
                {tab === 'create' ? (
                    <EmailTemplateEditor 
                        editing={editing} 
                        onSaved={handleSaved} 
                        onCancel={() => { setEditing(null); setTab('list'); }} 
                    />
                ) : (
                    <EmailTemplatesList key={refreshKey} onEdit={handleEdit} />
                )}
            </div>
        </section>
    );
};

export default EmailTemplatesPage;