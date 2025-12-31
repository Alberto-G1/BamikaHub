package com.bamikahub.inventorysystem.dto.settings;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.util.Map;

@Data
public class SettingsExportDto {
    private String exportVersion;
    private String exportDate;
    private String exportedBy;
    
    private SystemSettingsDto systemSettings;
    private Map<Long, UserSettingsDto> userSettings;
    
    private String checksum; // For integrity verification
    private String environment; // dev, staging, production
    
    @Data
    public static class UserSettingsDto {
        private Long userId;
        private String theme;
        private String language;
        private boolean emailNotifications;
        private boolean smsNotifications;
        private boolean pushNotifications;
        private boolean desktopNotifications;
        private int itemsPerPage;
        private String dateFormat;
        private String timeFormat;
        private boolean autoSaveEnabled;
        private int autoSaveIntervalMinutes;
        private boolean showWelcomeMessage;
        private boolean compactView;
    }
}