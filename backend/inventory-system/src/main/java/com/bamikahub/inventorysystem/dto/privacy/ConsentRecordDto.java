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
public class ConsentRecordDto {
    private String consentType;
    private String consentText;
    private boolean granted;
    private LocalDateTime grantedAt;
    private LocalDateTime expiresAt;
    private String consentVersion;
}