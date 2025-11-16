package com.bamikahub.inventorysystem.dao.privacy;

import com.bamikahub.inventorysystem.models.privacy.PrivacySettings;
import com.bamikahub.inventorysystem.models.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PrivacySettingsRepository extends JpaRepository<PrivacySettings, Long> {
    Optional<PrivacySettings> findByUser(User user);
    Optional<PrivacySettings> findByUserId(Long userId);
}