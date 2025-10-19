package com.bamikahub.inventorysystem.dto.notification;

import com.bamikahub.inventorysystem.models.notification.NotificationPriority;
import com.bamikahub.inventorysystem.models.notification.NotificationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for creating notifications
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateNotificationRequest {
    private Long recipientId;
    private NotificationType type;
    private String title;
    private String message;
    private String link;
    private String entityType;
    private Long entityId;
    private NotificationPriority priority;
    private Boolean sendEmail;
}
