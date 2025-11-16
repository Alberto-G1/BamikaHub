package com.bamikahub.inventorysystem.dto.settings;

import lombok.Data;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;

@Data
public class UserSettingsUpdateRequest {
    private String theme;
    private String language;
    private boolean emailNotifications;
    private boolean smsNotifications;
    private boolean pushNotifications;
    private boolean desktopNotifications;

    @Min(value = 10, message = "Items per page must be at least 10")
    @Max(value = 100, message = "Items per page cannot exceed 100")
    private int itemsPerPage;

    private String dateFormat;
    private String timeFormat;
    private boolean autoSaveEnabled;

    @Min(value = 1, message = "Auto save interval must be at least 1 minute")
    @Max(value = 30, message = "Auto save interval cannot exceed 30 minutes")
    private int autoSaveIntervalMinutes;

    private boolean showWelcomeMessage;
    private boolean compactView;
}