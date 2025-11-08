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
        // INFO Level
        ASSIGNMENT_CREATED(Severity.INFO, "A new assignment was created."),
        ACTIVITY_CREATED(Severity.INFO, "A new activity was added to an assignment."),
        ACTIVITY_UPDATED(Severity.INFO, "An activity was updated."),
        ACTIVITY_COMPLETED(Severity.INFO, "An activity was marked as complete."),
        ACTIVITY_REOPENED(Severity.INFO, "An activity was reopened."),
        EVIDENCE_SUBMITTED(Severity.INFO, "Evidence was submitted for an activity."),
        PROGRESS_AUTO_UPDATED(Severity.INFO, "Assignment progress was automatically updated."),
        FINAL_REPORT_SUBMITTED(Severity.INFO, "A final report was submitted for the assignment."),
        STATUS_CHANGED(Severity.INFO, "The assignment status was changed."),
        DEADLINE_REMINDER(Severity.INFO, "A deadline reminder was sent."),
        OVERDUE_CLEARED(Severity.INFO, "An overdue assignment is now back on track."),

        // WARNING Level
        ASSIGNMENT_REJECTED(Severity.WARNING, "The assignment was rejected during review."),
        ASSIGNMENT_RETURNED(Severity.WARNING, "The assignment was returned for rework."),
        ASSIGNMENT_OVERDUE(Severity.WARNING, "An assignment has passed its due date."),
        ASSIGNMENT_REOPENED(Severity.WARNING, "A completed assignment was reopened."),

        // CRITICAL Level
        ACTIVITY_DELETED(Severity.CRITICAL, "An activity was deleted from an assignment."),
        ASSIGNMENT_APPROVED(Severity.CRITICAL, "The assignment was approved and completed.");


        private final Severity severity;
        private final String description;

        AuditAction(Severity severity, String description) {
            this.severity = severity;
            this.description = description;
        }

        public Severity getSeverity() {
            return severity;
        }

        public String getDescription() {
            return description;
        }
    }

    public enum Severity {
        INFO,
        WARNING,
        CRITICAL
    }
}
