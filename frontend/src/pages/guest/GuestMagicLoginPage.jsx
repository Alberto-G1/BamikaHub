import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import guestApi from '../../api/guestApi.js';
import { useGuestAuth } from '../../context/GuestAuthContext.jsx';
import './GuestSelfService.css';

const GuestMagicLoginPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { loginGuest } = useGuestAuth();
    const [tokenInput, setTokenInput] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const token = params.get('token');
        if (token) {
            setTokenInput(token);
            handleVerification(token);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleVerification = async (tokenValue) => {
        setSubmitting(true);
        try {
            const { data } = await guestApi.post('/public/guest/magic-link/verify', { token: tokenValue });
            loginGuest(data.token, data.guest, data.expiresAt);
            toast.success('Welcome back!');
            navigate('/guest/portal', { replace: true });
        } catch (error) {
            const message = error.validation?.message || error.response?.data?.message || 'Login link invalid or expired';
            toast.error(message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        if (!tokenInput.trim()) {
            toast.warn('Enter your login token first');
            return;
        }
        handleVerification(tokenInput.trim());
    };

    return (
        <section className="guest-self-wrapper">
            <div className="guest-self-card">
                <h1>Complete Your Login</h1>
                <p>Paste your magic link token or follow the link from your inbox.</p>
                <form className="guest-self-form" onSubmit={handleSubmit}>
                    <label>
                        Magic Token
                        <textarea rows="3" value={tokenInput} onChange={(event) => setTokenInput(event.target.value)} placeholder="Paste your token here" />
                    </label>
                    <div className="guest-self-actions">
                        <button type="submit" className="guest-self-primary" disabled={submitting}>
                            {submitting ? 'Verifying…' : 'Verify & Sign In'}
                        </button>
                    </div>
                </form>
                <p className="guest-self-note">Tokens expire after 30 minutes. Request a new one if needed.</p>
            </div>
        </section>
    );
};

export default GuestMagicLoginPage;
