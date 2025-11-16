package com.bamikahub.inventorysystem.dto.settings;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class UserSettingsDto {
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
    private LocalDateTime updatedAt;
}