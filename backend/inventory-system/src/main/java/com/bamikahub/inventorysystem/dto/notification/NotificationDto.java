package com.bamikahub.inventorysystem.dto.notification;

import com.bamikahub.inventorysystem.models.notification.NotificationPriority;
import com.bamikahub.inventorysystem.models.notification.NotificationType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO for returning notification data to frontend
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class NotificationDto {
    private Long id;
    private NotificationType type;
    private String title;
    private String message;
    private String link;
    private String entityType;
    private Long entityId;
    private NotificationPriority priority;
    private Boolean isRead;
    private LocalDateTime readAt;
    private LocalDateTime createdAt;
    private String triggeredBy; // User name who triggered the notification
    private Long triggeredById;
    private Boolean emailSent;
    
    /**
     * Get time ago string for display
     */
    public String getTimeAgo() {
        if (createdAt == null) return "";
        
        LocalDateTime now = LocalDateTime.now();
        long minutes = java.time.Duration.between(createdAt, now).toMinutes();
        
        if (minutes < 1) return "Just now";
        if (minutes < 60) return minutes + "m ago";
        
        long hours = minutes / 60;
        if (hours < 24) return hours + "h ago";
        
        long days = hours / 24;
        if (days < 7) return days + "d ago";
        
        long weeks = days / 7;
        if (weeks < 4) return weeks + "w ago";
        
        return createdAt.toLocalDate().toString();
    }
}
