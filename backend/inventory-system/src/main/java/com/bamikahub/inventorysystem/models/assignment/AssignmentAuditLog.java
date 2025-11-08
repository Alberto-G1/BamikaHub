package com.bamikahub.inventorysystem.models.assignment;

import com.bamikahub.inventorysystem.models.user.User;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "assignment_audit_logs")
public class AssignmentAuditLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignment_id", nullable = false)
    private Assignment assignment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "actor_id", nullable = false)
    private User actor;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 60)
    private AuditAction actionType;

    @Column(length = 255)
    private String actionDescription;

    @Column(columnDefinition = "TEXT")
    private String metadataJson; // Flexible JSON blob

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public enum AuditAction {
        ASSIGNMENT_CREATED,
        ACTIVITY_CREATED,
        ACTIVITY_UPDATED,
        ACTIVITY_DELETED,
        ACTIVITY_COMPLETED,
        ACTIVITY_REOPENED,
        EVIDENCE_SUBMITTED,
        PROGRESS_AUTO_UPDATED,
        FINAL_REPORT_SUBMITTED,
        STATUS_CHANGED,
        ASSIGNMENT_APPROVED,
        ASSIGNMENT_REJECTED,
        ASSIGNMENT_RETURNED,
        ASSIGNMENT_OVERDUE,
        OVERDUE_CLEARED,
        DEADLINE_REMINDER,
        ASSIGNMENT_REOPENED
    }
}
