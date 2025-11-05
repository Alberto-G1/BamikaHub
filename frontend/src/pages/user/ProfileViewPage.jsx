import React, { useState, useEffect } from 'react';
import { Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FaCalendarAlt, FaEdit, FaEnvelope, FaMapMarkerAlt, FaPhoneAlt, FaUserCircle, FaUserShield, FaUserTag } from 'react-icons/fa';
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
                navigate('/dashboard'); // Redirect if profile can't be loaded
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [navigate]);

    if (loading) {
        return (
            <div className="profile-loading">
                <Spinner animation="border" role="status" />
            </div>
        );
    }

    if (!profile) {
        return <section className="profile-page"><p>Could not load profile.</p></section>;
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
            modifier: 'profile-banner__meta-icon--teal'
        },
        {
            label: 'Contact',
            value: formatValue(profile.phoneNumber),
            icon: FaPhoneAlt,
            modifier: 'profile-banner__meta-icon--gold'
        },
        {
            label: 'Role',
            value: roleLabel,
            icon: FaUserTag,
            modifier: 'profile-banner__meta-icon--purple'
        },
        {
            label: 'Joined',
            value: joinedOn,
            icon: FaCalendarAlt,
            modifier: 'profile-banner__meta-icon--teal'
        },
        {
            label: 'Location',
            value: locationLabel || formatValue(profile.address),
            icon: FaMapMarkerAlt,
            modifier: 'profile-banner__meta-icon--gold'
        }
    ];

    return (
        <section className="profile-page">
            <div className="profile-banner">
                <div className="profile-banner__header">
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

                        <span className="profile-chip">{roleLabel}</span>
                    </div>

                    <div className="profile-banner__info">
                        <span className="profile-banner__eyebrow">
                            <FaUserShield aria-hidden="true" />
                            Profile Overview
                        </span>
                        <h1 className="profile-banner__title">{fullName}</h1>
                        <p className="profile-banner__subtitle">{bannerSubtitle}</p>
                    </div>

                    <div className="profile-banner__actions">
                        <button
                            type="button"
                            className="profile-secondary-btn"
                            onClick={() => navigate('/dashboard')}
                        >
                            Go to Dashboard
                        </button>
                        <button
                            type="button"
                            className="profile-primary-btn"
                            onClick={() => navigate('/profile/edit')}
                        >
                            <FaEdit aria-hidden="true" />
                            Edit Profile
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
                        <h3>Identity</h3>
                        <div className="profile-info-grid">
                            <div className="info-item">
                                <span className="info-label">Full Name</span>
                                <span className="info-value">{fullName}</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Username</span>
                                <span className="info-value">{formatValue(profile.username)}</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Gender</span>
                                <span className="info-value">{genderDisplay}</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Date of Birth</span>
                                <span className="info-value">{formatDate(profile.dateOfBirth, 'Not provided')}</span>
                            </div>
                        </div>
                    </div>

                    <div className="profile-card profile-card--secondary">
                        <h3>Contact Information</h3>
                        <ul className="profile-detail-list">
                            <li>
                                <span className="profile-detail-key">Address</span>
                                <span className="profile-detail-value">{formatValue(profile.address)}</span>
                            </li>
                            <li>
                                <span className="profile-detail-key">City</span>
                                <span className="profile-detail-value">{formatValue(profile.city)}</span>
                            </li>
                            <li>
                                <span className="profile-detail-key">Country</span>
                                <span className="profile-detail-value">{formatValue(profile.country)}</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="profile-column profile-column--right">
                    <div className="profile-card">
                        <h3>Account Overview</h3>
                        <ul className="profile-detail-list">
                            <li>
                                <span className="profile-detail-key">Status</span>
                                <span className="profile-detail-value">{formatValue(profile.statusName)}</span>
                            </li>
                            <li>
                                <span className="profile-detail-key">Role</span>
                                <span className="profile-detail-value">{roleLabel}</span>
                            </li>
                            <li>
                                <span className="profile-detail-key">Last Updated</span>
                                <span className="profile-detail-value">{formatDate(profile.updatedAt, '—')}</span>
                            </li>
                        </ul>

                        <div className="profile-card__actions">
                            <button
                                type="button"
                                className="profile-primary-btn"
                                onClick={() => navigate('/profile/edit')}
                            >
                                Update Details
                            </button>
                            <button
                                type="button"
                                className="profile-secondary-btn"
                                onClick={() => navigate('/dashboard')}
                            >
                                Go to Dashboard
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ProfileViewPage;