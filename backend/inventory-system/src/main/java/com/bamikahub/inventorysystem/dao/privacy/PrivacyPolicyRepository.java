package com.bamikahub.inventorysystem.dao.privacy;

import com.bamikahub.inventorysystem.models.privacy.PrivacyPolicy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PrivacyPolicyRepository extends JpaRepository<PrivacyPolicy, Long> {
    Optional<PrivacyPolicy> findByVersion(String version);
    Optional<PrivacyPolicy> findFirstByIsActiveTrueOrderByEffectiveDateDesc();
    List<PrivacyPolicy> findAllByOrderByEffectiveDateDesc();

    @Query("SELECT pp FROM PrivacyPolicy pp WHERE pp.isActive = true AND pp.effectiveDate <= CURRENT_TIMESTAMP ORDER BY pp.effectiveDate DESC")
    List<PrivacyPolicy> findActivePolicies();
}