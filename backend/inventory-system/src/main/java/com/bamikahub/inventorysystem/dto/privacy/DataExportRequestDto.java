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
public class DataExportRequestDto {
    private String requestType; // "PERSONAL_DATA", "ACCOUNT_DATA", "ALL_DATA"
    private String format; // "JSON", "CSV", "PDF"
    private String reason;
    private LocalDateTime requestedAt;
    private String status; // "PENDING", "PROCESSING", "COMPLETED", "FAILED"
    private String downloadUrl;
}