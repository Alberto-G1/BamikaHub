package com.bamikahub.inventorysystem.dto.privacy;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DataDeletionRequestDto {
    private String deletionType; // "ACCOUNT", "PERSONAL_DATA", "SPECIFIC_DATA"
    private List<String> dataCategories; // ["PROFILE", "ACTIVITY", "FILES", etc.]
    private String reason;
    private LocalDateTime requestedAt;
    private String status; // "PENDING", "APPROVED", "COMPLETED", "REJECTED"
    private String adminNotes;
}