package com.bamikahub.inventorysystem.dto.settings;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SettingsAuditDto {
    private Long id;
    private String settingKey;
    private String settingType; // SYSTEM, USER
    private String oldValue;
    private String newValue;
    private String changedBy;
    private LocalDateTime changedAt;
    private String ipAddress;
    private String userAgent;
    private String changeReason;
}