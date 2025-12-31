package com.bamikahub.inventorysystem.services.security;

import com.bamikahub.inventorysystem.dao.security.UserSessionRepository;
import com.bamikahub.inventorysystem.models.security.UserSession;
import com.bamikahub.inventorysystem.models.user.User;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@Slf4j
public class SessionManagementService {

    @Autowired
    private UserSessionRepository sessionRepository;

    @Autowired
    private SecurityAuditService auditService;

    /**
     * Create a new session for user
     */
    @Transactional
    public UserSession createSession(User user, HttpServletRequest request, int sessionTimeoutMinutes) {
        String sessionToken = generateSessionToken();
        String ipAddress = extractIpAddress(request);
        String userAgent = request.getHeader("User-Agent");
        
        UserSession session = new UserSession();
        session.setUser(user);
        session.setSessionToken(sessionToken);
        session.setIpAddress(ipAddress);
        session.setUserAgent(userAgent);
        session.setDeviceType(detectDeviceType(userAgent));
        session.setBrowser(extractBrowser(userAgent));
        session.setOperatingSystem(extractOS(userAgent));
        session.setDeviceFingerprint(generateDeviceFingerprint(userAgent, ipAddress));
        session.setExpiresAt(LocalDateTime.now().plusMinutes(sessionTimeoutMinutes));
        session.setIsActive(true);

        UserSession savedSession = sessionRepository.save(session);
        
        auditService.logSecurityEvent(
            user,
            "SESSION_CREATED",
            "LOW",
            "New session created",
            ipAddress,
            userAgent,
            null,
            savedSession.getId()
        );

        log.info("Created new session for user: {} from IP: {}", user.getEmail(), ipAddress);
        return savedSession;
    }

    /**
     * Get all active sessions for user
     */
    public List<UserSession> getActiveSessions(User user) {
        return sessionRepository.findActiveSessionsByUser(user, LocalDateTime.now());
    }

    /**
     * Terminate a specific session
     */
    @Transactional
    public void terminateSession(Long sessionId, User user, String reason) {
        Optional<UserSession> sessionOpt = sessionRepository.findById(sessionId);
        if (sessionOpt.isPresent()) {
            UserSession session = sessionOpt.get();
            if (!session.getUser().getId().equals(user.getId())) {
                throw new SecurityException("Cannot terminate session of another user");
            }
            
            session.terminate(reason);
            sessionRepository.save(session);

            auditService.logSecurityEvent(
                user,
                "SESSION_TERMINATED",
                "LOW",
                "Session terminated: " + reason,
                session.getIpAddress(),
                session.getUserAgent(),
                null,
                sessionId
            );

            log.info("Terminated session {} for user: {}", sessionId, user.getEmail());
        }
    }

    /**
     * Terminate all sessions for a user (e.g., after password change)
     */
    @Transactional
    public void terminateAllUserSessions(User user, String reason) {
        sessionRepository.terminateAllUserSessions(user, LocalDateTime.now(), reason);
        
        auditService.logSecurityEvent(
            user,
            "ALL_SESSIONS_TERMINATED",
            "MEDIUM",
            "All sessions terminated: " + reason,
            null,
            null,
            null,
            null
        );

        log.info("Terminated all sessions for user: {}", user.getEmail());
    }

    /**
     * Update session activity timestamp
     */
    @Transactional
    public void updateSessionActivity(String sessionToken) {
        Optional<UserSession> sessionOpt = sessionRepository.findBySessionToken(sessionToken);
        if (sessionOpt.isPresent()) {
            UserSession session = sessionOpt.get();
            session.updateActivity();
            sessionRepository.save(session);
        }
    }

    /**
     * Validate session token
     */
    public boolean isValidSession(String sessionToken) {
        Optional<UserSession> sessionOpt = sessionRepository.findBySessionToken(sessionToken);
        if (sessionOpt.isEmpty()) {
            return false;
        }

        UserSession session = sessionOpt.get();
        if (!session.getIsActive() || session.isExpired()) {
            return false;
        }

        return true;
    }

    /**
     * Get session count for user
     */
    public long getActiveSessionCount(User user) {
        return sessionRepository.countActiveSessionsByUser(user);
    }

    /**
     * Scheduled task to clean up expired sessions
     */
    @Scheduled(cron = "0 */15 * * * *") // Every 15 minutes
    @Transactional
    public void cleanupExpiredSessions() {
        int terminatedCount = sessionRepository.terminateExpiredSessions(
            LocalDateTime.now(),
            LocalDateTime.now(),
            "Session expired"
        );
        if (terminatedCount > 0) {
            log.info("Cleaned up {} expired sessions", terminatedCount);
        }
    }

    // Helper methods
    private String generateSessionToken() {
        return UUID.randomUUID().toString() + "-" + System.currentTimeMillis();
    }

    private String extractIpAddress(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("X-Real-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        return ip != null ? ip.split(",")[0].trim() : "unknown";
    }

    private String detectDeviceType(String userAgent) {
        if (userAgent == null) return "UNKNOWN";
        userAgent = userAgent.toLowerCase();
        if (userAgent.contains("mobile") || userAgent.contains("android") || userAgent.contains("iphone")) {
            return "MOBILE";
        } else if (userAgent.contains("tablet") || userAgent.contains("ipad")) {
            return "TABLET";
        }
        return "DESKTOP";
    }

    private String extractBrowser(String userAgent) {
        if (userAgent == null) return "Unknown";
        if (userAgent.contains("Edg/")) return "Edge";
        if (userAgent.contains("Chrome/")) return "Chrome";
        if (userAgent.contains("Firefox/")) return "Firefox";
        if (userAgent.contains("Safari/") && !userAgent.contains("Chrome")) return "Safari";
        if (userAgent.contains("Opera") || userAgent.contains("OPR/")) return "Opera";
        return "Unknown";
    }

    private String extractOS(String userAgent) {
        if (userAgent == null) return "Unknown";
        if (userAgent.contains("Windows")) return "Windows";
        if (userAgent.contains("Mac OS")) return "macOS";
        if (userAgent.contains("Linux")) return "Linux";
        if (userAgent.contains("Android")) return "Android";
        if (userAgent.contains("iOS") || userAgent.contains("iPhone") || userAgent.contains("iPad")) return "iOS";
        return "Unknown";
    }

    private String generateDeviceFingerprint(String userAgent, String ipAddress) {
        try {
            String data = userAgent + "|" + ipAddress;
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(data.getBytes());
            return Base64.getEncoder().encodeToString(hash);
        } catch (NoSuchAlgorithmException e) {
            log.error("Error generating device fingerprint", e);
            return UUID.randomUUID().toString();
        }
    }
}
