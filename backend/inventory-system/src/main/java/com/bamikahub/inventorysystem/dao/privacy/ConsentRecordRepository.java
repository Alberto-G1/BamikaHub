package com.bamikahub.inventorysystem.dao.privacy;

import com.bamikahub.inventorysystem.models.privacy.ConsentRecord;
import com.bamikahub.inventorysystem.models.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ConsentRecordRepository extends JpaRepository<ConsentRecord, Long> {
    List<ConsentRecord> findByUser(User user);
    List<ConsentRecord> findByUserAndConsentType(User user, String consentType);
    Optional<ConsentRecord> findByUserAndConsentTypeAndConsentVersion(User user, String consentType, String consentVersion);

    @Query("SELECT cr FROM ConsentRecord cr WHERE cr.user = :user AND cr.expiresAt < :now AND cr.granted = true")
    List<ConsentRecord> findExpiredConsents(@Param("user") User user, @Param("now") LocalDateTime now);

    @Query("SELECT cr FROM ConsentRecord cr WHERE cr.consentType = :consentType AND cr.consentVersion != :version")
    List<ConsentRecord> findOutdatedConsents(@Param("consentType") String consentType, @Param("version") String version);
}