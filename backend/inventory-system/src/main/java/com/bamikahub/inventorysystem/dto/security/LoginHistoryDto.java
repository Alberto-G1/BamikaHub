package com.bamikahub.inventorysystem.dto.security;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class LoginHistoryDto {
    private Long id;
    private String userEmail;
    private String ipAddress;
    private String userAgent;
    private String location;
    private boolean successful;
    private String failureReason;
    private LocalDateTime loginTime;
    private String deviceType;
    private String browser;
}