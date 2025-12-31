package com.bamikahub.inventorysystem.dao;

import com.bamikahub.inventorysystem.models.audit.AuditLog;
import com.bamikahub.inventorysystem.models.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    // Find by user
    List<AuditLog> findByActorOrderByTimestampDesc(User actor);

    // Find by action type
    List<AuditLog> findByActionOrderByTimestampDesc(AuditLog.ActionType action);

    // Find by entity
    List<AuditLog> findByEntityTypeAndEntityIdOrderByTimestampDesc(String entityType, Long entityId);

    // Find by entity type containing (for settings audit)
    List<AuditLog> findByEntityTypeContainingOrderByTimestampDesc(String entityType);

    // Find by entity type containing and entity name (for specific setting audit)
    List<AuditLog> findByEntityTypeContainingAndEntityNameOrderByTimestampDesc(String entityType, String entityName);

    // Find by date range
    List<AuditLog> findByTimestampBetweenOrderByTimestampDesc(LocalDateTime startDate, LocalDateTime endDate);

    // Find by severity
    List<AuditLog> findBySeverityOrderByTimestampDesc(AuditLog.Severity severity);

    // Complex query with multiple filters
    @Query("SELECT a FROM AuditLog a WHERE " +
            "(:userId IS NULL OR a.actor.id = :userId) AND " +
            "(:action IS NULL OR a.action = :action) AND " +
            "(:entityType IS NULL OR a.entityType = :entityType) AND " +
            "(:entityId IS NULL OR a.entityId = :entityId) AND " +
            "(:severity IS NULL OR a.severity = :severity) AND " +
            "(:startDate IS NULL OR a.timestamp >= :startDate) AND " +
            "(:endDate IS NULL OR a.timestamp <= :endDate) " +
            "ORDER BY a.timestamp DESC")
    List<AuditLog> findByFilters(
            @Param("userId") Long userId,
            @Param("action") AuditLog.ActionType action,
            @Param("entityType") String entityType,
            @Param("entityId") Long entityId,
            @Param("severity") AuditLog.Severity severity,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );

    // Get recent activity for a user
    @Query("SELECT a FROM AuditLog a WHERE a.actor.id = :userId ORDER BY a.timestamp DESC")
    List<AuditLog> findRecentActivityByUser(@Param("userId") Long userId);

    // Count actions by user
    long countByActorId(Long actorId);

    // Get critical actions
    @Query("SELECT a FROM AuditLog a WHERE a.severity = 'CRITICAL' AND a.timestamp >= :since ORDER BY a.timestamp DESC")
    List<AuditLog> findCriticalActionsSince(@Param("since") LocalDateTime since);
}
