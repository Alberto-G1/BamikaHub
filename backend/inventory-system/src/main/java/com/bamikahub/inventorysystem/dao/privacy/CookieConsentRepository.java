package com.bamikahub.inventorysystem.dao.privacy;

import com.bamikahub.inventorysystem.models.user.User;
import com.bamikahub.inventorysystem.models.privacy.CookieConsent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface CookieConsentRepository extends JpaRepository<CookieConsent, Long> {

    Optional<CookieConsent> findByUserAndIsActiveTrue(User user);

    Optional<CookieConsent> findBySessionIdAndIsActiveTrue(String sessionId);

    List<CookieConsent> findByExpiryDateBeforeAndIsActiveTrue(LocalDateTime expiryDate);

    @Query("SELECT c FROM CookieConsent c WHERE c.user = :user ORDER BY c.consentDate DESC")
    List<CookieConsent> findConsentHistory(@Param("user") User user);

    @Query("SELECT COUNT(c) FROM CookieConsent c WHERE c.analyticsCookies = true AND c.isActive = true")
    long countAnalyticsConsents();

    @Query("SELECT COUNT(c) FROM CookieConsent c WHERE c.marketingCookies = true AND c.isActive = true")
    long countMarketingConsents();

    long countByIsActiveTrue();
}
