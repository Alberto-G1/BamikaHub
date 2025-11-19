import React, { useState, useEffect } from 'react';
import adminApi from '../../../api/adminApi';

const EmailComposerPage = () => {
    const [emailsInput, setEmailsInput] = useState('');
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [attachmentPaths, setAttachmentPaths] = useState([]);
    const [uploadProgress, setUploadProgress] = useState(null);
    const [templates, setTemplates] = useState([]);
    const [templateId, setTemplateId] = useState(null);
    // templateVars as array of {key, value}
    const [templateVars, setTemplateVars] = useState([]);
    const [previewHtml, setPreviewHtml] = useState(null);
    const [users, setUsers] = useState([]);
    const [selectedUserIds, setSelectedUserIds] = useState([]);

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
            setUploadProgress('Uploaded');
        } catch (err) {
            console.error(err);
            setUploadProgress('Failed');
        }
    }

    useEffect(() => {
        const loadTemplates = async () => {
            try {
                const res = await adminApi.get('/admin/email/templates');
                setTemplates(res.data);
            } catch (err) {
                console.error(err);
            }
        }
        loadTemplates();
        // load users for variable auto-fill
        const loadUsers = async () => {
            try {
                const r = await adminApi.get('/users');
                setUsers(r.data || []);
            } catch (err) {
                console.error('Failed to load users', err);
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
        try {
            const varsObj = templateVars.reduce((acc, kv) => {
                if (kv.key) acc[kv.key] = kv.value;
                return acc;
            }, {});
            const res = await adminApi.post('/admin/email/templates/send', { templateId: templateId, templateVars: varsObj, body: body, preview: true });
            setPreviewHtml(res.data.previewHtml || res.data);
        } catch (err) {
            console.error(err);
            alert('Failed to load preview; ensure variables are valid');
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
                templateId: templateId,
                templateVars: varsObj,
                userIds: selectedUserIds
            };
            await adminApi.post('/admin/email/templates/send', request);
            alert('Emails sent');
            setEmailsInput('');
            setSubject('');
            setBody('');
            setAttachmentPaths([]);
        } catch (err) {
            console.error(err);
            alert('Failed to send emails');
        }
    }

    const handleUserSelection = async (selectedIds) => {
        setSelectedUserIds(selectedIds);
        if (!selectedIds || selectedIds.length === 0) return;
        try {
            const res = await adminApi.post('/admin/email/templates/variables', selectedIds);
            // if merged present and non-empty, prefill templateVars
            const merged = res.data.merged || {};
            if (Object.keys(merged).length > 0) {
                const kvs = Object.keys(merged).map(k => ({ key: k, value: merged[k] }));
                setTemplateVars(kvs);
            }
        } catch (err) {
            console.error('Failed to fetch user variables', err);
        }
    }

    return (
        <div className="email-composer">
            <h2>Send Admin Email</h2>
            <div>
                <div>
                    <label>Template</label>
                    <select value={templateId || ''} onChange={(e) => handleTemplateChange(e.target.value)}>
                        <option value="">(none)</option>
                        {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                </div>
                <label>Emails (comma-separated)</label>
                <input value={emailsInput} onChange={(e) => setEmailsInput(e.target.value)} />
            </div>
            <div>
                <label>Subject</label>
                <input value={subject} onChange={(e) => setSubject(e.target.value)} />
            </div>
            <div>
                <label>Body (HTML allowed)</label>
                <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={8}></textarea>
            </div>
            <div>
                <label>Users (select to auto-fill variables)</label>
                <select multiple value={selectedUserIds} onChange={(e) => {
                    const opts = Array.from(e.target.selectedOptions).map(o => Number(o.value));
                    handleUserSelection(opts);
                }}>
                    {users.map(u => <option key={u.id} value={u.id}>{u.fullName || u.username || u.email}</option>)}
                </select>

                <label>Template variables</label>
                <div>
                    {templateVars.map((kv, idx) => (
                        <div key={idx} style={{display:'flex',gap:8,marginBottom:6}}>
                            <input placeholder="key" value={kv.key} onChange={(e)=>{
                                const arr = [...templateVars]; arr[idx].key = e.target.value; setTemplateVars(arr);
                            }} />
                            <input placeholder="value" value={kv.value} onChange={(e)=>{
                                const arr = [...templateVars]; arr[idx].value = e.target.value; setTemplateVars(arr);
                            }} />
                            <button onClick={()=>{ setTemplateVars(templateVars.filter((_,i)=>i!==idx)) }}>Remove</button>
                        </div>
                    ))}
                    <button onClick={()=> setTemplateVars([...templateVars, {key:'', value:''}])}>Add variable</button>
                </div>
                <div style={{marginTop:8}}>
                    <button onClick={handlePreview}>Preview</button>
                    {previewHtml && <div style={{border: '1px solid #ddd', padding: '10px', marginTop: '10px'}} dangerouslySetInnerHTML={{__html: previewHtml}}></div>}
                </div>
            </div>
            <div>
                <label>Attachments</label>
                <input type="file" onChange={handleUpload} />
                {uploadProgress && <small>{uploadProgress}</small>}
                <ul>
                    {attachmentPaths.map((p, i) => <li key={i}>{p}</li>)}
                </ul>
            </div>
            <div>
                <button onClick={handleSend}>Send</button>
            </div>
        </div>
    );
}

export default EmailComposerPage;
