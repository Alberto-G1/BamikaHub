package com.bamikahub.inventorysystem.services.settings;

import com.bamikahub.inventorysystem.dao.settings.SystemSettingsRepository;
import com.bamikahub.inventorysystem.dao.settings.UserSettingsRepository;
import com.bamikahub.inventorysystem.dto.settings.SystemSettingsDto;
import com.bamikahub.inventorysystem.dto.settings.SystemSettingsUpdateRequest;
import com.bamikahub.inventorysystem.dto.settings.UserSettingsDto;
import com.bamikahub.inventorysystem.dto.settings.UserSettingsUpdateRequest;
import com.bamikahub.inventorysystem.models.settings.SystemSettings;
import com.bamikahub.inventorysystem.models.settings.UserSettings;
import com.bamikahub.inventorysystem.models.user.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@Transactional
public class SettingsService {

    @Autowired
    private SystemSettingsRepository systemSettingsRepository;

    @Autowired
    private UserSettingsRepository userSettingsRepository;

    // System Settings Methods

    public SystemSettingsDto getSystemSettings() {
        SystemSettings settings = systemSettingsRepository.findAll().stream().findFirst()
                .orElseGet(() -> createDefaultSystemSettings());
        return convertToSystemSettingsDto(settings);
    }

    public SystemSettingsDto updateSystemSettings(SystemSettingsUpdateRequest request) {
        SystemSettings settings = systemSettingsRepository.findAll().stream().findFirst()
                .orElseGet(() -> createDefaultSystemSettings());

        // Update fields
        settings.setCompanyName(request.getCompanyName());
        settings.setCompanyEmail(request.getCompanyEmail());
        settings.setCompanyPhone(request.getCompanyPhone());
        settings.setCompanyAddress(request.getCompanyAddress());
        settings.setTimezone(request.getTimezone());
        settings.setCurrency(request.getCurrency());
        settings.setLanguage(request.getLanguage());
        settings.setEmailNotificationsEnabled(request.isEmailNotificationsEnabled());
        settings.setSmsNotificationsEnabled(request.isSmsNotificationsEnabled());
        settings.setPushNotificationsEnabled(request.isPushNotificationsEnabled());
        settings.setSessionTimeoutMinutes(request.getSessionTimeoutMinutes());
        settings.setMaxLoginAttempts(request.getMaxLoginAttempts());
        settings.setTwoFactorAuthRequired(request.isTwoFactorAuthRequired());
        settings.setMaintenanceMode(request.isMaintenanceMode());
        settings.setMaintenanceMessage(request.getMaintenanceMessage());

        // Get current user for audit
        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
        settings.setUpdatedBy(currentUser);

        SystemSettings saved = systemSettingsRepository.save(settings);
        return convertToSystemSettingsDto(saved);
    }

    private SystemSettings createDefaultSystemSettings() {
        SystemSettings settings = new SystemSettings();
        settings.setCompanyName("Bamika Inventory System");
        settings.setTimezone("UTC");
        settings.setCurrency("USD");
        settings.setLanguage("en");
        settings.setEmailNotificationsEnabled(true);
        settings.setSmsNotificationsEnabled(false);
        settings.setPushNotificationsEnabled(true);
        settings.setSessionTimeoutMinutes(30);
        settings.setMaxLoginAttempts(5);
        settings.setTwoFactorAuthRequired(false);
        settings.setMaintenanceMode(false);
        return systemSettingsRepository.save(settings);
    }

    // User Settings Methods

    public UserSettingsDto getUserSettings(Long userId) {
        User user = new User();
        user.setId(userId);

        UserSettings settings = userSettingsRepository.findByUser(user)
                .orElseGet(() -> createDefaultUserSettings(user));

        return convertToUserSettingsDto(settings);
    }

    public UserSettingsDto updateUserSettings(Long userId, UserSettingsUpdateRequest request) {
        User user = new User();
        user.setId(userId);

        UserSettings settings = userSettingsRepository.findByUser(user)
                .orElseGet(() -> createDefaultUserSettings(user));

        // Update fields
        settings.setTheme(request.getTheme());
        settings.setLanguage(request.getLanguage());
        settings.setEmailNotifications(request.isEmailNotifications());
        settings.setSmsNotifications(request.isSmsNotifications());
        settings.setPushNotifications(request.isPushNotifications());
        settings.setDesktopNotifications(request.isDesktopNotifications());
        settings.setItemsPerPage(request.getItemsPerPage());
        settings.setDateFormat(request.getDateFormat());
        settings.setTimeFormat(request.getTimeFormat());
        settings.setAutoSaveEnabled(request.isAutoSaveEnabled());
        settings.setAutoSaveIntervalMinutes(request.getAutoSaveIntervalMinutes());
        settings.setShowWelcomeMessage(request.isShowWelcomeMessage());
        settings.setCompactView(request.isCompactView());

        UserSettings saved = userSettingsRepository.save(settings);
        return convertToUserSettingsDto(saved);
    }

    private UserSettings createDefaultUserSettings(User user) {
        UserSettings settings = new UserSettings();
        settings.setUser(user);
        settings.setTheme("light");
        settings.setLanguage("en");
        settings.setEmailNotifications(true);
        settings.setSmsNotifications(false);
        settings.setPushNotifications(true);
        settings.setDesktopNotifications(true);
        settings.setItemsPerPage(25);
        settings.setDateFormat("MM/dd/yyyy");
        settings.setTimeFormat("HH:mm");
        settings.setAutoSaveEnabled(true);
        settings.setAutoSaveIntervalMinutes(5);
        settings.setShowWelcomeMessage(true);
        settings.setCompactView(false);
        return userSettingsRepository.save(settings);
    }

    // Conversion Methods

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

    private UserSettingsDto convertToUserSettingsDto(UserSettings settings) {
        UserSettingsDto dto = new UserSettingsDto();
        dto.setUserId(settings.getUser().getId());
        dto.setTheme(settings.getTheme());
        dto.setLanguage(settings.getLanguage());
        dto.setEmailNotifications(settings.isEmailNotifications());
        dto.setSmsNotifications(settings.isSmsNotifications());
        dto.setPushNotifications(settings.isPushNotifications());
        dto.setDesktopNotifications(settings.isDesktopNotifications());
        dto.setItemsPerPage(settings.getItemsPerPage());
        dto.setDateFormat(settings.getDateFormat());
        dto.setTimeFormat(settings.getTimeFormat());
        dto.setAutoSaveEnabled(settings.isAutoSaveEnabled());
        dto.setAutoSaveIntervalMinutes(settings.getAutoSaveIntervalMinutes());
        dto.setShowWelcomeMessage(settings.isShowWelcomeMessage());
        dto.setCompactView(settings.isCompactView());
        dto.setUpdatedAt(settings.getUpdatedAt());
        return dto;
    }
}