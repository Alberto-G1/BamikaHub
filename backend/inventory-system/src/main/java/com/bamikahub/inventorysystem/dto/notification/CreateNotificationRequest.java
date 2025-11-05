package com.bamikahub.inventorysystem.dto.notification;

import com.bamikahub.inventorysystem.models.notification.NotificationPriority;
import com.bamikahub.inventorysystem.models.notification.NotificationType;
import jakarta.validation.constraints.*;
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
    @NotNull(message = "Recipient is required.")
    private Long recipientId;

    @NotNull(message = "Notification type is required.")
    private NotificationType type;

    @NotBlank(message = "Title is required.")
    @Size(max = 200, message = "Title must be at most 200 characters.")
    private String title;

    @NotBlank(message = "Message is required.")
    @Size(max = 2000, message = "Message must be at most 2000 characters.")
    private String message;

    @Size(max = 500, message = "Link must be at most 500 characters.")
    private String link;

    @Size(max = 100, message = "Entity type must be at most 100 characters.")
    private String entityType;

    private Long entityId;

    private NotificationPriority priority;
    private Boolean sendEmail;
}
