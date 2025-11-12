import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import guestApi from '../../api/guestApi.js';
import './GuestSelfService.css';

const defaultForm = {
    fullName: '',
    email: '',
    phoneNumber: '',
    companyName: '',
    category: ''
};

const GuestRegistrationPage = () => {
    const [form, setForm] = useState(defaultForm);
    const [submitting, setSubmitting] = useState(false);
    const [tokenPreview, setTokenPreview] = useState(null);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setForm((previous) => ({ ...previous, [name]: value }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSubmitting(true);
        try {
            await guestApi.post('/public/guest/register', form);
            const { data } = await guestApi.post('/public/guest/magic-link', { email: form.email });
            setTokenPreview(data?.token ?? null);
            toast.success('Account created! Check your email for the login link.');
            setForm(defaultForm);
        } catch (error) {
            const message = error.validation?.message || error.response?.data?.message || 'Unable to create account';
            toast.error(message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <section className="guest-self-wrapper">
            <div className="guest-self-card">
                <h1>Create Your Guest Account</h1>
                <p>Register to manage your support tickets, chat with our team, and track progress in one place.</p>

                <form className="guest-self-form" onSubmit={handleSubmit}>
                    <label>
                        Full Name
                        <input name="fullName" type="text" value={form.fullName} onChange={handleChange} required />
                    </label>
                    <label>
                        Business Email
                        <input name="email" type="email" value={form.email} onChange={handleChange} required />
                    </label>
                    <label>
                        Phone Number
                        <input name="phoneNumber" type="tel" value={form.phoneNumber} onChange={handleChange} required />
                    </label>
                    <label>
                        Company (optional)
                        <input name="companyName" type="text" value={form.companyName} onChange={handleChange} />
                    </label>
                    <label>
                        Category (optional)
                        <input name="category" type="text" value={form.category} onChange={handleChange} />
                    </label>

                    <div className="guest-self-actions">
                        <button type="submit" className="guest-self-primary" disabled={submitting}>
                            {submitting ? 'Submitting…' : 'Create Account'}
                        </button>
                        <Link className="guest-self-secondary" to="/guest/magic-link">Already registered? Request a magic link</Link>
                    </div>
                </form>

                {tokenPreview && (
                    <div className="guest-token-box">
                        <strong>Developer token:</strong> {tokenPreview}
                    </div>
                )}

                <p className="guest-self-note">We send a secure login link to your email. No passwords to remember!</p>
            </div>
        </section>
    );
};

export default GuestRegistrationPage;
