import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import guestApi from '../../api/guestApi.js';
import './GuestSelfService.css';

const GuestMagicLinkRequestPage = () => {
    const [email, setEmail] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [tokenPreview, setTokenPreview] = useState(null);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSubmitting(true);
        try {
            const { data } = await guestApi.post('/public/guest/magic-link', { email });
            setTokenPreview(data?.token ?? null);
            toast.success('Magic link sent!');
            setEmail('');
        } catch (error) {
            const message = error.validation?.message || error.response?.data?.message || 'Unable to send magic link';
            toast.error(message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <section className="guest-self-wrapper">
            <div className="guest-self-card">
                <h1>Sign In With a Magic Link</h1>
                <p>Enter your email and we&apos;ll send you a secure link to access your guest portal.</p>

                <form className="guest-self-form" onSubmit={handleSubmit}>
                    <label>
                        Email Address
                        <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
                    </label>
                    <div className="guest-self-actions">
                        <button type="submit" className="guest-self-primary" disabled={submitting}>
                            {submitting ? 'Sending…' : 'Send Magic Link'}
                        </button>
                        <Link className="guest-self-secondary" to="/guest/register">Need an account? Register here</Link>
                    </div>
                </form>

                {tokenPreview && (
                    <div className="guest-token-box">
                        <strong>Developer token:</strong> {tokenPreview}
                    </div>
                )}

                <p className="guest-self-note">The link expires after 30 minutes. Request a new one anytime.</p>
                <div className="guest-self-links">
                    <Link to="/guest/magic-login">Have a token? Complete login</Link>
                    <span> · </span>
                    <Link to="/login">Back to staff sign in</Link>
                    <span> · </span>
                    <Link to="/register">Staff registration</Link>
                </div>
            </div>
        </section>
    );
};

export default GuestMagicLinkRequestPage;
