import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCalendarAlt, FaEdit, FaEnvelope, FaMapMarkerAlt, FaPhoneAlt, FaUserCircle, FaUserShield, FaUserTag, FaArrowLeft } from 'react-icons/fa';
import api from '../../api/api.js';
import { toast } from 'react-toastify';
import './ProfilePage.css';

const ProfileViewPage = () => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProfile = async () => {
            setLoading(true);
            try {
                const res = await api.get('/profile/me');
                setProfile(res.data);
            } catch (error) {
                toast.error('Could not load profile data.');
                navigate('/dashboard');
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [navigate]);

    if (loading) {
        return (
            <div className="reporting-loading">
                <div className="reporting-spinner" />
                <p>Loading profile...</p>
            </div>
        );
    }

    if (!profile) {
        return (
            <section className="reporting-page">
                <div className="reporting-empty-state">
                    <p>Could not load profile.</p>
                </div>
            </section>
        );
    }

    const formatValue = (value, fallback = 'Not provided') => (value ? value : fallback);
    const formatDate = (value, fallback = 'Not provided') => {
        if (!value) return fallback;
        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) {
            return value;
        }
        return parsed.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    };
    const genderMap = { MALE: 'Male', FEMALE: 'Female', OTHER: 'Other' };

    const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(' ') || 'My Profile';
    const roleLabel = profile.roleName || 'Team Member';
    const locationLabel = [profile.city, profile.country].filter(Boolean).join(', ');
    const bannerSubtitle = locationLabel || formatValue(profile.address, 'Add your location to complete your profile.');
    const joinedOn = formatDate(profile.createdAt || profile.joinedOn, '—');
    const genderDisplay = profile.gender ? genderMap[profile.gender] || profile.gender : 'Not provided';

    const bannerMetrics = [
        {
            label: 'Email',
            value: formatValue(profile.email),
            icon: FaEnvelope,
            accent: 'blue'
        },
        {
            label: 'Contact',
            value: formatValue(profile.phoneNumber),
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
            value: joinedOn,
            icon: FaCalendarAlt,
            accent: 'green'
        },
        {
            label: 'Location',
            value: locationLabel || formatValue(profile.address),
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
                    onClick={() => navigate('/dashboard')}
                >
                    <FaArrowLeft /> Back to Dashboard
                </button>
                <p className="reporting-back__title">User Profile • Overview</p>
            </div>

            <div className="reporting-banner" data-animate="fade-up" data-delay="0.04">
                <div className="reporting-banner__content">
                    <div className="profile-banner__avatar">
                        <div className="profile-avatar-wrapper">
                            {profile.profilePictureUrl ? (
                                <img
                                    src={`http://localhost:8080${profile.profilePictureUrl}`}
                                    alt={`${fullName}'s profile`}
                                    className="profile-avatar-image"
                                />
                            ) : (
                                <FaUserCircle className="profile-avatar-placeholder" />
                            )}
                        </div>
                        <span className="reporting-badge reporting-badge--info">{roleLabel}</span>
                    </div>

                    <div className="reporting-banner__info">
                        <span className="reporting-banner__eyebrow">
                            <FaUserShield /> Profile Overview
                        </span>
                        <h1 className="reporting-banner__title">{fullName}</h1>
                        <p className="reporting-banner__subtitle">{bannerSubtitle}</p>
                    </div>

                    <div className="reporting-banner__actions">
                        <button
                            type="button"
                            className="reporting-btn reporting-btn--secondary"
                            onClick={() => navigate('/dashboard')}
                        >
                            Go to Dashboard
                        </button>
                        <button
                            type="button"
                            className="reporting-btn reporting-btn--gold"
                            onClick={() => navigate('/profile/edit')}
                        >
                            <FaEdit /> Edit Profile
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
                    {/* Identity Card */}
                    <div className="reporting-card reporting-card--stretch">
                        <div className="reporting-card__header">
                            <div>
                                <h2 className="reporting-card__title">Identity Information</h2>
                                <p className="reporting-card__subtitle">Personal details and identification</p>
                            </div>
                        </div>
                        <div className="reporting-card__content">
                            <div className="profile-info-grid">
                                <div className="profile-info-item">
                                    <span className="profile-info-label">Full Name</span>
                                    <span className="profile-info-value">{fullName}</span>
                                </div>
                                <div className="profile-info-item">
                                    <span className="profile-info-label">Username</span>
                                    <span className="profile-info-value">{formatValue(profile.username)}</span>
                                </div>
                                <div className="profile-info-item">
                                    <span className="profile-info-label">Gender</span>
                                    <span className="profile-info-value">{genderDisplay}</span>
                                </div>
                                <div className="profile-info-item">
                                    <span className="profile-info-label">Date of Birth</span>
                                    <span className="profile-info-value">{formatDate(profile.dateOfBirth, 'Not provided')}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contact Information */}
                    <div className="reporting-card reporting-card--stretch">
                        <div className="reporting-card__header">
                            <div>
                                <h2 className="reporting-card__title">Contact Information</h2>
                                <p className="reporting-card__subtitle">Address and location details</p>
                            </div>
                        </div>
                        <div className="reporting-card__content">
                            <div className="profile-detail-list">
                                <div className="profile-detail-item">
                                    <span className="profile-detail-label">Address</span>
                                    <span className="profile-detail-value">{formatValue(profile.address)}</span>
                                </div>
                                <div className="profile-detail-item">
                                    <span className="profile-detail-label">City</span>
                                    <span className="profile-detail-value">{formatValue(profile.city)}</span>
                                </div>
                                <div className="profile-detail-item">
                                    <span className="profile-detail-label">Country</span>
                                    <span className="profile-detail-value">{formatValue(profile.country)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Account Overview */}
                    <div className="reporting-card">
                        <div className="reporting-card__header">
                            <div>
                                <h2 className="reporting-card__title">Account Overview</h2>
                                <p className="reporting-card__subtitle">Account status and metadata</p>
                            </div>
                        </div>
                        <div className="reporting-card__content">
                            <div className="profile-detail-list">
                                <div className="profile-detail-item">
                                    <span className="profile-detail-label">Status</span>
                                    <span className="profile-detail-value">{formatValue(profile.statusName)}</span>
                                </div>
                                <div className="profile-detail-item">
                                    <span className="profile-detail-label">Role</span>
                                    <span className="profile-detail-value">{roleLabel}</span>
                                </div>
                                <div className="profile-detail-item">
                                    <span className="profile-detail-label">Last Updated</span>
                                    <span className="profile-detail-value">{formatDate(profile.updatedAt, '—')}</span>
                                </div>
                            </div>
                            <div className="profile-card-actions">
                                <button
                                    type="button"
                                    className="reporting-btn reporting-btn--gold"
                                    onClick={() => navigate('/profile/edit')}
                                >
                                    Update Details
                                </button>
                                <button
                                    type="button"
                                    className="reporting-btn reporting-btn--secondary"
                                    onClick={() => navigate('/dashboard')}
                                >
                                    Go to Dashboard
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ProfileViewPage;