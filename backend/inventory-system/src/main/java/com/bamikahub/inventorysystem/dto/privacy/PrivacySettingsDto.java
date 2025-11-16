package com.bamikahub.inventorysystem.dto.privacy;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PrivacySettingsDto {
    private Long userId;
    private String email;

    // Data sharing preferences
    private boolean profileVisible;
    private boolean activityVisible;
    private boolean statisticsVisible;

    // Cookie preferences
    private boolean essentialCookies;
    private boolean analyticsCookies;
    private boolean marketingCookies;
    private boolean functionalCookies;

    // Consent management
    private Map<String, ConsentRecordDto> consents;

    // Data retention preferences
    private boolean autoDeleteOldData;
    private int dataRetentionDays;

    private LocalDateTime lastUpdated;
}