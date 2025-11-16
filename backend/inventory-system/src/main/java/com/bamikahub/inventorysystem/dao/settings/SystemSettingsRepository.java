package com.bamikahub.inventorysystem.dao.settings;

import com.bamikahub.inventorysystem.models.settings.SystemSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SystemSettingsRepository extends JpaRepository<SystemSettings, Long> {
    // Only one system settings record should exist
}