package com.bamikahub.inventorysystem.dto.security;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SecurityDashboardDto {
    private long activeSessionsCount;
    private long trustedDevicesCount;
    private long recentLoginsCount;
    private long failedLoginsCount;
    private long suspiciousEventsCount;
    private boolean twoFactorEnabled;
    private java.util.List<SecurityEventDto> recentEvents;
    private java.util.List<UserSessionDto> activeSessions;
}
