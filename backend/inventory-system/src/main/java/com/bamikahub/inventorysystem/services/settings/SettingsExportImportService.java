package com.bamikahub.inventorysystem.services.settings;

import com.bamikahub.inventorysystem.dao.settings.SystemSettingsRepository;
import com.bamikahub.inventorysystem.dao.settings.UserSettingsRepository;
import com.bamikahub.inventorysystem.dto.settings.SettingsExportDto;
import com.bamikahub.inventorysystem.dto.settings.SystemSettingsDto;
import com.bamikahub.inventorysystem.dto.settings.UserSettingsDto;
import com.bamikahub.inventorysystem.models.settings.SystemSettings;
import com.bamikahub.inventorysystem.models.settings.UserSettings;
import com.bamikahub.inventorysystem.models.user.User;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Transactional
public class SettingsExportImportService {

    @Autowired
    private SystemSettingsRepository systemSettingsRepository;

    @Autowired
    private UserSettingsRepository userSettingsRepository;

    @Autowired
    @org.springframework.context.annotation.Lazy
    private SettingsService settingsService;

    @Autowired
    private SettingsAuditService auditService;

    @Autowired
    private ObjectMapper objectMapper;

    private static final String EXPORT_VERSION = "1.0";

    /**
     * Export all system and user settings to a portable format
     */
    public SettingsExportDto exportSettings() throws Exception {
        SettingsExportDto export = new SettingsExportDto();
        
        // Set export metadata
        export.setExportVersion(EXPORT_VERSION);
        export.setExportDate(LocalDateTime.now().toString());
        export.setExportedBy(SecurityContextHolder.getContext().getAuthentication().getName());
        export.setEnvironment(determineEnvironment());
        
        // Export system settings
        SystemSettings systemSettings = systemSettingsRepository.findAll().stream().findFirst().orElse(null);
        if (systemSettings != null) {
            export.setSystemSettings(convertToSystemSettingsDto(systemSettings));
        }
        
        // Export user settings
        List<UserSettings> allUserSettings = userSettingsRepository.findAll();
        Map<Long, SettingsExportDto.UserSettingsDto> userSettingsMap = new HashMap<>();
        
        for (UserSettings userSettings : allUserSettings) {
            SettingsExportDto.UserSettingsDto dto = new SettingsExportDto.UserSettingsDto();
            dto.setUserId(userSettings.getUser().getId());
            dto.setTheme(userSettings.getTheme());
            dto.setLanguage(userSettings.getLanguage());
            dto.setEmailNotifications(userSettings.isEmailNotifications());
            dto.setSmsNotifications(userSettings.isSmsNotifications());
            dto.setPushNotifications(userSettings.isPushNotifications());
            dto.setDesktopNotifications(userSettings.isDesktopNotifications());
            dto.setItemsPerPage(userSettings.getItemsPerPage());
            dto.setDateFormat(userSettings.getDateFormat());
            dto.setTimeFormat(userSettings.getTimeFormat());
            dto.setAutoSaveEnabled(userSettings.isAutoSaveEnabled());
            dto.setAutoSaveIntervalMinutes(userSettings.getAutoSaveIntervalMinutes());
            dto.setShowWelcomeMessage(userSettings.isShowWelcomeMessage());
            dto.setCompactView(userSettings.isCompactView());
            
            userSettingsMap.put(userSettings.getUser().getId(), dto);
        }
        
        export.setUserSettings(userSettingsMap);
        
        // Calculate checksum for integrity verification
        String checksum = calculateChecksum(export);
        export.setChecksum(checksum);
        
        // Log the export action
        auditService.logSettingsChange(
            "SETTINGS_EXPORT",
            "SYSTEM",
            null,
            "Exported " + userSettingsMap.size() + " user settings",
            export.getExportedBy(),
            "Configuration backup/migration"
        );
        
        return export;
    }

    /**
     * Import settings from export file with validation
     */
    public void importSettings(SettingsExportDto importData, boolean overwriteExisting) throws Exception {
        // Verify checksum
        String providedChecksum = importData.getChecksum();
        importData.setChecksum(null); // Temporarily remove for verification
        String calculatedChecksum = calculateChecksum(importData);
        importData.setChecksum(providedChecksum);
        
        if (!calculatedChecksum.equals(providedChecksum)) {
            throw new SecurityException("Checksum verification failed. Data may be corrupted or tampered with.");
        }
        
        // Verify version compatibility
        if (!EXPORT_VERSION.equals(importData.getExportVersion())) {
            throw new IllegalArgumentException("Incompatible export version: " + importData.getExportVersion());
        }
        
        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
        
        // Import system settings
        if (importData.getSystemSettings() != null) {
            importSystemSettings(importData.getSystemSettings(), overwriteExisting, currentUser);
        }
        
        // Import user settings
        if (importData.getUserSettings() != null && !importData.getUserSettings().isEmpty()) {
            importUserSettings(importData.getUserSettings(), overwriteExisting, currentUser);
        }
        
        // Log the import action
        auditService.logSettingsChange(
            "SETTINGS_IMPORT",
            "SYSTEM",
            null,
            "Imported settings from " + importData.getEnvironment() + " environment",
            currentUser,
            "Configuration restore/migration"
        );
    }

