package com.bamikahub.inventorysystem.dao.assignment;

import com.bamikahub.inventorysystem.models.assignment.Assignment;
import com.bamikahub.inventorysystem.models.assignment.AssignmentAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface AssignmentAuditLogRepository extends JpaRepository<AssignmentAuditLog, Long> {
    List<AssignmentAuditLog> findByAssignmentOrderByCreatedAtDesc(Assignment assignment);

    @Query("SELECT a FROM AssignmentAuditLog a WHERE a.assignment.id = :assignmentId ORDER BY a.createdAt DESC")
    List<AssignmentAuditLog> findByAssignmentIdOrderByCreatedAtDesc(@Param("assignmentId") Long assignmentId);

    @Query("SELECT a FROM AssignmentAuditLog a WHERE a.actor.id = :userId ORDER BY a.createdAt DESC")
    List<AssignmentAuditLog> findRecentActivityByUser(@Param("userId") Long userId);

    @Query("SELECT a FROM AssignmentAuditLog a WHERE " +
            "(:userId IS NULL OR a.actor.id = :userId) AND " +
            "(:action IS NULL OR a.actionType = :action) AND " +
            "(:assignmentId IS NULL OR a.assignment.id = :assignmentId) AND " +
            "(:startDate IS NULL OR a.createdAt >= :startDate) AND " +
            "(:endDate IS NULL OR a.createdAt <= :endDate) " +
            "ORDER BY a.createdAt DESC")
    List<AssignmentAuditLog> findByFilters(
            @Param("userId") Long userId,
            @Param("action") AssignmentAuditLog.AuditAction action,
            @Param("assignmentId") Long assignmentId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );

    long countByActorId(Long actorId);
}
