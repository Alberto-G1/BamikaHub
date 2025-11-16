package com.bamikahub.inventorysystem.dto.privacy;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PrivacyPolicyDto {
    private Long id;
    private String version;
    private String title;
    private String content;
    private LocalDateTime effectiveDate;
    private LocalDateTime createdAt;
    private boolean isActive;
    private boolean requiresConsent;
}