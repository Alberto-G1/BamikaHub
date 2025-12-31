package com.bamikahub.inventorysystem.controllers.security;

import com.bamikahub.inventorysystem.dto.security.*;
import com.bamikahub.inventorysystem.models.user.User;
import com.bamikahub.inventorysystem.models.security.SecurityEvent;
import com.bamikahub.inventorysystem.dao.user.UserRepository;
import com.bamikahub.inventorysystem.services.security.SecurityService;
import com.bamikahub.inventorysystem.services.security.SessionManagementService;
import com.bamikahub.inventorysystem.services.security.TOTPService;
import com.bamikahub.inventorysystem.services.security.SecurityAuditService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/security")
public class SecurityController {

    @Autowired
    private SecurityService securityService;

    @Autowired
    private SessionManagementService sessionManagementService;

    @Autowired
    private TOTPService totpService;

    @Autowired
    private SecurityAuditService securityAuditService;

    @Autowired
    private UserRepository userRepository;

    // Password Management

    @PostMapping("/password/change")
    public ResponseEntity<Void> changePassword(@Valid @RequestBody ChangePasswordRequest request, Authentication authentication) {
        securityService.changePassword(request);
        // Terminate all other sessions after password change
        User user = userRepository.findByEmail(authentication.getName())
            .orElseThrow(() -> new RuntimeException("User not found"));
        sessionManagementService.terminateAllUserSessions(user, "Password changed");
        return ResponseEntity.ok().build();
    }

    // Security Dashboard

    @GetMapping("/dashboard")
    public ResponseEntity<SecurityDashboardDto> getSecurityDashboard(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Get active sessions
        List<UserSessionDto> activeSessions = sessionManagementService.getActiveSessions(user).stream()
            .map(UserSessionDto::fromEntity)
            .collect(Collectors.toList());
        
        // Get recent security events
        List<SecurityEventDto> recentEvents = securityAuditService.getRecentEvents(user, 10).stream()
            .map(SecurityEventDto::fromEntity)
            .collect(Collectors.toList());
        
        // Get security statistics
        SecurityAuditService.SecurityStatistics stats = securityAuditService.getSecurityStatistics(user);
        
        SecurityDashboardDto dashboard = new SecurityDashboardDto();
        dashboard.setActiveSessionsCount((long) activeSessions.size());
        dashboard.setTrustedDevicesCount(0L); // TODO: Implement trusted devices count
        dashboard.setRecentLoginsCount((long) stats.getLoginAttempts());
        dashboard.setFailedLoginsCount((long) stats.getFailedLogins());
        dashboard.setSuspiciousEventsCount((long) stats.getSuspiciousEvents());
        dashboard.setTwoFactorEnabled(user.isTwoFactorEnabled());
        dashboard.setRecentEvents(recentEvents);
        dashboard.setActiveSessions(activeSessions);
        
        return ResponseEntity.ok(dashboard);
    }

    // Session Management

    @GetMapping("/sessions")
    public ResponseEntity<List<UserSessionDto>> getActiveSessions(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
            .orElseThrow(() -> new RuntimeException("User not found"));
        List<UserSessionDto> sessions = sessionManagementService.getActiveSessions(user).stream()
            .map(UserSessionDto::fromEntity)
            .collect(Collectors.toList());
        return ResponseEntity.ok(sessions);
    }

