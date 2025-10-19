package com.bamikahub.inventorysystem.dto.audit;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditFilterDto {
    private Long userId;
    private String action;
    private String entityType;
    private Long entityId;
    private String severity;
    private String startDate; // ISO format: yyyy-MM-dd
    private String endDate;   // ISO format: yyyy-MM-dd
}
