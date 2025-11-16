package com.bamikahub.inventorysystem.controllers.security;

import com.bamikahub.inventorysystem.dto.security.*;
import com.bamikahub.inventorysystem.services.security.SecurityService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/security")
public class SecurityController {

    @Autowired
    private SecurityService securityService;

    // Password Management

    @PostMapping("/password/change")
    public ResponseEntity<Void> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        securityService.changePassword(request);
        return ResponseEntity.ok().build();
    }

    // Two-Factor Authentication

    @GetMapping("/2fa/status")
    public ResponseEntity<TwoFactorSetupDto> getTwoFactorStatus() {
        TwoFactorSetupDto status = securityService.getTwoFactorStatus();
        return ResponseEntity.ok(status);
    }

    @PostMapping("/2fa/enable")
    public ResponseEntity<TwoFactorSetupDto> enableTwoFactor() {
        TwoFactorSetupDto setup = securityService.enableTwoFactor();
        return ResponseEntity.ok(setup);
    }

    @PostMapping("/2fa/disable")
    public ResponseEntity<Void> disableTwoFactor() {
        securityService.disableTwoFactor();
        return ResponseEntity.ok().build();
    }

    // Login History

    @GetMapping("/login-history")
    public ResponseEntity<Page<LoginHistoryDto>> getLoginHistory(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<LoginHistoryDto> history = securityService.getLoginHistory(pageable);
        return ResponseEntity.ok(history);
    }

    // Security Alerts

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

    // Admin endpoints for managing user security

    @GetMapping("/users/{userId}/login-history")
    @PreAuthorize("hasAuthority('SECURITY_READ')")
    public ResponseEntity<Page<LoginHistoryDto>> getUserLoginHistory(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        // TODO: Implement admin access to user login history
        // This would require modifying the service to accept userId parameter
        return ResponseEntity.ok(null);
    }

    @GetMapping("/users/{userId}/alerts")
    @PreAuthorize("hasAuthority('SECURITY_READ')")
    public ResponseEntity<Page<SecurityAlertDto>> getUserSecurityAlerts(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        // TODO: Implement admin access to user security alerts
        // This would require modifying the service to accept userId parameter
        return ResponseEntity.ok(null);
    }

    @PostMapping("/users/{userId}/force-password-reset")
    @PreAuthorize("hasAuthority('SECURITY_UPDATE')")
    public ResponseEntity<Void> forcePasswordReset(@PathVariable Long userId) {
        // TODO: Implement forced password reset for users
        // This would require additional service methods
        return ResponseEntity.ok().build();
    }
}