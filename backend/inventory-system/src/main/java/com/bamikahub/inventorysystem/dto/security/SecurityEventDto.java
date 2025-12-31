package com.bamikahub.inventorysystem.dto.security;

import com.bamikahub.inventorysystem.models.security.SecurityEvent;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SecurityEventDto {
    private Long id;
    private String eventType;
    private String severity;
    private String description;
    private String ipAddress;
    private String location;
    private Boolean isSuspicious;
    private Boolean requiresAction;
    private LocalDateTime createdAt;
    
    public static SecurityEventDto fromEntity(SecurityEvent event) {
        SecurityEventDto dto = new SecurityEventDto();
        dto.setId(event.getId());
        dto.setEventType(event.getEventType().toString());
        dto.setSeverity(event.getSeverity().toString());
        dto.setDescription(event.getDescription());
        dto.setIpAddress(event.getIpAddress());
        dto.setLocation(event.getLocation());
        dto.setIsSuspicious(event.getIsSuspicious());
        dto.setRequiresAction(event.getRequiresAction());
        dto.setCreatedAt(event.getCreatedAt());
        return dto;
    }
}
