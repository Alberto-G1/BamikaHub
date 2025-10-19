package com.bamikahub.inventorysystem.dto.audit;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditLogDto {
    private Long id;
    private Long actorId;
    private String actorName;
    private String actorEmail;
    private String action;
    private String entityType;
    private Long entityId;
    private String entityName;
    private String details;
    private String ipAddress;
    private String severity;
    private String timestamp;
}
