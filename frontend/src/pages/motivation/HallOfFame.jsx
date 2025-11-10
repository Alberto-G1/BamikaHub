import React from 'react';
import { FaTrophy, FaStar, FaCrown, FaAward } from 'react-icons/fa';
import useWallOfFame from '../../hooks/useWallOfFame.js';
import './HallOfFame.css';

export default function HallOfFame() {
  const { awards, loading, error } = useWallOfFame(7000);

  const getImg = (a) => {
    const backendURL = 'http://localhost:8080';
    const imageUrl = a?.wallImageUrl || a?.displayImageUrl || a?.imageUrl || a?.profileImageUrl;
    
    if (imageUrl && imageUrl.startsWith('/uploads/')) {
      return backendURL + imageUrl;
    }
    
    return imageUrl || '/api/placeholder/300/400';
  };

  const getBadgeIcon = (award) => {
    if (award.badges && award.badges.length > 0) {
      const badge = award.badges[0];
      if (badge.includes('star') || badge.includes('sparkle')) return FaStar;
      if (badge.includes('crown')) return FaCrown;
    }
    return FaAward;
  };

  if (loading) {
    return (
      <section className="reporting-page">
        <div className="reporting-loading">
          <div className="reporting-spinner" />
          <p className="reporting-card__subtitle">Loading hall of fame...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="reporting-page">
        <div className="reporting-card">
          <div className="reporting-empty-state">
            <FaTrophy className="empty-icon" />
            <h3>Unable to Load Hall of Fame</h3>
            <p>{error}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="reporting-page">
      {/* Header */}
      <div className="reporting-back" data-animate="fade-up">
        <p className="reporting-back__title">Recognition • Hall of Fame</p>
      </div>

      {/* Hero Banner */}
      <div className="reporting-banner" data-animate="fade-up" data-delay="0.04">
        <div className="reporting-banner__content">
          <div className="reporting-banner__info">
            <span className="reporting-banner__eyebrow">
              <FaTrophy /> Celebrating Excellence
            </span>
            <h1 className="reporting-banner__title">Hall of Fame</h1>
            <p className="reporting-banner__subtitle">
              Recognizing and celebrating outstanding performance and achievements across the organization
            </p>
          </div>
        </div>

        {/* Statistics */}
        <div className="reporting-banner__meta">
          <div className="reporting-banner__meta-item">
            <div className="reporting-banner__meta-icon reporting-banner__meta-icon--gold">
              <FaTrophy />
            </div>
            <div className="reporting-banner__meta-content">
              <span className="reporting-banner__meta-label">Total Honorees</span>
              <span className="reporting-banner__meta-value">{awards.length}</span>
            </div>
          </div>
          <div className="reporting-banner__meta-item">
            <div className="reporting-banner__meta-icon reporting-banner__meta-icon--purple">
              <FaStar />
            </div>
            <div className="reporting-banner__meta-content">
              <span className="reporting-banner__meta-label">Star Performers</span>
              <span className="reporting-banner__meta-value">
                {awards.filter(a => a.badges && a.badges.some(b => b.includes('star'))).length}
              </span>
            </div>
          </div>
          <div className="reporting-banner__meta-item">
            <div className="reporting-banner__meta-icon reporting-banner__meta-icon--blue">
              <FaCrown />
            </div>
            <div className="reporting-banner__meta-content">
              <span className="reporting-banner__meta-label">Top Achievers</span>
              <span className="reporting-banner__meta-value">
                {awards.filter(a => a.badges && a.badges.some(b => b.includes('crown'))).length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Awards Grid */}
      <div className="hof-grid" data-animate="fade-up" data-delay="0.08">
        {awards.length === 0 ? (
          <div className="reporting-card">
            <div className="reporting-empty-state">
              <FaTrophy className="empty-icon" />
              <h3>No Awards Yet</h3>
              <p>Employee recognitions will appear here once awards are created in the Award Management system.</p>
              <p className="reporting-text--muted">Check back soon to see our outstanding performers!</p>
            </div>
          </div>
        ) : (
          awards.map((award, idx) => {
            const BadgeIcon = getBadgeIcon(award);
            const displayName = award.employeeName || award.name || award.userName || 'Valued Team Member';
            const achievement = award.achievement || award.title || award.achievementTitle || award.description || 'Outstanding Performance';
            
            return (
              <div 
                key={award.id || idx} 
                className="reporting-card reporting-card--interactive hof-card"
              >
                <div className="hof-card-inner">
                  {/* Image Section */}
                  <div className="hof-img-wrap">
                    <img 
                      src={getImg(award)} 
                      alt={displayName}
                      className="hof-image"
                    />
                    <div className="hof-badge-overlay">
                      <BadgeIcon className="badge-icon" />
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="hof-content">
                    <div className="hof-name">{displayName}</div>
                    <div className="hof-achievement">{achievement}</div>
                    
                    {/* Additional Metadata */}
                    {(award.awardDate || award.priority) && (
                      <div className="hof-meta">
                        {award.awardDate && (
                          <span className="hof-date">
                            {new Date(award.awardDate).toLocaleDateString()}
                          </span>
                        )}
                        {award.priority > 0 && (
                          <span className={`hof-priority priority-${award.priority}`}>
                            Priority: {award.priority}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Badge Display */}
                    {award.badges && award.badges.length > 0 && (
                      <div className="hof-badges">
                        {award.badges.map((badge, badgeIdx) => (
                          <span key={badgeIdx} className="reporting-badge reporting-badge--info">
                            {badge}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}