package com.bamikahub.inventorysystem.models.audit;

import com.bamikahub.inventorysystem.models.user.User;
import com.fasterxml.jackson.annotation.JsonIdentityInfo;
import com.fasterxml.jackson.annotation.ObjectIdGenerators;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Data
@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "audit_logs", indexes = {
        @Index(name = "idx_audit_user", columnList = "user_id"),
        @Index(name = "idx_audit_action", columnList = "action"),
        @Index(name = "idx_audit_entity", columnList = "entity_type, entity_id"),
        @Index(name = "idx_audit_timestamp", columnList = "timestamp")
})
@JsonIdentityInfo(generator = ObjectIdGenerators.PropertyGenerator.class, property = "id")
public class AuditLog {

    public enum ActionType {
        // User Management
        USER_CREATED, USER_UPDATED, USER_DELETED, USER_ACTIVATED, USER_DEACTIVATED,
        USER_LOGIN, USER_LOGOUT, USER_PASSWORD_CHANGED, USER_ROLE_CHANGED,
        
        // Inventory Management
        ITEM_CREATED, ITEM_UPDATED, ITEM_DELETED, ITEM_REORDER_THRESHOLD_CHANGED,
        CATEGORY_CREATED, CATEGORY_UPDATED, CATEGORY_DELETED,
        
        // Stock Transactions
        STOCK_IN, STOCK_OUT, STOCK_ADJUSTMENT, STOCK_RETURN, STOCK_TRANSFER,
        
        // Operations/Projects
        PROJECT_CREATED, PROJECT_UPDATED, PROJECT_DELETED, PROJECT_ARCHIVED,
        PROJECT_STATUS_CHANGED, SITE_CREATED, SITE_UPDATED, SITE_DELETED,
    FIELD_REPORT_CREATED, FIELD_REPORT_UPDATED, FIELD_REPORT_APPROVED, FIELD_REPORT_REJECTED, FIELD_REPORT_VIEWED,
        
        // Finance/Requisitions
        REQUISITION_CREATED, REQUISITION_UPDATED, REQUISITION_DELETED,
        REQUISITION_APPROVED_OPS, REQUISITION_APPROVED_FINANCE, REQUISITION_REJECTED,
        REQUISITION_FULFILLED, REQUISITION_CLOSED,
        
        // Support Tickets
        TICKET_CREATED, TICKET_UPDATED, TICKET_DELETED, TICKET_ASSIGNED,
        TICKET_STATUS_CHANGED, TICKET_PRIORITY_CHANGED, TICKET_RESOLVED, TICKET_CLOSED,
        
        // Suppliers
        SUPPLIER_CREATED, SUPPLIER_UPDATED, SUPPLIER_DELETED,
        
        // Roles & Permissions
        ROLE_CREATED, ROLE_UPDATED, ROLE_DELETED, PERMISSION_GRANTED, PERMISSION_REVOKED,
        
        // Reports
        REPORT_GENERATED, REPORT_EXPORTED, SCHEDULED_REPORT_SENT,
        
        // Notifications
        NOTIFICATION_SENT, NOTIFICATION_READ, NOTIFICATION_DELETED,
        
        // System
        SYSTEM_CONFIG_CHANGED, BACKUP_CREATED, BACKUP_RESTORED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User actor;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private ActionType action;

    @Column(length = 100)
    private String entityType; // e.g., "Project", "Requisition", "User", "Item"

    @Column(name = "entity_id")
    private Long entityId; // ID of the affected entity

    @Column(length = 100)
    private String entityName; // Human-readable name/identifier

    @Lob
    @Column(columnDefinition = "TEXT")
    private String details; // JSON or descriptive text of what changed

    @Column(length = 45)
    private String ipAddress;

    @Column(length = 500)
    private String userAgent;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private Severity severity = Severity.INFO;

    @CreationTimestamp
    @Column(updatable = false, nullable = false)
    private LocalDateTime timestamp;

    public enum Severity {
        INFO,      // Normal operations
        WARNING,   // Potentially concerning actions
        CRITICAL   // High-impact actions (deletions, deactivations)
    }
}
