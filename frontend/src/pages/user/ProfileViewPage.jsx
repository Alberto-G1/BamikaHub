import React, { useState, useEffect } from 'react';
import { Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FaEdit, FaUserCircle } from 'react-icons/fa';
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
    const joinedOn = formatDate(profile.joinedOn, '—');
    const genderDisplay = profile.gender ? genderMap[profile.gender] || profile.gender : 'Not provided';

    return (
        <section className="profile-page">
            <div className="profile-banner">
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

                    <button
                        type="button"
                        className="profile-secondary-btn"
                        onClick={() => navigate('/profile/edit')}
                    >
                        <FaEdit style={{ marginRight: '0.5rem' }} /> Edit Profile
                    </button>
                </div>

                <div className="profile-banner__text">
                    <span className="profile-chip">{roleLabel}</span>
                    <h1>{fullName}</h1>
                    <p className="profile-banner__subtitle">
                        {locationLabel || formatValue(profile.address, 'Add your location to complete your profile.')}
                    </p>

                    <div className="profile-banner__meta">
                        <div className="meta-item">
                            <span className="meta-label">Email</span>
                            <span className="meta-value">{formatValue(profile.email)}</span>
                        </div>
                        <div className="meta-item">
                            <span className="meta-label">Phone</span>
                            <span className="meta-value">{formatValue(profile.phoneNumber)}</span>
                        </div>
                        <div className="meta-item">
                            <span className="meta-label">Joined</span>
                            <span className="meta-value">{joinedOn}</span>
                        </div>
                    </div>
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

                        <div className="profile-banner__actions">
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