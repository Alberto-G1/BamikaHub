package com.bamikahub.inventorysystem.dto.settings;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class SystemSettingsDto {
    private Long id;
    private String companyName;
    private String companyLogo;
    private String companyEmail;
    private String companyPhone;
    private String companyAddress;
    private String timezone;
    private String currency;
    private String language;
    private boolean emailNotificationsEnabled;
    private boolean smsNotificationsEnabled;
    private boolean pushNotificationsEnabled;
    private int sessionTimeoutMinutes;
    private int maxLoginAttempts;
    private boolean twoFactorAuthRequired;
    private boolean maintenanceMode;
    private String maintenanceMessage;
    private LocalDateTime updatedAt;
    private String updatedBy;
}