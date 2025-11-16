package com.bamikahub.inventorysystem.services.security;

import com.bamikahub.inventorysystem.dao.security.LoginHistoryRepository;
import com.bamikahub.inventorysystem.dao.security.SecurityAlertRepository;
import com.bamikahub.inventorysystem.dao.user.UserRepository;
import com.bamikahub.inventorysystem.dto.security.*;
import com.bamikahub.inventorysystem.models.security.LoginHistory;
import com.bamikahub.inventorysystem.models.security.SecurityAlert;
import com.bamikahub.inventorysystem.models.user.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class SecurityService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private LoginHistoryRepository loginHistoryRepository;

    @Autowired
    private SecurityAlertRepository securityAlertRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // Password Management

    public void changePassword(ChangePasswordRequest request) {
        String currentUserEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Verify current password
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            createSecurityAlert(user, "PASSWORD_CHANGE_FAILED", "Failed password change attempt - incorrect current password", "HIGH");
            throw new RuntimeException("Current password is incorrect");
        }

        // Verify new passwords match
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new RuntimeException("New passwords do not match");
        }

        // Update password
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        // Create security alert
        createSecurityAlert(user, "PASSWORD_CHANGED", "Password successfully changed", "LOW");
    }

    // Two-Factor Authentication (Simplified - would need proper 2FA implementation)

    public TwoFactorSetupDto getTwoFactorStatus() {
        String currentUserEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        TwoFactorSetupDto dto = new TwoFactorSetupDto();
        dto.setEnabled(user.isTwoFactorEnabled());
        dto.setVerified(user.isTwoFactorEnabled()); // Simplified
        return dto;
    }

    public TwoFactorSetupDto enableTwoFactor() {
        String currentUserEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // In a real implementation, this would generate a secret key and QR code
        user.setTwoFactorEnabled(true);
        userRepository.save(user);

        TwoFactorSetupDto dto = new TwoFactorSetupDto();
        dto.setEnabled(true);
        dto.setSecretKey("SIMULATED_SECRET_KEY"); // Would be generated
        dto.setQrCodeUrl("SIMULATED_QR_URL"); // Would be generated
        dto.setBackupCodes("12345678,87654321"); // Would be generated
        dto.setVerified(false);

        createSecurityAlert(user, "TWO_FACTOR_ENABLED", "Two-factor authentication enabled", "LOW");
        return dto;
    }

    public void disableTwoFactor() {
        String currentUserEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setTwoFactorEnabled(false);
        userRepository.save(user);

        createSecurityAlert(user, "TWO_FACTOR_DISABLED", "Two-factor authentication disabled", "MEDIUM");
    }

    // Login History

    public Page<LoginHistoryDto> getLoginHistory(Pageable pageable) {
        String currentUserEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return loginHistoryRepository.findByUserOrderByLoginTimeDesc(user, pageable)
                .map(this::convertToLoginHistoryDto);
    }

    public void recordLoginAttempt(String email, String ipAddress, String userAgent, boolean successful, String failureReason) {
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) return; // Don't record attempts for non-existent users

        LoginHistory history = new LoginHistory();
        history.setUser(user);
        history.setIpAddress(ipAddress);
        history.setUserAgent(userAgent);
        history.setSuccessful(successful);
        history.setFailureReason(failureReason);

        // Extract basic device/browser info (simplified)
        if (userAgent != null) {
            if (userAgent.contains("Mobile")) {
                history.setDeviceType("Mobile");
            } else {
                history.setDeviceType("Desktop");
            }

            if (userAgent.contains("Chrome")) {
                history.setBrowser("Chrome");
            } else if (userAgent.contains("Firefox")) {
                history.setBrowser("Firefox");
            } else if (userAgent.contains("Safari")) {
                history.setBrowser("Safari");
            } else {
                history.setBrowser("Other");
            }
        }

        loginHistoryRepository.save(history);

        // Create security alert for failed login
        if (!successful && failureReason != null) {
            createSecurityAlert(user, "FAILED_LOGIN", "Failed login attempt from " + ipAddress, "MEDIUM");
        }
    }

    // Security Alerts

    public Page<SecurityAlertDto> getSecurityAlerts(Pageable pageable) {
        String currentUserEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return securityAlertRepository.findByUserOrderByCreatedAtDesc(user, pageable)
                .map(this::convertToSecurityAlertDto);
    }

    public void acknowledgeAlert(Long alertId) {
        String currentUserEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        SecurityAlert alert = securityAlertRepository.findById(alertId)
                .orElseThrow(() -> new RuntimeException("Alert not found"));

        if (!alert.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Access denied");
        }

        alert.setAcknowledged(true);
        alert.setAcknowledgedBy(currentUserEmail);
        securityAlertRepository.save(alert);
    }

    public long getUnacknowledgedAlertCount() {
        String currentUserEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return securityAlertRepository.countByUserAndAcknowledged(user, false);
    }

    // Helper Methods

    private void createSecurityAlert(User user, String alertType, String message, String severity) {
        SecurityAlert alert = new SecurityAlert();
        alert.setUser(user);
        alert.setAlertType(alertType);
        alert.setMessage(message);
        alert.setSeverity(severity);
        securityAlertRepository.save(alert);
    }

    private LoginHistoryDto convertToLoginHistoryDto(LoginHistory history) {
        LoginHistoryDto dto = new LoginHistoryDto();
        dto.setId(history.getId());
        dto.setUserEmail(history.getUser().getEmail());
        dto.setIpAddress(history.getIpAddress());
        dto.setUserAgent(history.getUserAgent());
        dto.setLocation(history.getLocation());
        dto.setSuccessful(history.isSuccessful());
        dto.setFailureReason(history.getFailureReason());
        dto.setLoginTime(history.getLoginTime());
        dto.setDeviceType(history.getDeviceType());
        dto.setBrowser(history.getBrowser());
        return dto;
    }

    private SecurityAlertDto convertToSecurityAlertDto(SecurityAlert alert) {
        SecurityAlertDto dto = new SecurityAlertDto();
        dto.setId(alert.getId());
        dto.setUserEmail(alert.getUser().getEmail());
        dto.setAlertType(alert.getAlertType());
        dto.setMessage(alert.getMessage());
        dto.setSeverity(alert.getSeverity());
        dto.setIpAddress(alert.getIpAddress());
        dto.setLocation(alert.getLocation());
        dto.setCreatedAt(alert.getCreatedAt());
        dto.setAcknowledged(alert.isAcknowledged());
        dto.setAcknowledgedAt(alert.getAcknowledgedAt());
        return dto;
    }
}