package com.bamikahub.inventorysystem.dto.security;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class SecurityAlertDto {
    private Long id;
    private String userEmail;
    private String alertType; // PASSWORD_CHANGE, SUSPICIOUS_LOGIN, FAILED_LOGIN_ATTEMPTS, etc.
    private String message;
    private String severity; // LOW, MEDIUM, HIGH, CRITICAL
    private String ipAddress;
    private String location;
    private LocalDateTime createdAt;
    private boolean acknowledged;
    private LocalDateTime acknowledgedAt;
}