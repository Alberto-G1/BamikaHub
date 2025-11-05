import React, { useState, useEffect, useRef } from 'react';
import { Spinner } from 'react-bootstrap';
import api from '../../api/api.js';
import { toast } from 'react-toastify';
import { FaCalendarAlt, FaEnvelope, FaGlobe, FaMapMarkerAlt, FaPhoneAlt, FaUserCircle, FaUserShield } from 'react-icons/fa';
import './ProfilePage.css';

const ProfilePage = () => {
    const [loading, setLoading] = useState(true);
    const [profileData, setProfileData] = useState({});
    const [uploading, setUploading] = useState(false);
    const [activeTab, setActiveTab] = useState('info');
    
    // Create a ref to the hidden file input element
    const fileInputRef = useRef(null);

    // Form state for editable profile fields
    const [formData, setFormData] = useState({
        firstName: '', lastName: '', gender: '', dateOfBirth: '',
        phoneNumber: '', address: '', city: '', country: ''
    });

    // Form state for password change fields
    const [passwordData, setPasswordData] = useState({
        currentPassword: '', newPassword: '', confirmPassword: ''
    });

    useEffect(() => {
        const fetchProfile = async () => {
            setLoading(true);
            try {
                const res = await api.get('/profile/me');
                setProfileData(res.data);
                // Populate the editable form state
                setFormData({
                    firstName: res.data.firstName || '',
                    lastName: res.data.lastName || '',
                    gender: res.data.gender || '',
                    dateOfBirth: res.data.dateOfBirth || '',
                    phoneNumber: res.data.phoneNumber || '',
                    address: res.data.address || '',
                    city: res.data.city || '',
                    country: res.data.country || '',
                });
            } catch (error) {
                toast.error('Could not load profile data.');
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

        // Function to trigger the hidden file input
    const handlePictureButtonClick = () => {
        fileInputRef.current.click();
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Client-side validation
        if (file.size > 2 * 1024 * 1024) {
            toast.error("File is too large! Maximum size is 2MB.");
            return;
        }
        if (file.type !== 'image/jpeg' && file.type !== 'image/png') {
            toast.error("Invalid file type! Only JPG and PNG are allowed.");
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        setUploading(true);
        try {
            const res = await api.post('/profile/me/picture', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            // Update the profile data with the new URL from the backend
            setProfileData(prev => ({ ...prev, profilePictureUrl: res.data.profilePictureUrl }));
            toast.success("Profile picture updated successfully!");
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to upload picture.");
        } finally {
            setUploading(false);
        }
    };

    const handleFormChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        try {
            const res = await api.put('/profile/me', formData);
            setProfileData(res.data); // Update the main data display
            toast.success('Profile updated successfully!');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update profile.');
        }
    };

    const handlePasswordFormChange = (e) => {
        setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    };
    
    const handlePasswordChange = async (e) => {
        e.preventDefault();
        // UPDATED: Read from the state object
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error("New passwords do not match.");
            return;
        }
        try {
            // UPDATED: Create payload from the state object
            const payload = { 
                currentPassword: passwordData.currentPassword, 
                newPassword: passwordData.newPassword 
            };
            const res = await api.post('/profile/change-password', payload);
            toast.success(res.data);
            
            // UPDATED: Reset the state object
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to change password.');
        }
    };

    if (loading) {
        return (
            <div className="profile-loading">
                <Spinner animation="border" role="status" />
            </div>
        );
    }

    const formatValue = (value, fallback = 'Not provided') => (value ? value : fallback);
    const formatDate = (value) => {
        if (!value) return '';
        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) {
            return value;
        }
        return parsed.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    };
    const genderMap = { MALE: 'Male', FEMALE: 'Female', OTHER: 'Other' };

    const fullName = [profileData.firstName, profileData.lastName].filter(Boolean).join(' ') || 'Your Profile';
    const roleLabel = profileData.roleName || 'Team Member';
    const locationLabel = [formData.city, formData.country].filter(Boolean).join(', ');
    const bannerSubtitle = locationLabel || formData.address || 'Add your location to complete your profile.';
    const joinedAt = profileData.createdAt ? new Date(profileData.createdAt).toLocaleDateString() : '—';
    const genderDisplay = formData.gender ? genderMap[formData.gender] || formData.gender : '';

    const bannerMetrics = [
        {
            label: 'Email',
            value: formatValue(profileData.email),
            icon: FaEnvelope,
            modifier: 'profile-banner__meta-icon--teal'
        },
        {
            label: 'Phone',
            value: formatValue(formData.phoneNumber),
            icon: FaPhoneAlt,
            modifier: 'profile-banner__meta-icon--gold'
        },
        {
            label: 'Joined',
            value: joinedAt,
            icon: FaCalendarAlt,
            modifier: 'profile-banner__meta-icon--purple'
        },
        {
            label: 'Location',
            value: locationLabel || 'Add your location',
            icon: FaMapMarkerAlt,
            modifier: 'profile-banner__meta-icon--teal'
        }
    ];

    return (
        <section className="profile-page">
            <div className="profile-banner">
                <div className="profile-banner__header">
                    <div className="profile-banner__avatar">
                        <div className="profile-avatar-wrapper">
                            {uploading && (
                                <div className="profile-avatar-overlay">
                                    <Spinner animation="border" variant="light" />
                                </div>
                            )}

                            {profileData.profilePictureUrl ? (
                                <img
                                    src={`http://localhost:8080${profileData.profilePictureUrl}`}
                                    alt={`${fullName}'s profile`}
                                    className="profile-avatar-image"
                                />
                            ) : (
                                <FaUserCircle className="profile-avatar-placeholder" />
                            )}
                        </div>

                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/png, image/jpeg"
                            style={{ display: 'none' }}
                        />

                        <span className="profile-chip">{roleLabel}</span>
                    </div>

                    <div className="profile-banner__info">
                        <span className="profile-banner__eyebrow">
                            <FaUserShield aria-hidden="true" />
                            Account Presence
                        </span>
                        <h1 className="profile-banner__title">{fullName}</h1>
                        <p className="profile-banner__subtitle">{bannerSubtitle}</p>
                    </div>

                    <div className="profile-banner__actions">
                        <button
                            type="button"
                            className="profile-secondary-btn"
                            onClick={handlePictureButtonClick}
                            disabled={uploading}
                        >
                            {uploading ? 'Uploading…' : 'Change Photo'}
                        </button>
                        <button
                            type="button"
                            className="profile-secondary-btn"
                            onClick={() => setActiveTab('info')}
                        >
                            Manage Details
                        </button>
                    </div>
                </div>

                <div className="profile-banner__meta">
                    {bannerMetrics.map(metric => {
                        const MetricIcon = metric.icon;
                        return (
                            <div key={metric.label} className="profile-banner__meta-item">
                                <div className={`profile-banner__meta-icon ${metric.modifier}`} aria-hidden="true">
                                    <MetricIcon />
                                </div>
                                <div className="profile-banner__meta-content">
                                    <span className="profile-banner__meta-label">{metric.label}</span>
                                    <span className="profile-banner__meta-value">{metric.value}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="profile-body">
                <div className="profile-column profile-column--left">
                    <div className="profile-card">
                        <h3>Profile Snapshot</h3>
                        <p className="profile-card__lead">
                            Keep your personal details up to date so the team can reach you when it matters most.
                        </p>

                        <div className="profile-info-grid">
                            <div className="info-item">
                                <span className="info-label">Address</span>
                                <span className="info-value">{formatValue(formData.address)}</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">City</span>
                                <span className="info-value">{formatValue(formData.city)}</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Country</span>
                                <span className="info-value">{formatValue(formData.country)}</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Date of Birth</span>
                                <span className="info-value">{formatValue(formatDate(formData.dateOfBirth), '—')}</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Gender</span>
                                <span className="info-value">{formatValue(genderDisplay)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="profile-card profile-card--secondary">
                        <h3>Security Reminders</h3>
                        <ul className="profile-tip-list">
                            <li>Use at least 8 characters with symbols, numbers, and mixed case.</li>
                            <li>Update your password regularly and avoid reusing old ones.</li>
                            <li>Enable multi-factor authentication once available.</li>
                        </ul>
                    </div>
                </div>

                <div className="profile-column profile-column--right">
                    <div className="profile-card profile-card--form">
                        <div className="profile-tabs">
                            <button
                                type="button"
                                className={`profile-tab-btn ${activeTab === 'info' ? 'is-active' : ''}`}
                                onClick={() => setActiveTab('info')}
                            >
                                Profile Information
                            </button>
                            <button
                                type="button"
                                className={`profile-tab-btn ${activeTab === 'security' ? 'is-active' : ''}`}
                                onClick={() => setActiveTab('security')}
                            >
                                Security
                            </button>
                        </div>

                        <div className="profile-tab-panels">
                            {activeTab === 'info' && (
                                <form className="profile-form" onSubmit={handleProfileUpdate}>
                                    <div className="profile-form-grid">
                                        <div className="profile-input-group">
                                            <label htmlFor="firstName">First Name</label>
                                            <input
                                                id="firstName"
                                                name="firstName"
                                                type="text"
                                                value={formData.firstName}
                                                onChange={handleFormChange}
                                                required
                                                autoComplete="given-name"
                                            />
                                        </div>
                                        <div className="profile-input-group">
                                            <label htmlFor="lastName">Last Name</label>
                                            <input
                                                id="lastName"
                                                name="lastName"
                                                type="text"
                                                value={formData.lastName}
                                                onChange={handleFormChange}
                                                required
                                                autoComplete="family-name"
                                            />
                                        </div>
                                        <div className="profile-input-group">
                                            <label htmlFor="email">Email</label>
                                            <input
                                                id="email"
                                                name="email"
                                                type="email"
                                                value={profileData.email || ''}
                                                readOnly
                                            />
                                        </div>
                                        <div className="profile-input-group">
                                            <label htmlFor="phoneNumber">Phone Number</label>
                                            <input
                                                id="phoneNumber"
                                                name="phoneNumber"
                                                type="tel"
                                                value={formData.phoneNumber}
                                                onChange={handleFormChange}
                                                placeholder="+256700123456"
                                                autoComplete="tel"
                                            />
                                        </div>
                                        <div className="profile-input-group">
                                            <label htmlFor="dateOfBirth">Date of Birth</label>
                                            <input
                                                id="dateOfBirth"
                                                name="dateOfBirth"
                                                type="date"
                                                value={formData.dateOfBirth}
                                                onChange={handleFormChange}
                                            />
                                        </div>
                                        <div className="profile-input-group">
                                            <label htmlFor="gender">Gender</label>
                                            <select
                                                id="gender"
                                                name="gender"
                                                value={formData.gender}
                                                onChange={handleFormChange}
                                            >
                                                <option value="">Select...</option>
                                                <option value="MALE">Male</option>
                                                <option value="FEMALE">Female</option>
                                                <option value="OTHER">Other</option>
                                            </select>
                                        </div>
                                        <div className="profile-input-group profile-input-group--full">
                                            <label htmlFor="address">Address</label>
                                            <input
                                                id="address"
                                                name="address"
                                                type="text"
                                                value={formData.address}
                                                onChange={handleFormChange}
                                                autoComplete="street-address"
                                            />
                                        </div>
                                        <div className="profile-input-group">
                                            <label htmlFor="city">City</label>
                                            <input
                                                id="city"
                                                name="city"
                                                type="text"
                                                value={formData.city}
                                                onChange={handleFormChange}
                                                autoComplete="address-level2"
                                            />
                                        </div>
                                        <div className="profile-input-group">
                                            <label htmlFor="country">Country</label>
                                            <input
                                                id="country"
                                                name="country"
                                                type="text"
                                                value={formData.country}
                                                onChange={handleFormChange}
                                                autoComplete="country-name"
                                            />
                                        </div>
                                    </div>

                                    <div className="profile-form-actions">
                                        <button type="submit" className="profile-primary-btn">
                                            Save Changes
                                        </button>
                                    </div>
                                </form>
                            )}

                            {activeTab === 'security' && (
                                <form className="profile-form" onSubmit={handlePasswordChange}>
                                    <div className="profile-form-grid">
                                        <div className="profile-input-group profile-input-group--full">
                                            <label htmlFor="currentPassword">Current Password</label>
                                            <input
                                                id="currentPassword"
                                                name="currentPassword"
                                                type="password"
                                                value={passwordData.currentPassword}
                                                onChange={handlePasswordFormChange}
                                                required
                                                autoComplete="current-password"
                                            />
                                        </div>
                                        <div className="profile-input-group profile-input-group--full">
                                            <label htmlFor="newPassword">New Password</label>
                                            <input
                                                id="newPassword"
                                                name="newPassword"
                                                type="password"
                                                value={passwordData.newPassword}
                                                onChange={handlePasswordFormChange}
                                                required
                                                autoComplete="new-password"
                                            />
                                        </div>
                                        <div className="profile-input-group profile-input-group--full">
                                            <label htmlFor="confirmPassword">Confirm New Password</label>
                                            <input
                                                id="confirmPassword"
                                                name="confirmPassword"
                                                type="password"
                                                value={passwordData.confirmPassword}
                                                onChange={handlePasswordFormChange}
                                                required
                                                autoComplete="new-password"
                                            />
                                        </div>
                                    </div>

                                    <div className="profile-form-actions">
                                        <button type="submit" className="profile-primary-btn">
                                            Update Password
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ProfilePage;