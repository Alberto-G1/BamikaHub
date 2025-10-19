package com.bamikahub.inventorysystem.services.audit;

import com.bamikahub.inventorysystem.dao.AuditLogRepository;
import com.bamikahub.inventorysystem.models.audit.AuditLog;
import com.bamikahub.inventorysystem.models.user.User;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * Core Audit Service - Centralized logging for all system actions
 * 
 * Usage example:
 * auditService.logAction(currentUser, AuditLog.ActionType.USER_CREATED, "User", newUser.getId(), newUser.getFullName(), "New user registered");
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuditService {

    private final AuditLogRepository auditLogRepository;
    private final ObjectMapper objectMapper;
    private final HttpServletRequest request; // Auto-injected for IP/UserAgent

    /**
     * Primary audit logging method - Asynchronous to not block main operations
     * 
     * @param actor The user performing the action
     * @param action The type of action performed
     * @param entityType Type of entity (e.g., "User", "Project", "Requisition")
     * @param entityId ID of the affected entity
     * @param entityName Human-readable name of the entity
     * @param details Additional context (can be String or Object for JSON serialization)
     */
    @Async
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logAction(User actor, AuditLog.ActionType action, String entityType, 
                         Long entityId, String entityName, Object details) {
        try {
            String detailsJson = serializeDetails(details);
            AuditLog.Severity severity = determineSeverity(action);

            AuditLog auditLog = AuditLog.builder()
                    .actor(actor)
                    .action(action)
                    .entityType(entityType)
                    .entityId(entityId)
                    .entityName(entityName)
                    .details(detailsJson)
                    .ipAddress(getClientIp())
                    .userAgent(getUserAgent())
                    .severity(severity)
                    .build();

            auditLogRepository.save(auditLog);
            log.debug("Audit log created: {} - {} - {}", actor.getEmail(), action, entityName);
        } catch (Exception e) {
            // Never let audit logging failure break the main operation
            log.error("Failed to create audit log: {} - {}", action, e.getMessage(), e);
        }
    }

    /**
     * Simplified version for actions without entity details
     */
    @Async
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logAction(User actor, AuditLog.ActionType action, String details) {
        logAction(actor, action, null, null, null, details);
    }

    /**
     * Log with severity override
     */
    @Async
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logActionWithSeverity(User actor, AuditLog.ActionType action, String entityType,
                                      Long entityId, String entityName, Object details, 
                                      AuditLog.Severity severity) {
        try {
            String detailsJson = serializeDetails(details);

            AuditLog auditLog = AuditLog.builder()
                    .actor(actor)
                    .action(action)
                    .entityType(entityType)
                    .entityId(entityId)
                    .entityName(entityName)
                    .details(detailsJson)
                    .ipAddress(getClientIp())
                    .userAgent(getUserAgent())
                    .severity(severity)
                    .build();

            auditLogRepository.save(auditLog);
        } catch (Exception e) {
            log.error("Failed to create audit log: {} - {}", action, e.getMessage(), e);
        }
    }

    /**
     * Convert details object to JSON string
     */
    private String serializeDetails(Object details) {
        if (details == null) {
            return null;
        }
        if (details instanceof String) {
            return (String) details;
        }
        try {
            return objectMapper.writeValueAsString(details);
        } catch (JsonProcessingException e) {
            log.warn("Failed to serialize audit details, using toString()", e);
            return details.toString();
        }
    }

    /**
     * Automatically determine severity based on action type
     */
    private AuditLog.Severity determineSeverity(AuditLog.ActionType action) {
        String actionName = action.name();
        
        // Critical actions
        if (actionName.contains("DELETED") || 
            actionName.contains("DEACTIVATED") ||
            actionName.equals("REQUISITION_REJECTED") ||
            actionName.equals("BACKUP_RESTORED") ||
            actionName.equals("SYSTEM_CONFIG_CHANGED")) {
            return AuditLog.Severity.CRITICAL;
        }
        
        // Warning actions
        if (actionName.contains("PASSWORD_CHANGED") ||
            actionName.contains("ROLE_CHANGED") ||
            actionName.contains("ARCHIVED") ||
            actionName.contains("REJECTED")) {
            return AuditLog.Severity.WARNING;
        }
        
        // Default to INFO
        return AuditLog.Severity.INFO;
    }

    /**
     * Extract client IP address from request
     */
    private String getClientIp() {
        try {
            String ip = request.getHeader("X-Forwarded-For");
            if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
                ip = request.getHeader("Proxy-Client-IP");
            }
            if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
                ip = request.getHeader("WL-Proxy-Client-IP");
            }
            if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
                ip = request.getRemoteAddr();
            }
            return ip != null ? ip : "unknown";
        } catch (Exception e) {
            return "unknown";
        }
    }

    /**
     * Extract user agent from request
     */
    private String getUserAgent() {
        try {
            String userAgent = request.getHeader("User-Agent");
            return userAgent != null ? userAgent : "unknown";
        } catch (Exception e) {
            return "unknown";
        }
    }

    /**
     * Helper method to create a details map
     */
    public Map<String, Object> createDetailsMap() {
        return new HashMap<>();
    }

    /**
     * Helper to build change details
     */
    public String buildChangeDetails(String field, Object oldValue, Object newValue) {
        Map<String, Object> changes = new HashMap<>();
        changes.put("field", field);
        changes.put("oldValue", oldValue);
        changes.put("newValue", newValue);
        return serializeDetails(changes);
    }
}
