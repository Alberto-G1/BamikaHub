import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCalendarAlt, FaEnvelope, FaMapMarkerAlt, FaPhoneAlt, FaUserCircle, FaUserShield, FaUserTag, FaArrowLeft, FaSave, FaKey } from 'react-icons/fa';
import api from '../../api/api.js';
import { toast } from 'react-toastify';
import './ProfilePage.css';

const ProfileEditPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [profileData, setProfileData] = useState({});

    const [formData, setFormData] = useState({
        firstName: '', lastName: '', gender: '', dateOfBirth: '',
        phoneNumber: '', address: '', city: '', country: ''
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: '', newPassword: '', confirmPassword: ''
    });
    const [activeTab, setActiveTab] = useState('info');

    const fileInputRef = useRef(null);

    useEffect(() => {
        const fetchProfile = async () => {
            setLoading(true);
            try {
                const res = await api.get('/profile/me');
                setProfileData(res.data);
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
                toast.error('Could not load profile data for editing.');
                navigate('/profile');
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [navigate]);

    const handleFormChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        try {
            const res = await api.put('/profile/me', formData);
            setProfileData(res.data);
            toast.success('Profile updated successfully!');
            navigate('/profile');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update profile.');
        }
    };

    const handlePasswordFormChange = (e) => {
        setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error("New passwords do not match.");
            return;
        }
        try {
            const payload = { currentPassword: passwordData.currentPassword, newPassword: passwordData.newPassword };
            const res = await api.post('/profile/change-password', payload);
            toast.success(res.data);
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to change password.');
        }
    };

    const handlePictureButtonClick = () => {
        fileInputRef.current.click();
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            toast.error("File is too large! Maximum size is 2MB.");
            return;
        }
        if (file.type !== 'image/jpeg' && file.type !== 'image/png') {
            toast.error("Invalid file type! Only JPG and PNG are allowed.");
            return;
        }

        const apiFormData = new FormData();
        apiFormData.append('file', file);

        setUploading(true);
        try {
            const res = await api.post('/profile/me/picture', apiFormData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setProfileData((prev) => ({ ...prev, profilePictureUrl: res.data.profilePictureUrl }));
            toast.success("Profile picture updated successfully!");
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to upload picture.");
        } finally {
            setUploading(false);
        }
    };

    if (loading) {
        return (
            <div className="reporting-loading">
                <div className="reporting-spinner" />
                <p>Loading profile editor...</p>
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

    const fullName = [formData.firstName, formData.lastName].filter(Boolean).join(' ') || 'Update Profile';
    const roleLabel = profileData.roleName || 'Team Member';
    const locationLabel = [formData.city, formData.country].filter(Boolean).join(', ');
    const bannerSubtitle = locationLabel || formData.address || 'Review and update your information below.';
    const genderDisplay = formData.gender ? genderMap[formData.gender] || formData.gender : '';
    const joinedAt = profileData.createdAt ? formatDate(profileData.createdAt) : '—';

    const bannerMetrics = [
        {
            label: 'Email',
            value: formatValue(profileData.email),
            icon: FaEnvelope,
            accent: 'blue'
        },
        {
            label: 'Contact',
            value: formatValue(formData.phoneNumber),
            icon: FaPhoneAlt,
            accent: 'gold'
        },
        {
            label: 'Role',
            value: roleLabel,
            icon: FaUserTag,
            accent: 'purple'
        },
        {
            label: 'Joined',
            value: joinedAt,
            icon: FaCalendarAlt,
            accent: 'green'
        },
        {
            label: 'Location',
            value: locationLabel || formatValue(formData.address),
            icon: FaMapMarkerAlt,
            accent: 'red'
        }
    ];

    return (
        <section className="reporting-page">
            <div className="reporting-back" data-animate="fade-up">
                <button
                    type="button"
                    className="reporting-btn reporting-btn--secondary reporting-btn--sm"
                    onClick={() => navigate('/profile')}
                >
                    <FaArrowLeft /> Back to Profile
                </button>
                <p className="reporting-back__title">User Profile • Editor</p>
            </div>

            <div className="reporting-banner" data-animate="fade-up" data-delay="0.04">
                <div className="reporting-banner__content">
                    <div className="profile-banner__avatar">
                        <div className="profile-avatar-wrapper">
                            {uploading && (
                                <div className="profile-avatar-overlay">
                                    <div className="reporting-spinner" />
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

                        <span className="reporting-badge reporting-badge--info">{roleLabel}</span>
                    </div>

                    <div className="reporting-banner__info">
                        <span className="reporting-banner__eyebrow">
                            <FaUserShield /> Profile Editor
                        </span>
                        <h1 className="reporting-banner__title">{fullName}</h1>
                        <p className="reporting-banner__subtitle">{bannerSubtitle}</p>
                    </div>

                    <div className="reporting-banner__actions">
                        <button
                            type="button"
                            className="reporting-btn reporting-btn--secondary"
                            onClick={handlePictureButtonClick}
                            disabled={uploading}
                        >
                            {uploading ? 'Uploading…' : 'Change Photo'}
                        </button>
                        <button
                            type="button"
                            className="reporting-btn reporting-btn--secondary"
                            onClick={() => navigate('/profile')}
                        >
                            Cancel &amp; Go Back
                        </button>
                    </div>
                </div>

                <div className="reporting-banner__meta">
                    {bannerMetrics.map((metric, index) => (
                        <div key={metric.label} className="reporting-banner__meta-item" data-animate="fade-up" data-delay={0.08 + (index * 0.04)}>
                            <div className={`reporting-banner__meta-icon reporting-banner__meta-icon--${metric.accent}`}>
                                <metric.icon />
                            </div>
                            <div className="reporting-banner__meta-content">
                                <span className="reporting-banner__meta-label">{metric.label}</span>
                                <span className="reporting-banner__meta-value">{metric.value}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="profile-content">
                <div className="profile-grid" data-animate="fade-up" data-delay="0.12">
                    {/* Current Snapshot */}
                    <div className="reporting-card reporting-card--stretch">
                        <div className="reporting-card__header">
                            <div>
                                <h2 className="reporting-card__title">Current Snapshot</h2>
                                <p className="reporting-card__subtitle">Your current profile information</p>
                            </div>
                        </div>
                        <div className="reporting-card__content">
                            <div className="profile-info-grid">
                                <div className="profile-info-item">
                                    <span className="profile-info-label">Address</span>
                                    <span className="profile-info-value">{formatValue(formData.address)}</span>
                                </div>
                                <div className="profile-info-item">
                                    <span className="profile-info-label">City</span>
                                    <span className="profile-info-value">{formatValue(formData.city)}</span>
                                </div>
                                <div className="profile-info-item">
                                    <span className="profile-info-label">Country</span>
                                    <span className="profile-info-value">{formatValue(formData.country)}</span>
                                </div>
                                <div className="profile-info-item">
                                    <span className="profile-info-label">Date of Birth</span>
                                    <span className="profile-info-value">{formatValue(formatDate(formData.dateOfBirth), '—')}</span>
                                </div>
                                <div className="profile-info-item">
                                    <span className="profile-info-label">Gender</span>
                                    <span className="profile-info-value">{formatValue(genderDisplay)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Edit Form */}
                    <div className="reporting-card">
                        <div className="reporting-card__header">
                            <div>
                                <h2 className="reporting-card__title">Edit Profile</h2>
                                <p className="reporting-card__subtitle">Update your personal information</p>
                            </div>
                        </div>
                        <div className="reporting-card__content">
                            <div className="reporting-tabs">
                                <button
                                    className={`reporting-tab ${activeTab === 'info' ? 'is-active' : ''}`}
                                    onClick={() => setActiveTab('info')}
                                >
                                    <FaUserShield /> Personal Information
                                </button>
                                <button
                                    className={`reporting-tab ${activeTab === 'security' ? 'is-active' : ''}`}
                                    onClick={() => setActiveTab('security')}
                                >
                                    <FaKey /> Security
                                </button>
                            </div>

                            <div className="profile-tab-content">
                                {activeTab === 'info' && (
                                    <form className="profile-form" onSubmit={handleProfileUpdate}>
                                        <div className="reporting-filters__grid">
                                            <div className="reporting-form-group">
                                                <label className="reporting-form-label">First Name *</label>
                                                <input
                                                    name="firstName"
                                                    type="text"
                                                    value={formData.firstName}
                                                    onChange={handleFormChange}
                                                    required
                                                    autoComplete="given-name"
                                                    className="reporting-input"
                                                />
                                            </div>
                                            <div className="reporting-form-group">
                                                <label className="reporting-form-label">Last Name *</label>
                                                <input
                                                    name="lastName"
                                                    type="text"
                                                    value={formData.lastName}
                                                    onChange={handleFormChange}
                                                    required
                                                    autoComplete="family-name"
                                                    className="reporting-input"
                                                />
                                            </div>
                                            <div className="reporting-form-group">
                                                <label className="reporting-form-label">Phone Number</label>
                                                <input
                                                    name="phoneNumber"
                                                    type="tel"
                                                    value={formData.phoneNumber}
                                                    onChange={handleFormChange}
                                                    placeholder="+256700123456"
                                                    autoComplete="tel"
                                                    className="reporting-input"
                                                />
                                            </div>
                                            <div className="reporting-form-group">
                                                <label className="reporting-form-label">Date of Birth</label>
                                                <input
                                                    name="dateOfBirth"
                                                    type="date"
                                                    value={formData.dateOfBirth}
                                                    onChange={handleFormChange}
                                                    className="reporting-input"
                                                />
                                            </div>
                                            <div className="reporting-form-group">
                                                <label className="reporting-form-label">Gender</label>
                                                <select
                                                    name="gender"
                                                    value={formData.gender}
                                                    onChange={handleFormChange}
                                                    className="reporting-select"
                                                >
                                                    <option value="">Select...</option>
                                                    <option value="MALE">Male</option>
                                                    <option value="FEMALE">Female</option>
                                                    <option value="OTHER">Other</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="reporting-form-group">
                                            <label className="reporting-form-label">Address</label>
                                            <input
                                                name="address"
                                                type="text"
                                                value={formData.address}
                                                onChange={handleFormChange}
                                                autoComplete="street-address"
                                                className="reporting-input"
                                            />
                                        </div>
                                        <div className="reporting-filters__grid">
                                            <div className="reporting-form-group">
                                                <label className="reporting-form-label">City</label>
                                                <input
                                                    name="city"
                                                    type="text"
                                                    value={formData.city}
                                                    onChange={handleFormChange}
                                                    autoComplete="address-level2"
                                                    className="reporting-input"
                                                />
                                            </div>
                                            <div className="reporting-form-group">
                                                <label className="reporting-form-label">Country</label>
                                                <input
                                                    name="country"
                                                    type="text"
                                                    value={formData.country}
                                                    onChange={handleFormChange}
                                                    autoComplete="country-name"
                                                    className="reporting-input"
                                                />
                                            </div>
                                        </div>
                                        <div className="profile-form-actions">
                                            <button
                                                type="button"
                                                className="reporting-btn reporting-btn--secondary"
                                                onClick={() => navigate('/profile')}
                                            >
                                                Cancel
                                            </button>
                                            <button type="submit" className="reporting-btn reporting-btn--gold">
                                                <FaSave /> Save Changes
                                            </button>
                                        </div>
                                    </form>
                                )}

                                {activeTab === 'security' && (
                                    <form className="profile-form" onSubmit={handlePasswordChange}>
                                        <div className="reporting-form-group">
                                            <label className="reporting-form-label">Current Password *</label>
                                            <input
                                                name="currentPassword"
                                                type="password"
                                                value={passwordData.currentPassword}
                                                onChange={handlePasswordFormChange}
                                                required
                                                autoComplete="current-password"
                                                className="reporting-input"
                                            />
                                        </div>
                                        <div className="reporting-form-group">
                                            <label className="reporting-form-label">New Password *</label>
                                            <input
                                                name="newPassword"
                                                type="password"
                                                value={passwordData.newPassword}
                                                onChange={handlePasswordFormChange}
                                                required
                                                autoComplete="new-password"
                                                className="reporting-input"
                                            />
                                        </div>
                                        <div className="reporting-form-group">
                                            <label className="reporting-form-label">Confirm New Password *</label>
                                            <input
                                                name="confirmPassword"
                                                type="password"
                                                value={passwordData.confirmPassword}
                                                onChange={handlePasswordFormChange}
                                                required
                                                autoComplete="new-password"
                                                className="reporting-input"
                                            />
                                        </div>
                                        <div className="profile-form-actions">
                                            <button
                                                type="button"
                                                className="reporting-btn reporting-btn--secondary"
                                                onClick={() => navigate('/profile')}
                                            >
                                                Cancel
                                            </button>
                                            <button type="submit" className="reporting-btn reporting-btn--gold">
                                                <FaKey /> Update Password
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ProfileEditPage;