package com.bamikahub.inventorysystem.service.privacy;

import com.bamikahub.inventorysystem.dao.privacy.CookieConsentRepository;
import com.bamikahub.inventorysystem.models.user.User;
import com.bamikahub.inventorysystem.models.privacy.CookieConsent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class CookieConsentService {
    private final CookieConsentRepository consentRepository;
    private static final String CONSENT_VERSION = "1.0";

    @Transactional
    public CookieConsent saveConsent(User user, String sessionId, boolean analytics, boolean marketing, boolean functional, String ipAddress, String userAgent) {
        // Revoke existing active consents
        if (user != null) {
            consentRepository.findByUserAndIsActiveTrue(user)
                .ifPresent(CookieConsent::revokeConsent);
        } else if (sessionId != null) {
            consentRepository.findBySessionIdAndIsActiveTrue(sessionId)
                .ifPresent(CookieConsent::revokeConsent);
        }

        // Create new consent
        CookieConsent consent = new CookieConsent();
        consent.setUser(user);
        consent.setSessionId(sessionId);
        consent.setEssentialCookies(true);
        consent.setAnalyticsCookies(analytics);
        consent.setMarketingCookies(marketing);
        consent.setFunctionalCookies(functional);
        consent.setIpAddress(ipAddress);
        consent.setUserAgent(userAgent);
        consent.setConsentDate(LocalDateTime.now());
        consent.setExpiryDate(LocalDateTime.now().plusYears(1));
        consent.setConsentVersion(CONSENT_VERSION);
        consent.setActive(true);

        log.info("Created new cookie consent for {}", user != null ? user.getEmail() : "session: " + sessionId);
        return consentRepository.save(consent);
    }

    public Optional<CookieConsent> getActiveConsent(User user, String sessionId) {
        if (user != null) {
            return consentRepository.findByUserAndIsActiveTrue(user);
        } else if (sessionId != null) {
            return consentRepository.findBySessionIdAndIsActiveTrue(sessionId);
        }
        return Optional.empty();
    }

    @Transactional
    public Optional<CookieConsent> updateConsent(User user, String sessionId, boolean analytics, boolean marketing, boolean functional) {
        Optional<CookieConsent> consentOpt = getActiveConsent(user, sessionId);
        if (consentOpt.isPresent()) {
            CookieConsent consent = consentOpt.get();
            consent.updateConsent(analytics, marketing, functional);
            log.info("Updated cookie consent for {}", user != null ? user.getEmail() : "session: " + sessionId);
            return Optional.of(consentRepository.save(consent));
        }
        return Optional.empty();
    }

    @Transactional
    public void revokeConsent(User user, String sessionId) {
        Optional<CookieConsent> consentOpt = getActiveConsent(user, sessionId);
        consentOpt.ifPresent(consent -> {
            consent.revokeConsent();
            consentRepository.save(consent);
            log.info("Revoked cookie consent for {}", user != null ? user.getEmail() : "session: " + sessionId);
        });
    }

    public List<CookieConsent> getConsentHistory(User user) {
        return consentRepository.findConsentHistory(user);
    }

    @Transactional
    public void cleanupExpiredConsents() {
        List<CookieConsent> expired = consentRepository.findByExpiryDateBeforeAndIsActiveTrue(LocalDateTime.now());
        expired.forEach(CookieConsent::revokeConsent);
        consentRepository.saveAll(expired);
        log.info("Cleaned up {} expired cookie consents", expired.size());
    }

    public long countAnalyticsConsents() {
        return consentRepository.countAnalyticsConsents();
    }

    public long countMarketingConsents() {
        return consentRepository.countMarketingConsents();
    }

    public long countActiveConsents() {
        return consentRepository.countByIsActiveTrue();
    }
}
