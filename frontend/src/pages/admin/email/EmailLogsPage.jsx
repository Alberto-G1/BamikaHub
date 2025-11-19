import React, { useState, useEffect } from 'react';
import adminApi from '../../../api/adminApi';

const EmailLogsPage = () => {
    const [messages, setMessages] = useState([]);
    const [selected, setSelected] = useState(null);
    const [recipients, setRecipients] = useState([]);

    useEffect(() => { fetchLogs(); }, []);

    const fetchLogs = async () => {
        const res = await adminApi.get('/admin/email/messages');
        setMessages(res.data);
    }

    const loadRecipients = async (id) => {
        const res = await adminApi.get(`/admin/email/messages/${id}/recipients`);
        setRecipients(res.data);
        setSelected(id);
    }

    return (
        <div>
            <h2>Email Logs</h2>
            <div style={{display: 'flex', gap: '20px'}}>
                <div style={{flex: 1}}>
                    <h3>Messages</h3>
                    <ul>
                        {messages.map(m => (
                            <li key={m.id}>
                                <b>{m.subject}</b> - {m.recipientsCsv}
                                <button onClick={() => loadRecipients(m.id)}>View recipients</button>
                            </li>
                        ))}
                    </ul>
                </div>
                <div style={{flex: 1}}>
                    <h3>Recipients</h3>
                    {selected ? (
                        <ul>
                            {recipients.map(r => (
                                <li key={r.id}>{r.recipientEmail} - {r.status} {r.errorMessage ? `(${r.errorMessage})` : ''}</li>
                            ))}
                        </ul>
                    ) : <div>Select a message to view recipients</div>}
                </div>
            </div>
        </div>
    );
}

export default EmailLogsPage;
