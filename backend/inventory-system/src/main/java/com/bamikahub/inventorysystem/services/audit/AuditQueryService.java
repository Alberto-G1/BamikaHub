package com.bamikahub.inventorysystem.services.audit;

import com.bamikahub.inventorysystem.dao.AuditLogRepository;
import com.bamikahub.inventorysystem.dao.assignment.AssignmentAuditLogRepository;
import com.bamikahub.inventorysystem.dao.user.UserRepository;
import com.bamikahub.inventorysystem.dto.audit.AuditFilterDto;
import com.bamikahub.inventorysystem.dto.audit.AuditLogDto;
import com.bamikahub.inventorysystem.models.audit.AuditLog;
import com.bamikahub.inventorysystem.models.assignment.AssignmentAuditLog;
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
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * Query service for retrieving and filtering audit logs
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuditQueryService {

    private final AuditLogRepository auditLogRepository;
    private final AssignmentAuditLogRepository assignmentAuditLogRepository;
    private final UserRepository userRepository;

    /**
     * Query audit logs with filters
     */
    @Transactional(readOnly = true)
    public List<AuditLogDto> queryAuditLogs(AuditFilterDto filters) {
        // Parse filters
        Long userId = filters.getUserId();
        String actionFilter = normalizeBlank(filters.getAction());
        String entityType = normalizeBlank(filters.getEntityType());
        Long entityId = filters.getEntityId();
        AuditLog.Severity severity = parseSeverity(filters.getSeverity());
        LocalDateTime startDate = parseDate(filters.getStartDate(), true);
        LocalDateTime endDate = parseDate(filters.getEndDate(), false);

        // Query general logs
        List<AuditLog> generalLogs = auditLogRepository.findByFilters(
                userId, actionFilter != null ? AuditLog.ActionType.valueOf(actionFilter) : null,
                entityType, entityId, severity, startDate, endDate
        );

        // Query assignment-specific logs
        List<AssignmentAuditLog> assignmentLogs = assignmentAuditLogRepository.findByFilters(
                userId, actionFilter != null ? AssignmentAuditLog.AuditAction.valueOf(actionFilter) : null,
                entityId, startDate, endDate
        );

        // Map and combine
        List<AuditLogDto> combinedLogs = Stream.concat(
                generalLogs.stream().map(this::mapToDto),
                assignmentLogs.stream().map(this::mapAssignmentLogToDto)
        )
        .sorted(Comparator.comparing(AuditLogDto::getTimestamp).reversed())
        .collect(Collectors.toList());

        return combinedLogs;
    }

    /**
     * Get recent activity for a specific user
     */
    @Transactional(readOnly = true)
    public List<AuditLogDto> getUserActivity(Long userId, int limit) {
        List<AuditLog> generalLogs = auditLogRepository.findRecentActivityByUser(userId);
        List<AssignmentAuditLog> assignmentLogs = assignmentAuditLogRepository.findRecentActivityByUser(userId);

        return Stream.concat(
                generalLogs.stream().map(this::mapToDto),
                assignmentLogs.stream().map(this::mapAssignmentLogToDto)
        )
        .sorted(Comparator.comparing(AuditLogDto::getTimestamp).reversed())
        .limit(limit)
        .collect(Collectors.toList());
    }

    /**
     * Get audit logs for a specific entity
     */
    @Transactional(readOnly = true)
    public List<AuditLogDto> getEntityHistory(String entityType, Long entityId) {
        if ("Assignment".equalsIgnoreCase(entityType)) {
            return assignmentAuditLogRepository.findByAssignmentIdOrderByCreatedAtDesc(entityId)
                    .stream()
                    .map(this::mapAssignmentLogToDto)
                    .collect(Collectors.toList());
        }

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
        return Stream.concat(
                Stream.of(AuditLog.ActionType.values()).map(Enum::name),
                Stream.of(AssignmentAuditLog.AuditAction.values()).map(Enum::name)
        )
        .distinct()
        .sorted()
        .collect(Collectors.toList());
    }

    /**
     * Get action counts for a specific user
     */
    @Transactional(readOnly = true)
    public long getUserActionCount(Long userId) {
        long generalCount = auditLogRepository.countByActorId(userId);
        long assignmentCount = assignmentAuditLogRepository.countByActorId(userId);
        return generalCount + assignmentCount;
    }

    /**
     * Helper methods for parsing and mapping
     */
    private AuditLog.ActionType parseActionType(String action) {
        if (action == null || action.trim().isEmpty()) return null;
        try {
            return AuditLog.ActionType.valueOf(action.toUpperCase());
        } catch (IllegalArgumentException e) {
            return null; // Or handle error
        }
    }

    private AuditLog.Severity parseSeverity(String severity) {
        if (severity == null || severity.trim().isEmpty()) return null;
        try {
            return AuditLog.Severity.valueOf(severity.toUpperCase());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    private LocalDateTime parseDate(String dateStr, boolean startOfDay) {
        if (dateStr == null || dateStr.trim().isEmpty()) return null;
        try {
            LocalDate date = LocalDate.parse(dateStr, DateTimeFormatter.ISO_LOCAL_DATE);
            return startOfDay ? date.atStartOfDay() : date.atTime(23, 59, 59);
        } catch (Exception e) {
            return null;
        }
    }

    private String normalizeBlank(String input) {
        return (input == null || input.trim().isEmpty()) ? null : input.trim();
    }

    private AuditLogDto mapToDto(AuditLog log) {
        if (log == null) return null;
        AuditLogDto dto = new AuditLogDto();
        dto.setId(log.getId());
        dto.setTimestamp(log.getTimestamp() != null ? log.getTimestamp().toString() : null);
        dto.setActorId(log.getActor() != null ? log.getActor().getId() : null);
        dto.setActorName(log.getActor() != null ? log.getActor().getUsername() : "System");
        dto.setAction(log.getAction() != null ? log.getAction().toString() : "UNKNOWN");
        dto.setEntityType(log.getEntityType());
        dto.setEntityId(log.getEntityId());
        dto.setSeverity(log.getSeverity() != null ? log.getSeverity().toString() : "INFO");
        dto.setDetails(log.getDetails());
        // The general AuditLog uses the 'details' field for metadata-like content.
        dto.setMetadata(log.getDetails());
        return dto;
    }

    private AuditLogDto mapAssignmentLogToDto(AssignmentAuditLog log) {
        if (log == null) return null;
        AuditLogDto dto = new AuditLogDto();
        dto.setId(log.getId());
        dto.setTimestamp(log.getCreatedAt() != null ? log.getCreatedAt().toString() : null);
        dto.setActorId(log.getActor() != null ? log.getActor().getId() : null);
        dto.setActorName(log.getActor() != null ? log.getActor().getUsername() : "System");
        dto.setAction(log.getActionType() != null ? log.getActionType().toString() : "UNKNOWN");
        dto.setEntityType("Assignment");
        dto.setEntityId(log.getAssignment() != null ? log.getAssignment().getId() : null);
        dto.setSeverity(log.getActionType().getSeverity().toString());
        dto.setDetails(log.getActionType().getDescription());
        dto.setMetadata(log.getMetadataJson());
        return dto;
    }
}
