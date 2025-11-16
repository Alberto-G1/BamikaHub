package com.bamikahub.inventorysystem.dto.settings;

import lombok.Data;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;

@Data
public class SystemSettingsUpdateRequest {
    @NotBlank(message = "Company name is required")
    private String companyName;

    @Email(message = "Invalid email format")
    private String companyEmail;

    private String companyPhone;
    private String companyAddress;
    private String timezone;
    private String currency;
    private String language;
    private boolean emailNotificationsEnabled;
    private boolean smsNotificationsEnabled;
    private boolean pushNotificationsEnabled;

    @Min(value = 5, message = "Session timeout must be at least 5 minutes")
    @Max(value = 480, message = "Session timeout cannot exceed 8 hours")
    private int sessionTimeoutMinutes;

    @Min(value = 3, message = "Max login attempts must be at least 3")
    @Max(value = 10, message = "Max login attempts cannot exceed 10")
    private int maxLoginAttempts;

    private boolean twoFactorAuthRequired;
    private boolean maintenanceMode;
    private String maintenanceMessage;
}