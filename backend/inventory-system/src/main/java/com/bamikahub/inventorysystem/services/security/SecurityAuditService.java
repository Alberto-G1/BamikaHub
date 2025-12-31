package com.bamikahub.inventorysystem.services.security;

import com.bamikahub.inventorysystem.dao.security.SecurityEventRepository;
import com.bamikahub.inventorysystem.models.security.SecurityEvent;
import com.bamikahub.inventorysystem.models.user.User;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Slf4j
public class SecurityAuditService {

    @Autowired
    private SecurityEventRepository eventRepository;

    /**
     * Log a security event
     */
    @Transactional
    public SecurityEvent logSecurityEvent(
        User user,
        String eventType,
        String severity,
        String description,
        String ipAddress,
        String userAgent,
        String deviceFingerprint,
        Long sessionId
    ) {
        SecurityEvent event = new SecurityEvent();
        event.setUser(user);
        event.setEventType(eventType);
        event.setSeverity(severity);
        event.setDescription(description);
        event.setIpAddress(ipAddress);
        event.setUserAgent(userAgent);
        event.setDeviceFingerprint(deviceFingerprint);
        event.setSessionId(sessionId);
        event.setIsSuspicious(isSuspiciousEvent(eventType));
        event.setRequiresAction(requiresAction(eventType, severity));

        SecurityEvent savedEvent = eventRepository.save(event);
        log.info("Security event logged: {} for user: {}", eventType, user != null ? user.getEmail() : "N/A");
        
        return savedEvent;
    }

    /**
     * Get recent security events for user
     */
    public List<SecurityEvent> getRecentEvents(User user, int limit) {
        return eventRepository.findByUserOrderByCreatedAtDesc(user, PageRequest.of(0, limit)).getContent();
    }

    /**
     * Get security events for last N days
     */
    public List<SecurityEvent> getEventsSince(User user, int days) {
        LocalDateTime since = LocalDateTime.now().minusDays(days);
        return eventRepository.findRecentEventsByUser(user, since);
    }

    /**
     * Get suspicious events for user
     */
    public List<SecurityEvent> getSuspiciousEvents(User user) {
        return eventRepository.findByUserAndIsSuspiciousTrueOrderByCreatedAtDesc(user);
    }

    /**
     * Get events requiring action
     */
    public List<SecurityEvent> getEventsRequiringAction(User user) {
        return eventRepository.findByUserAndRequiresActionTrueOrderByCreatedAtDesc(user);
    }

    /**
     * Mark event as resolved
     */
    @Transactional
    public void resolveEvent(Long eventId, String action) {
        SecurityEvent event = eventRepository.findById(eventId)
            .orElseThrow(() -> new RuntimeException("Security event not found"));
        event.markResolved(action);
        eventRepository.save(event);
        log.info("Security event {} resolved with action: {}", eventId, action);
    }

    /**
     * Get security statistics for user
     */
    public SecurityStatistics getSecurityStatistics(User user) {
        LocalDateTime last30Days = LocalDateTime.now().minusDays(30);
        
        long loginAttempts = eventRepository.countEventsByTypeAndUser(user, "LOGIN_SUCCESS", last30Days);
        long failedLogins = eventRepository.countEventsByTypeAndUser(user, "LOGIN_FAILED", last30Days);
        long suspiciousEvents = eventRepository.countSuspiciousEventsByUser(user, last30Days);
        long passwordChanges = eventRepository.countEventsByTypeAndUser(user, "PASSWORD_CHANGED", last30Days);

        return new SecurityStatistics(loginAttempts, failedLogins, suspiciousEvents, passwordChanges);
    }

    // Helper methods
    private boolean isSuspiciousEvent(String eventType) {
        return eventType.equals("LOGIN_FAILED") ||
               eventType.equals("SUSPICIOUS_LOCATION") ||
               eventType.equals("MULTIPLE_FAILED_ATTEMPTS") ||
               eventType.equals("UNUSUAL_ACTIVITY");
    }

    private boolean requiresAction(String eventType, String severity) {
        if (severity.equals("CRITICAL")) return true;
        return eventType.equals("MULTIPLE_FAILED_ATTEMPTS") ||
               eventType.equals("ACCOUNT_LOCKED") ||
               eventType.equals("SUSPICIOUS_LOCATION");
    }

    // Inner class for statistics
    @lombok.Data
    @lombok.AllArgsConstructor
    public static class SecurityStatistics {
        private long loginAttempts;
        private long failedLogins;
        private long suspiciousEvents;
        private long passwordChanges;
    }
}
