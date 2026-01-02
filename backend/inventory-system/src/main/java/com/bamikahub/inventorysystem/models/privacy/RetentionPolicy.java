package com.bamikahub.inventorysystem.models.privacy;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * RetentionPolicy Entity
 * Defines data retention rules for different data types
 */
@Entity
@Table(name = "retention_policies")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RetentionPolicy {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "data_type", nullable = false, unique = true)
    private String dataType; // USER_DATA, AUDIT_LOGS, SESSION_DATA, COOKIE_CONSENT, etc.

    @Column(name = "retention_period_days", nullable = false)
    private int retentionPeriodDays;

    @Column(name = "description", length = 1000)
    private String description;

    @Column(name = "legal_basis", length = 500)
    private String legalBasis; // GDPR legal basis for retention

    @Column(name = "is_active", nullable = false)
    private boolean isActive = true;

    @Column(name = "auto_delete", nullable = false)
    private boolean autoDelete = false;

    @Column(name = "notify_before_deletion", nullable = false)
    private boolean notifyBeforeDeletion = false;

    @Column(name = "notification_days_before")
    private Integer notificationDaysBefore;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "created_by")
    private String createdBy;

    @Column(name = "last_execution_date")
    private LocalDateTime lastExecutionDate;

    @Column(name = "records_deleted_last_run")
    private Integer recordsDeletedLastRun;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public void recordExecution(int recordsDeleted) {
        this.lastExecutionDate = LocalDateTime.now();
        this.recordsDeletedLastRun = recordsDeleted;
    }

    public boolean shouldExecute() {
        if (!isActive || !autoDelete) {
            return false;
        }
        // Run daily
        return lastExecutionDate == null || 
               LocalDateTime.now().isAfter(lastExecutionDate.plusDays(1));
    }
}