    /**
     * Import system settings
     */
    private void importSystemSettings(SystemSettingsDto dto, boolean overwrite, String currentUser) {
        SystemSettings existing = systemSettingsRepository.findAll().stream().findFirst().orElse(null);
        
        if (existing != null && !overwrite) {
            throw new IllegalStateException("System settings already exist. Set overwrite=true to replace.");
        }
        
        SystemSettings settings = existing != null ? existing : new SystemSettings();
        
        // Update fields
        settings.setCompanyName(dto.getCompanyName());
        settings.setCompanyLogo(dto.getCompanyLogo());
        settings.setCompanyEmail(dto.getCompanyEmail());
        settings.setCompanyPhone(dto.getCompanyPhone());
        settings.setCompanyAddress(dto.getCompanyAddress());
        settings.setTimezone(dto.getTimezone());
        settings.setCurrency(dto.getCurrency());
        settings.setLanguage(dto.getLanguage());
        settings.setEmailNotificationsEnabled(dto.isEmailNotificationsEnabled());
        settings.setSmsNotificationsEnabled(dto.isSmsNotificationsEnabled());
        settings.setPushNotificationsEnabled(dto.isPushNotificationsEnabled());
        settings.setSessionTimeoutMinutes(dto.getSessionTimeoutMinutes());
        settings.setMaxLoginAttempts(dto.getMaxLoginAttempts());
        settings.setTwoFactorAuthRequired(dto.isTwoFactorAuthRequired());
        settings.setMaintenanceMode(dto.isMaintenanceMode());
        settings.setMaintenanceMessage(dto.getMaintenanceMessage());
        settings.setUpdatedBy(currentUser);
        
        systemSettingsRepository.save(settings);
    }

    /**
     * Import user settings
     */
    private void importUserSettings(Map<Long, SettingsExportDto.UserSettingsDto> userSettingsMap, 
                                    boolean overwrite, String currentUser) {
        for (Map.Entry<Long, SettingsExportDto.UserSettingsDto> entry : userSettingsMap.entrySet()) {
            Long userId = entry.getKey();
            SettingsExportDto.UserSettingsDto dto = entry.getValue();
            
            User user = new User();
            user.setId(userId);
            
            UserSettings existing = userSettingsRepository.findByUser(user).orElse(null);
            
            if (existing != null && !overwrite) {
                continue; // Skip if exists and not overwriting
            }
            
            UserSettings settings = existing != null ? existing : new UserSettings();
            settings.setUser(user);
            
            // Update fields
            settings.setTheme(dto.getTheme());
            settings.setLanguage(dto.getLanguage());
            settings.setEmailNotifications(dto.isEmailNotifications());
            settings.setSmsNotifications(dto.isSmsNotifications());
            settings.setPushNotifications(dto.isPushNotifications());
            settings.setDesktopNotifications(dto.isDesktopNotifications());
            settings.setItemsPerPage(dto.getItemsPerPage());
            settings.setDateFormat(dto.getDateFormat());
            settings.setTimeFormat(dto.getTimeFormat());
            settings.setAutoSaveEnabled(dto.isAutoSaveEnabled());
            settings.setAutoSaveIntervalMinutes(dto.getAutoSaveIntervalMinutes());
            settings.setShowWelcomeMessage(dto.isShowWelcomeMessage());
            settings.setCompactView(dto.isCompactView());
            
            userSettingsRepository.save(settings);
        }
    }

    /**
     * Calculate SHA-256 checksum for integrity verification
     */
    private String calculateChecksum(SettingsExportDto export) throws Exception {
        String json = objectMapper.writeValueAsString(export);
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        byte[] hash = digest.digest(json.getBytes(StandardCharsets.UTF_8));
        
        StringBuilder hexString = new StringBuilder();
        for (byte b : hash) {
            String hex = Integer.toHexString(0xff & b);
            if (hex.length() == 1) hexString.append('0');
            hexString.append(hex);
        }
        
        return hexString.toString();
    }

    /**
     * Determine current environment
     */
    private String determineEnvironment() {
        String env = System.getProperty("spring.profiles.active");
        if (env != null && !env.isEmpty()) {
            return env.toUpperCase();
        }
        return "PRODUCTION";
    }

    /**
     * Convert entity to DTO
     */
    private SystemSettingsDto convertToSystemSettingsDto(SystemSettings settings) {
        SystemSettingsDto dto = new SystemSettingsDto();
        dto.setId(settings.getId());
        dto.setCompanyName(settings.getCompanyName());
        dto.setCompanyLogo(settings.getCompanyLogo());
        dto.setCompanyEmail(settings.getCompanyEmail());
        dto.setCompanyPhone(settings.getCompanyPhone());
        dto.setCompanyAddress(settings.getCompanyAddress());
        dto.setTimezone(settings.getTimezone());
        dto.setCurrency(settings.getCurrency());
        dto.setLanguage(settings.getLanguage());
        dto.setEmailNotificationsEnabled(settings.isEmailNotificationsEnabled());
        dto.setSmsNotificationsEnabled(settings.isSmsNotificationsEnabled());
        dto.setPushNotificationsEnabled(settings.isPushNotificationsEnabled());
        dto.setSessionTimeoutMinutes(settings.getSessionTimeoutMinutes());
        dto.setMaxLoginAttempts(settings.getMaxLoginAttempts());
        dto.setTwoFactorAuthRequired(settings.isTwoFactorAuthRequired());
        dto.setMaintenanceMode(settings.isMaintenanceMode());
        dto.setMaintenanceMessage(settings.getMaintenanceMessage());
        dto.setUpdatedAt(settings.getUpdatedAt());
        dto.setUpdatedBy(settings.getUpdatedBy());
        return dto;
    }
}
