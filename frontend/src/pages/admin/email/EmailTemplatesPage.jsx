import React, { useState, useEffect } from 'react';
import adminApi from '../../../api/adminApi';

const EmailTemplatesPage = () => {
    const [templates, setTemplates] = useState([]);
    const [editing, setEditing] = useState(null);
    const [name, setName] = useState('');
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        const res = await adminApi.get('/admin/email/templates');
        setTemplates(res.data);
    }

    const handleSave = async () => {
        const payload = { name, subject, body };
        if (editing) {
            await adminApi.put(`/admin/email/templates/${editing.id}`, payload);
            setEditing(null);
        } else {
            await adminApi.post(`/admin/email/templates`, payload);
        }
        setName(''); setSubject(''); setBody('');
        await fetchTemplates();
    }

    const editTemplate = (t) => { setEditing(t); setName(t.name); setSubject(t.subject); setBody(t.body); }
    const deleteTemplate = async (t) => { await adminApi.delete(`/admin/email/templates/${t.id}`); await fetchTemplates(); }

    return (
        <div>
            <h2>Email Templates</h2>
            <div>
                <label>Name</label>
                <input value={name} onChange={e => setName(e.target.value)} />
                <label>Subject</label>
                <input value={subject} onChange={e => setSubject(e.target.value)} />
                <label>Body (Thymeleaf HTML)</label>
                <textarea value={body} onChange={e => setBody(e.target.value)} rows={6}></textarea>
                <button onClick={handleSave}>{editing ? 'Save' : 'Create'}</button>
                {editing && <button onClick={() => { setEditing(null); setName(''); setSubject(''); setBody(''); }}>Cancel</button>}
            </div>
            <div>
                <h3>Existing Templates</h3>
                <ul>
                    {templates.map(t => (
                        <li key={t.id}>
                            <b>{t.name}</b> - {t.subject}
                            <button onClick={() => editTemplate(t)}>Edit</button>
                            <button onClick={() => deleteTemplate(t)}>Delete</button>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

export default EmailTemplatesPage;
