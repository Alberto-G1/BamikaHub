package com.bamikahub.inventorysystem.models.notification;

import com.bamikahub.inventorysystem.models.user.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Entity representing system notifications for users
 * Supports both in-app and email notification tracking
 */
@Entity
@Table(name = "notifications", indexes = {
    @Index(name = "idx_recipient", columnList = "recipient_id"),
    @Index(name = "idx_is_read", columnList = "is_read"),
    @Index(name = "idx_created_at", columnList = "created_at"),
    @Index(name = "idx_recipient_read", columnList = "recipient_id, is_read")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Notification {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    /**
     * User who will receive this notification
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipient_id", nullable = false)
    private User recipient;
    
    /**
     * Type/category of notification
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private NotificationType type;
    
    /**
     * Notification title/subject
     */
    @Column(nullable = false, length = 200)
    private String title;
    
    /**
     * Detailed notification message
     */
    @Column(columnDefinition = "TEXT")
    private String message;
    
    /**
     * Link to navigate when notification is clicked
     * E.g., "/requisitions/123", "/tickets/456"
     */
    @Column(length = 500)
    private String link;
    
    /**
     * Entity type related to this notification (e.g., "Requisition", "Ticket")
     */
    @Column(length = 50)
    private String entityType;
    
    /**
     * Entity ID related to this notification
     */
    private Long entityId;
    
    /**
     * Priority level for notification display
     */
    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private NotificationPriority priority = NotificationPriority.NORMAL;
    
    /**
     * Whether the notification has been read
     */
    @Column(name = "is_read", nullable = false)
    private Boolean isRead = false;
    
    /**
     * Whether email was sent for this notification
     */
    @Column(name = "email_sent", nullable = false)
    private Boolean emailSent = false;
    
    /**
     * When the notification was read
     */
    @Column(name = "read_at")
    private LocalDateTime readAt;
    
    /**
     * When the notification was created
     */
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    /**
     * User or system that triggered this notification
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "triggered_by")
    private User triggeredBy;
    
    /**
     * Additional metadata in JSON format
     */
    @Column(columnDefinition = "TEXT")
    private String metadata;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
    
    /**
     * Mark notification as read
     */
    public void markAsRead() {
        this.isRead = true;
        this.readAt = LocalDateTime.now();
    }
    
    /**
     * Check if notification is unread
     */
    public boolean isUnread() {
        return !this.isRead;
    }
}
