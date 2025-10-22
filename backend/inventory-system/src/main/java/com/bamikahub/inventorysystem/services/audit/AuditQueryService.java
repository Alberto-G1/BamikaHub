package com.bamikahub.inventorysystem.services.audit;

import com.bamikahub.inventorysystem.dao.AuditLogRepository;

import com.bamikahub.inventorysystem.dao.user.UserRepository;
import com.bamikahub.inventorysystem.dto.audit.AuditFilterDto;
import com.bamikahub.inventorysystem.dto.audit.AuditLogDto;
import com.bamikahub.inventorysystem.models.audit.AuditLog;
import com.bamikahub.inventorysystem.models.user.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Query service for retrieving and filtering audit logs
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuditQueryService {

    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;

    /**
     * Query audit logs with filters
     */
    @Transactional(readOnly = true)
    public List<AuditLogDto> queryAuditLogs(AuditFilterDto filters) {
        // Parse filters
    Long userId = filters.getUserId();
    AuditLog.ActionType action = parseActionType(filters.getAction());
    String entityType = normalizeBlank(filters.getEntityType());
    Long entityId = filters.getEntityId();
    AuditLog.Severity severity = parseSeverity(filters.getSeverity());
        LocalDateTime startDate = parseDate(filters.getStartDate(), true);
        LocalDateTime endDate = parseDate(filters.getEndDate(), false);

        // Query with filters
        List<AuditLog> logs = auditLogRepository.findByFilters(
                userId, action, entityType, entityId, severity, startDate, endDate
        );

        return logs.stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    /**
     * Get recent activity for a specific user
     */
    @Transactional(readOnly = true)
    public List<AuditLogDto> getUserActivity(Long userId, int limit) {
        List<AuditLog> logs = auditLogRepository.findRecentActivityByUser(userId);
        return logs.stream()
                .limit(limit)
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    /**
     * Get audit logs for a specific entity
     */
    @Transactional(readOnly = true)
    public List<AuditLogDto> getEntityHistory(String entityType, Long entityId) {
        List<AuditLog> logs = auditLogRepository.findByEntityTypeAndEntityIdOrderByTimestampDesc(
                entityType, entityId
        );
        return logs.stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    /**
     * Get critical actions from the last N days
     */
    @Transactional(readOnly = true)
    public List<AuditLogDto> getCriticalActions(int days) {
        LocalDateTime since = LocalDateTime.now().minusDays(days);
        List<AuditLog> logs = auditLogRepository.findCriticalActionsSince(since);
        return logs.stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    /**
     * Get all available action types
     */
    public List<String> getAvailableActionTypes() {
        return List.of(AuditLog.ActionType.values()).stream()
                .map(Enum::name)
                .collect(Collectors.toList());
    }

    /**
     * Get audit statistics for a user
     */
    @Transactional(readOnly = true)
    public Long getUserActionCount(Long userId) {
        return auditLogRepository.countByUser(userId);
    }

    /**
     * Map AuditLog entity to DTO
     */
    private AuditLogDto mapToDto(AuditLog log) {
        User actor = log.getActor();
        String actorName = actor.getFirstName() + " " + actor.getLastName();
        return AuditLogDto.builder()
                .id(log.getId())
                .actorId(actor.getId())
                .actorName(actorName)
                .actorEmail(actor.getEmail())
                .action(log.getAction().name())
                .entityType(log.getEntityType())
                .entityId(log.getEntityId())
                .entityName(log.getEntityName())
                .details(log.getDetails())
                .ipAddress(log.getIpAddress())
                .severity(log.getSeverity().name())
                .timestamp(log.getTimestamp().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME))
                .build();
    }

    /**
     * Parse action type from string
     */
    private AuditLog.ActionType parseActionType(String action) {
        if (action == null || action.isEmpty()) {
            return null;
        }
        try {
            return AuditLog.ActionType.valueOf(action);
        } catch (IllegalArgumentException e) {
            log.warn("Invalid action type: {}", action);
            return null;
        }
    }

    /**
     * Parse severity from string
     */
    private AuditLog.Severity parseSeverity(String severity) {
        if (severity == null || severity.isEmpty()) {
            return null;
        }
        try {
            return AuditLog.Severity.valueOf(severity);
        } catch (IllegalArgumentException e) {
            log.warn("Invalid severity: {}", severity);
            return null;
        }
    }

    /**
     * Parse date string to LocalDateTime
     */
    private LocalDateTime parseDate(String dateStr, boolean startOfDay) {
        if (dateStr == null || dateStr.isEmpty()) {
            return null;
        }
        try {
            LocalDate date = LocalDate.parse(dateStr, DateTimeFormatter.ISO_LOCAL_DATE);
            return startOfDay ? date.atStartOfDay() : date.atTime(23, 59, 59);
        } catch (Exception e) {
            log.warn("Invalid date format: {}", dateStr);
            return null;
        }
    }

    private String normalizeBlank(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
