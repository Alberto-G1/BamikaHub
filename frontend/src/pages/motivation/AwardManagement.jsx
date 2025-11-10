import React, { useState, useEffect } from 'react';
import { FaTrophy, FaPlus, FaEdit, FaTrash, FaImage, FaTimes, FaUser, FaCalendar, FaStar, FaCrown } from 'react-icons/fa';
import api from '../../api/api.js';
import { toast } from 'react-toastify';
import './AwardManagement.css';

export default function AwardManagement() {
  const [awards, setAwards] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAward, setEditingAward] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    userId: '',
    achievementTitle: '',
    achievementDescription: '',
    badges: '',
    priority: 0,
    awardDate: '',
    expiresAt: '',
    image: null
  });

  useEffect(() => {
    fetchAwards();
    fetchUsers();
  }, []);

  const fetchAwards = async () => {
    try {
      setLoading(true);
      const response = await api.get('/motivation/awards');
      setAwards(response.data);
    } catch (error) {
      toast.error('Failed to load awards');
      console.error('Error fetching awards:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, image: file }));
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const openCreateModal = () => {
    setEditingAward(null);
    setFormData({
      userId: '',
      achievementTitle: '',
      achievementDescription: '',
      badges: '',
      priority: 0,
      awardDate: new Date().toISOString().split('T')[0],
      expiresAt: '',
      image: null
    });
    setImagePreview(null);
    setShowModal(true);
  };

  const openEditModal = (award) => {
    setEditingAward(award);
    setFormData({
      userId: award.userId,
      achievementTitle: award.achievementTitle,
      achievementDescription: award.achievementDescription,
      badges: (award.badges && award.badges.length > 0) ? award.badges[0] : '',
      priority: award.priority || 0,
      awardDate: award.awardDate?.split('T')[0] || '',
      expiresAt: award.expiresAt?.split('T')[0] || '',
      image: null
    });
    
    // Fix image preview URL
    const backendURL = 'http://localhost:8080';
    let imageUrl = award.displayImageUrl || award.profilePictureUrl;
    if (imageUrl && imageUrl.startsWith('/uploads/')) {
      imageUrl = backendURL + imageUrl;
    }
    setImagePreview(imageUrl);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingAward(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.userId || !formData.achievementTitle) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      setSubmitting(true);
      const formDataToSend = new FormData();
      
      // Create award DTO object
      const awardDTO = {
        userId: parseInt(formData.userId),
        achievementTitle: formData.achievementTitle,
        achievementDescription: formData.achievementDescription || 'Outstanding achievement',
        badges: formData.badges ? [formData.badges] : [], // Convert to array
        priority: parseInt(formData.priority),
        awardDate: formData.awardDate ? `${formData.awardDate}T00:00:00` : null,
        expiresAt: formData.expiresAt ? `${formData.expiresAt}T23:59:59` : null
      };
      
      formDataToSend.append('award', new Blob([JSON.stringify(awardDTO)], { type: 'application/json' }));
      
      if (formData.image) {
        formDataToSend.append('image', formData.image);
      }

      if (editingAward) {
        await api.put(`/motivation/awards/${editingAward.id}`, formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Award updated successfully');
      } else {
        await api.post('/motivation/awards', formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Award created successfully');
      }

      closeModal();
      fetchAwards();
    } catch (error) {
      toast.error(editingAward ? 'Failed to update award' : 'Failed to create award');
      console.error('Error saving award:', error);
      console.error('Error response:', error.response?.data);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (awardId) => {
    if (!window.confirm('Are you sure you want to delete this award?')) return;

    try {
      await api.delete(`/motivation/awards/${awardId}`);
      toast.success('Award deleted successfully');
      fetchAwards();
    } catch (error) {
      toast.error('Failed to delete award');
      console.error('Error deleting award:', error);
    }
  };

  const badgeOptions = [
    { value: 'star', label: '⭐ Star Performer', icon: FaStar },
    { value: 'crown', label: '👑 Top Achiever', icon: FaCrown },
    { value: 'gold', label: '🥇 Gold Medal', icon: FaTrophy },
    { value: 'silver', label: '🥈 Silver Medal', icon: FaTrophy },
    { value: 'bronze', label: '🥉 Bronze Medal', icon: FaTrophy },
    { value: 'medal', label: '🏅 Medal of Honor', icon: FaTrophy },
    { value: 'trophy', label: '🏆 Championship Trophy', icon: FaTrophy },
    { value: 'sparkle', label: '🌟 Excellence Award', icon: FaStar }
  ];

  const getImageUrl = (award) => {
    const backendURL = 'http://localhost:8080';
    const imageUrl = award.displayImageUrl || award.profilePictureUrl;
    
    if (imageUrl && imageUrl.startsWith('/uploads/')) {
      return backendURL + imageUrl;
    }
    
    return imageUrl || '/placeholder.jpg';
  };

  const getBadgeIcon = (badgeValue) => {
    const badge = badgeOptions.find(b => b.value === badgeValue);
    return badge ? badge.icon : FaTrophy;
  };

  if (loading) {
    return (
      <section className="reporting-page">
        <div className="reporting-loading">
          <div className="reporting-spinner" />
          <p className="reporting-card__subtitle">Loading awards...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="reporting-page">
      {/* Header */}
      <div className="reporting-back" data-animate="fade-up">
        <p className="reporting-back__title">Recognition • Award Management</p>
      </div>

      {/* Banner */}
      <div className="reporting-banner reporting-banner--compact" data-animate="fade-up" data-delay="0.04">
        <div className="reporting-banner__content">
          <div className="reporting-banner__info">
            <span className="reporting-banner__eyebrow">
              <FaTrophy /> Wall of Fame
            </span>
            <h1 className="reporting-banner__title">Award Management</h1>
            <p className="reporting-banner__subtitle">
              Create and manage Wall of Fame awards for outstanding employees
            </p>
          </div>
          <div className="reporting-banner__actions">
            <button 
              className="reporting-btn reporting-btn--gold"
              onClick={openCreateModal}
            >
              <FaPlus /> Create New Award
            </button>
          </div>
        </div>

        {/* Statistics */}
        <div className="reporting-banner__meta">
          <div className="reporting-banner__meta-item">
            <div className="reporting-banner__meta-icon reporting-banner__meta-icon--gold">
              <FaTrophy />
            </div>
            <div className="reporting-banner__meta-content">
              <span className="reporting-banner__meta-label">Total Awards</span>
              <span className="reporting-banner__meta-value">{awards.length}</span>
            </div>
          </div>
          <div className="reporting-banner__meta-item">
            <div className="reporting-banner__meta-icon reporting-banner__meta-icon--blue">
              <FaUser />
            </div>
            <div className="reporting-banner__meta-content">
              <span className="reporting-banner__meta-label">Unique Recipients</span>
              <span className="reporting-banner__meta-value">
                {new Set(awards.map(a => a.userId)).size}
              </span>
            </div>
          </div>
          <div className="reporting-banner__meta-item">
            <div className="reporting-banner__meta-icon reporting-banner__meta-icon--green">
              <FaStar />
            </div>
            <div className="reporting-banner__meta-content">
              <span className="reporting-banner__meta-label">Active Badges</span>
              <span className="reporting-banner__meta-value">
                {awards.filter(a => a.badges && a.badges.length > 0).length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Awards Grid */}
      <div className="reporting-grid" data-animate="fade-up" data-delay="0.08">
        {awards.length === 0 ? (
          <div className="reporting-card">
            <div className="reporting-empty-state">
              <FaTrophy className="empty-icon" />
              <h3>No Awards Created Yet</h3>
              <p>Click "Create New Award" to recognize outstanding employees and build your Wall of Fame.</p>
              <button 
                className="reporting-btn reporting-btn--gold"
                onClick={openCreateModal}
              >
                <FaPlus /> Create Your First Award
              </button>
            </div>
          </div>
        ) : (
          awards.map((award) => {
            const BadgeIcon = award.badges && award.badges.length > 0 ? getBadgeIcon(award.badges[0]) : FaTrophy;
            const badgeOption = badgeOptions.find(b => b.value === award.badges?.[0]);
            
            return (
              <div 
                key={award.id} 
                className="reporting-card reporting-card--interactive reporting-report-card--gold"
                onClick={() => openEditModal(award)}
              >
                <div className="award-card-header">
                  <div className="award-avatar">
                    <img 
                      src={getImageUrl(award)} 
                      alt={award.userName}
                      className="award-avatar-img"
                    />
                    {badgeOption && (
                      <div className="award-badge-icon">
                        <BadgeIcon />
                      </div>
                    )}
                  </div>
                  <div className="award-header-content">
                    <h3 className="reporting-report-card__title">{award.userName}</h3>
                    <p className="reporting-report-card__description">{award.achievementTitle}</p>
                  </div>
                </div>

                <div className="reporting-card__content">
                  <p className="award-description">{award.achievementDescription}</p>
                  
                  <div className="award-meta-grid">
                    <div className="award-meta-item">
                      <FaStar className="meta-icon" />
                      <span>Priority: {award.priority}</span>
                    </div>
                    {award.awardDate && (
                      <div className="award-meta-item">
                        <FaCalendar className="meta-icon" />
                        <span>{new Date(award.awardDate).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>

                  {badgeOption && (
                    <div className="award-badge-display">
                      <span className="reporting-badge reporting-badge--info">
                        {badgeOption.label}
                      </span>
                    </div>
                  )}
                </div>

                <div className="reporting-card__actions">
                  <button 
                    className="reporting-btn reporting-btn--secondary reporting-btn--sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditModal(award);
                    }}
                  >
                    <FaEdit /> Edit
                  </button>
                  <button 
                    className="reporting-btn reporting-btn--danger reporting-btn--sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(award.id);
                    }}
                  >
                    <FaTrash /> Delete
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="reporting-overlay">
          <div className="reporting-card reporting-modal award-modal">
            <div className="reporting-card__header">
              <h2 className="reporting-card__title">
                <FaTrophy /> {editingAward ? 'Edit Award' : 'Create New Award'}
              </h2>
              <button 
                className="reporting-btn reporting-btn--secondary reporting-btn--sm"
                onClick={closeModal}
                disabled={submitting}
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="reporting-card__content">
              <div className="reporting-filters__grid">
                {/* Employee Selection */}
                <div className="reporting-form-group">
                  <label className="reporting-form-label">
                    <FaUser /> Employee *
                  </label>
                  <select
                    name="userId"
                    value={formData.userId}
                    onChange={handleInputChange}
                    className="reporting-select"
                    required
                    disabled={submitting}
                  >
                    <option value="">Select an employee...</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.firstName} {user.lastName} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Achievement Title */}
                <div className="reporting-form-group">
                  <label className="reporting-form-label">Achievement Title *</label>
                  <input
                    type="text"
                    name="achievementTitle"
                    value={formData.achievementTitle}
                    onChange={handleInputChange}
                    className="reporting-input"
                    placeholder="e.g., Employee of the Month"
                    required
                    disabled={submitting}
                  />
                </div>

                {/* Badge Type */}
                <div className="reporting-form-group">
                  <label className="reporting-form-label">Badge Type</label>
                  <select
                    name="badges"
                    value={formData.badges}
                    onChange={handleInputChange}
                    className="reporting-select"
                    disabled={submitting}
                  >
                    <option value="">No badge</option>
                    {badgeOptions.map(badge => (
                      <option key={badge.value} value={badge.value}>
                        {badge.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Priority */}
                <div className="reporting-form-group">
                  <label className="reporting-form-label">Priority (0-10)</label>
                  <input
                    type="number"
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    className="reporting-input"
                    min="0"
                    max="10"
                    disabled={submitting}
                  />
                </div>

                {/* Award Date */}
                <div className="reporting-form-group">
                  <label className="reporting-form-label">
                    <FaCalendar /> Award Date
                  </label>
                  <input
                    type="date"
                    name="awardDate"
                    value={formData.awardDate}
                    onChange={handleInputChange}
                    className="reporting-input"
                    disabled={submitting}
                  />
                </div>

                {/* Expiration Date */}
                <div className="reporting-form-group">
                  <label className="reporting-form-label">Expiration Date</label>
                  <input
                    type="date"
                    name="expiresAt"
                    value={formData.expiresAt}
                    onChange={handleInputChange}
                    className="reporting-input"
                    disabled={submitting}
                  />
                </div>
              </div>

              {/* Description */}
              <div className="reporting-form-group">
                <label className="reporting-form-label">Description</label>
                <textarea
                  name="achievementDescription"
                  value={formData.achievementDescription}
                  onChange={handleInputChange}
                  className="reporting-textarea"
                  placeholder="Describe the achievement and why it's being recognized..."
                  rows={4}
                  disabled={submitting}
                />
              </div>

              {/* Image Upload */}
              <div className="reporting-form-group">
                <label className="reporting-form-label">
                  <FaImage /> Custom Image
                </label>
                <div className="image-upload-wrapper">
                  <input
                    type="file"
                    id="image"
                    name="image"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="file-input"
                    disabled={submitting}
                  />
                  <label htmlFor="image" className="reporting-btn reporting-btn--secondary reporting-btn--sm">
                    <FaImage /> Choose Image
                  </label>
                  {imagePreview && (
                    <div className="image-preview">
                      <img src={imagePreview} alt="Preview" />
                      <button 
                        type="button" 
                        onClick={() => { setImagePreview(null); setFormData(prev => ({ ...prev, image: null })); }}
                        className="remove-preview"
                        disabled={submitting}
                      >
                        <FaTimes />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </form>

            <div className="reporting-card__actions">
              <button 
                type="button"
                className="reporting-btn reporting-btn--secondary"
                onClick={closeModal}
                disabled={submitting}
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="reporting-btn reporting-btn--gold"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? 'Saving...' : (editingAward ? 'Update Award' : 'Create Award')}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}