package com.bamikahub.inventorysystem.dto.security;

import com.bamikahub.inventorysystem.models.security.UserSession;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserSessionDto {
    private Long id;
    private String deviceType;
    private String browser;
    private String operatingSystem;
    private String ipAddress;
    private String location;
    private Boolean isCurrent;
    private Boolean isTrustedDevice;
    private LocalDateTime createdAt;
    private LocalDateTime lastActivity;
    private LocalDateTime expiresAt;
    
    public static UserSessionDto fromEntity(UserSession session) {
        UserSessionDto dto = new UserSessionDto();
        dto.setId(session.getId());
        dto.setDeviceType(session.getDeviceType());
        dto.setBrowser(session.getBrowser());
        dto.setOperatingSystem(session.getOperatingSystem());
        dto.setIpAddress(session.getIpAddress());
        dto.setLocation(session.getLocation());
        dto.setIsCurrent(false); // Will be set by controller if needed
        dto.setIsTrustedDevice(session.getIsTrustedDevice());
        dto.setCreatedAt(session.getCreatedAt());
        dto.setLastActivity(session.getLastActivity());
        dto.setExpiresAt(session.getExpiresAt());
        return dto;
    }
}