    @DeleteMapping("/sessions/{sessionId}")
    public ResponseEntity<Void> terminateSession(@PathVariable Long sessionId, Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
            .orElseThrow(() -> new RuntimeException("User not found"));
        sessionManagementService.terminateSession(sessionId, user, "User terminated session");
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/sessions")
    public ResponseEntity<Void> terminateAllSessions(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
            .orElseThrow(() -> new RuntimeException("User not found"));
        sessionManagementService.terminateAllUserSessions(user, "User terminated all sessions");
        return ResponseEntity.ok().build();
    }

    // Enhanced Two-Factor Authentication with TOTP

    @PostMapping("/2fa/setup")
    public ResponseEntity<TOTPSetupDto> setupTwoFactor(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        try {
            // Generate new secret key
            String secret = totpService.generateSecretKey();
            
            // Generate QR code
            String qrCode = totpService.generateQRCodeBase64(secret, user.getUsername(), "BamikaHub");
            
            // Format manual entry key
            String manualKey = secret.replaceAll("(.{4})", "$1 ").trim();
            
            TOTPSetupDto setup = new TOTPSetupDto();
            setup.setSecret(secret);
            setup.setQrCodeBase64(qrCode);
            setup.setManualEntryKey(manualKey);
            
            return ResponseEntity.ok(setup);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/2fa/verify")
    public ResponseEntity<Map<String, String>> verifyAndEnableTwoFactor(
            @RequestBody Map<String, String> request, 
            Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
            .orElseThrow(() -> new RuntimeException("User not found"));
        String secret = request.get("secret");
        String code = request.get("code");
        
        boolean isValid = totpService.verifyCode(secret, code);
        
        if (isValid) {
            // Save secret to user and enable 2FA
            user.setTwoFactorSecret(secret);
            user.setTwoFactorEnabled(true);
            userRepository.save(user);
            
            // Log security event
            securityAuditService.logSecurityEvent(
                user,
                "TWO_FACTOR_ENABLED",
                "LOW",
                "Two-factor authentication enabled",
                null, null, null, null
            );
            
            return ResponseEntity.ok(Map.of("message", "Two-factor authentication enabled successfully"));
        } else {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid verification code"));
        }
    }

    @DeleteMapping("/2fa")
    public ResponseEntity<Map<String, String>> disableTwoFactor(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        user.setTwoFactorSecret(null);
        user.setTwoFactorEnabled(false);
        userRepository.save(user);
        
        // Log security event
        securityAuditService.logSecurityEvent(
            user,
            "TWO_FACTOR_DISABLED",
            "MEDIUM",
            "Two-factor authentication disabled",
            null, null, null, null
        );
        
        return ResponseEntity.ok(Map.of("message", "Two-factor authentication disabled"));
    }

    @GetMapping("/2fa/status")
    public ResponseEntity<Map<String, Object>> getTwoFactorStatus(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
            .orElseThrow(() -> new RuntimeException("User not found"));
        boolean enabled = user.isTwoFactorEnabled();
        
        return ResponseEntity.ok(Map.of(
            "enabled", enabled,
            "hasSecret", user.getTwoFactorSecret() != null && !user.getTwoFactorSecret().isEmpty()
        ));
    }

    // Security Events

    @GetMapping("/events")
    public ResponseEntity<List<SecurityEventDto>> getSecurityEvents(
            @RequestParam(defaultValue = "30") int days,
            Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
            .orElseThrow(() -> new RuntimeException("User not found"));
        List<SecurityEventDto> events = securityAuditService.getEventsSince(user, days).stream()
            .map(SecurityEventDto::fromEntity)
            .collect(Collectors.toList());
        return ResponseEntity.ok(events);
    }

    @GetMapping("/events/suspicious")
    public ResponseEntity<List<SecurityEventDto>> getSuspiciousEvents(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
            .orElseThrow(() -> new RuntimeException("User not found"));
        List<SecurityEventDto> events = securityAuditService.getSuspiciousEvents(user).stream()
            .map(SecurityEventDto::fromEntity)
            .collect(Collectors.toList());
        return ResponseEntity.ok(events);
    }

    @PostMapping("/events/{eventId}/resolve")
    public ResponseEntity<Void> resolveSecurityEvent(
            @PathVariable Long eventId,
            @RequestBody Map<String, String> request,
            Authentication authentication) {
        String action = request.get("action");
        securityAuditService.resolveEvent(eventId, action);
        return ResponseEntity.ok().build();
    }

    // Legacy endpoints (keeping for backward compatibility)

    // Legacy endpoints (keeping for backward compatibility)

    @GetMapping("/login-history")
    public ResponseEntity<Page<LoginHistoryDto>> getLoginHistory(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<LoginHistoryDto> history = securityService.getLoginHistory(pageable);
        return ResponseEntity.ok(history);
    }

    @GetMapping("/alerts")
    public ResponseEntity<Page<SecurityAlertDto>> getSecurityAlerts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<SecurityAlertDto> alerts = securityService.getSecurityAlerts(pageable);
        return ResponseEntity.ok(alerts);
    }

    @PostMapping("/alerts/{alertId}/acknowledge")
    public ResponseEntity<Void> acknowledgeAlert(@PathVariable Long alertId) {
        securityService.acknowledgeAlert(alertId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/alerts/unacknowledged/count")
    public ResponseEntity<Long> getUnacknowledgedAlertCount() {
        long count = securityService.getUnacknowledgedAlertCount();
        return ResponseEntity.ok(count);
    }

    // Admin endpoints

    @GetMapping("/users/{userId}/login-history")
    @PreAuthorize("hasAuthority('SECURITY_READ')")
    public ResponseEntity<Page<LoginHistoryDto>> getUserLoginHistory(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(null);
    }

    @GetMapping("/users/{userId}/alerts")
    @PreAuthorize("hasAuthority('SECURITY_READ')")
    public ResponseEntity<Page<SecurityAlertDto>> getUserSecurityAlerts(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(null);
    }

    @PostMapping("/users/{userId}/force-password-reset")
    @PreAuthorize("hasAuthority('SECURITY_UPDATE')")
    public ResponseEntity<Void> forcePasswordReset(@PathVariable Long userId) {
        return ResponseEntity.ok().build();
    }
}