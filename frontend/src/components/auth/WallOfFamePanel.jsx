import React, { useState } from 'react';
import useWallOfFame from '../../hooks/useWallOfFame.js';
import Spinner from '../common/Spinner.jsx';
import Modal from '../common/Modal.jsx';
import './WallOfFamePanel.css';
import placeholderImg from '../../assets/images/placeholder.jpg';

/**
 * WallOfFamePanel
 * Displays rotating awardee(s) with avatar, name, achievement and badges.
 * Fallback: motivational placeholder when no awards.
 * Bonus: Click avatar or achievement to open story modal if present.
 */
export default function WallOfFamePanel() {
  const [isPaused, setIsPaused] = useState(false);
  const { awards, current, loading, error, activeAward, hasAwards, setCurrent } = useWallOfFame({ rotationIntervalMs: 7000, paused: isPaused });
  const [openStoryId, setOpenStoryId] = useState(null);

  const handleOpenStory = (award) => {
    if (!award) return;
    if (award.story || award.achievement || award.description) {
      setOpenStoryId(award.id);
    }
  };
  const closeModal = () => setOpenStoryId(null);

  const getImageFor = (award) => {
    if (!award) return placeholderImg;
    
    const backendURL = 'http://localhost:8080';
    const imageUrl = award.wallImageUrl || award.displayImageUrl || award.imageUrl || award.profileImageUrl;
    
    // If we have an image URL from backend, prepend the backend URL
    if (imageUrl && imageUrl.startsWith('/uploads/')) {
      return backendURL + imageUrl;
    }
    
    return imageUrl || placeholderImg;
  };

  const iconForBadge = (badge) => {
    const key = (badge || '').toLowerCase();
    if (key.includes('star')) return '⭐';
    if (key.includes('crown')) return '👑';
    if (key.includes('gold')) return '🥇';
    if (key.includes('silver')) return '🥈';
    if (key.includes('bronze')) return '🥉';
    if (key.includes('medal')) return '🏅';
    if (key.includes('top') || key.includes('champ')) return '🏆';
    return '🌟';
  };

  const storyAward = awards.find(a => a.id === openStoryId);

  return (
    <div
      className="wall-of-fame-panel"
      aria-live="polite"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="wall-of-fame-inner">
        {loading && (
          <div style={{ padding: '50px 0' }}>
            <Spinner size="lg" color="white" text="Loading excellence..." />
          </div>
        )}
        {!loading && error && (
          <div className="fame-text-block">
            <h2 className="fame-placeholder-title">Recognition Unavailable</h2>
            <p className="fame-placeholder-text">{error}</p>
          </div>
        )}

        {!loading && !error && !hasAwards && (
          <div className="fame-slide-wrapper">
            <div className="fame-slide active">
              <div className="fame-placeholder-icon">🏆</div>
              <h2 className="fame-placeholder-title">Wall of Fame</h2>
              <p className="fame-placeholder-text">
                Achievement lives here. As your team excels, their stories of innovation, discipline and impact will appear—celebrating a culture of performance and growth.
              </p>
            </div>
          </div>
        )}

        {!loading && !error && hasAwards && (
          <>
            <div className="fame-slide-wrapper">
              {awards.map((award, idx) => (
                <div
                  key={award.id || idx}
                  className={`fame-slide ${idx === current ? 'active' : ''}`}
                  aria-hidden={idx === current ? 'false' : 'true'}
                >
                  <div className="fame-avatar-wrapper" onClick={() => handleOpenStory(award)} title="View award story" role="button" tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && handleOpenStory(award)}>
                    <img src={getImageFor(award)} alt={award.employeeName || award.name || 'Awardee'} />
                  </div>
                  <div className="fame-text-block" onClick={() => handleOpenStory(award)} role="button" tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && handleOpenStory(award)}>
                    <h3 className="fame-name">{award.employeeName || award.name || 'Awarded Employee'}</h3>
                    <p className="fame-achievement">{award.achievement || award.title || award.description || 'Outstanding performance and contribution.'}</p>
                    {Array.isArray(award.badges) && award.badges.length > 0 && (
                      <div className="fame-badges">
                        {award.badges.map((b, i) => (
                          <div className="fame-badge" key={i} title={b}>{iconForBadge(b)}</div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {awards.length > 1 && (
              <div className="fame-dots" role="tablist" aria-label="Award rotation navigation">
                {awards.map((_, idx) => (
                  <div
                    key={idx}
                    className={`fame-dot ${idx === current ? 'active' : ''}`}
                    onClick={() => setCurrent(idx)}
                    aria-selected={idx === current}
                    aria-controls={`fame-slide-${idx}`}
                    role="tab"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') setCurrent(idx);
                    }}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Story Modal */}
      <Modal
        isOpen={!!openStoryId}
        onClose={closeModal}
        title={storyAward ? (storyAward.employeeName || storyAward.name || 'Award Story') : 'Award Story'}
        size="md"
      >
        {storyAward ? (
          <div>
            <div style={{display:'flex', gap:'20px', alignItems:'center', marginBottom:'20px'}}>
              <img
                src={getImageFor(storyAward)}
                alt={storyAward.employeeName || storyAward.name || 'Awardee'}
                style={{width:'90px',height:'90px',borderRadius:'16px',objectFit:'cover'}}
              />
              <div>
                <h3 style={{margin:'0 0 6px'}}>{storyAward.employeeName || storyAward.name}</h3>
                <p style={{margin:0,fontStyle:'italic'}}>{storyAward.achievement || storyAward.title || 'Recognized for excellence.'}</p>
              </div>
            </div>
            <p style={{lineHeight:1.5}}>{storyAward.story || storyAward.description || 'No extended story provided for this award.'}</p>
          </div>
        ) : (
          <p>Loading story...</p>
        )}
      </Modal>
    </div>
  );
}
