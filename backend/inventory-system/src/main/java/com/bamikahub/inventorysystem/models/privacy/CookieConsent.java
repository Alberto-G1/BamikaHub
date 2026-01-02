package com.bamikahub.inventorysystem.models.privacy;

import com.bamikahub.inventorysystem.models.user.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * CookieConsent Entity
 * Tracks user cookie consent preferences for GDPR compliance
 */
@Entity
@Table(name = "cookie_consents")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CookieConsent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = true)
    private User user;

    @Column(name = "session_id", unique = true)
    private String sessionId; // For anonymous users

    @Column(name = "essential_cookies", nullable = false)
    private boolean essentialCookies = true; // Always true, required for site functionality

    @Column(name = "analytics_cookies", nullable = false)
    private boolean analyticsCookies = false;

    @Column(name = "marketing_cookies", nullable = false)
    private boolean marketingCookies = false;

    @Column(name = "functional_cookies", nullable = false)
    private boolean functionalCookies = false;

    @Column(name = "ip_address")
    private String ipAddress;

    @Column(name = "user_agent", length = 500)
    private String userAgent;

    @Column(name = "consent_date", nullable = false)
    private LocalDateTime consentDate;

    @Column(name = "expiry_date")
    private LocalDateTime expiryDate;

    @Column(name = "consent_version")
    private String consentVersion; // Track which version of privacy policy was accepted

    @Column(name = "is_active", nullable = false)
    private boolean isActive = true;

    @PrePersist
    protected void onCreate() {
        consentDate = LocalDateTime.now();
        if (expiryDate == null) {
            expiryDate = LocalDateTime.now().plusYears(1); // 1 year default expiry
        }
    }

    public boolean isExpired() {
        return LocalDateTime.now().isAfter(expiryDate);
    }

    public void updateConsent(boolean analytics, boolean marketing, boolean functional) {
        this.analyticsCookies = analytics;
        this.marketingCookies = marketing;
        this.functionalCookies = functional;
        this.consentDate = LocalDateTime.now();
    }

    public void revokeConsent() {
        this.isActive = false;
        this.analyticsCookies = false;
        this.marketingCookies = false;
        this.functionalCookies = false;
    }
}
