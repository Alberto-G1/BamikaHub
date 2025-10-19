package com.bamikahub.inventorysystem.services.notification;

import com.bamikahub.inventorysystem.dao.notification.NotificationRepository;
import com.bamikahub.inventorysystem.dao.user.UserRepository;
import com.bamikahub.inventorysystem.dto.notification.NotificationDto;
import com.bamikahub.inventorysystem.models.audit.AuditLog;
import com.bamikahub.inventorysystem.models.notification.Notification;
import com.bamikahub.inventorysystem.models.notification.NotificationPriority;
import com.bamikahub.inventorysystem.models.notification.NotificationType;
import com.bamikahub.inventorysystem.models.user.User;
import com.bamikahub.inventorysystem.services.audit.AuditService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service for managing in-app notifications
 * Handles creation, retrieval, and status management of notifications
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {
    
    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final AuditService auditService;
    // WebSocket service will be injected after creation
    
    /**
     * Create and send a notification to a user
     * Async to not block main operations
     */
    @Async
    @Transactional
    public void notifyUser(Long recipientId, NotificationType type, String title, 
                          String message, String link) {
        notifyUser(recipientId, type, title, message, link, 
                  NotificationPriority.NORMAL, null, null, true);
    }
    
    /**
     * Create notification with full parameters
     */
    @Async
    @Transactional
    public void notifyUser(Long recipientId, NotificationType type, String title, 
                          String message, String link, NotificationPriority priority,
                          String entityType, Long entityId, boolean sendEmail) {
        try {
            User recipient = userRepository.findById(recipientId)
                .orElseThrow(() -> new RuntimeException("Recipient not found: " + recipientId));
            
            // Get current user as the one who triggered notification
            User triggeredBy = getCurrentUser();
            
            // Create notification
            Notification notification = new Notification();
            notification.setRecipient(recipient);
            notification.setType(type);
            notification.setTitle(title);
            notification.setMessage(message);
            notification.setLink(link);
            notification.setPriority(priority);
            notification.setEntityType(entityType);
            notification.setEntityId(entityId);
            notification.setTriggeredBy(triggeredBy);
            notification.setIsRead(false);
            notification.setEmailSent(false);
            
            notification = notificationRepository.save(notification);
            
            log.info("Created notification ID {} for user {} - Type: {}", 
                    notification.getId(), recipient.getEmail(), type);
            
            // Send email if requested and user preferences allow
            if (sendEmail || type.isHighPriority()) {
                try {
                    emailService.sendNotificationEmail(recipient, notification);
                    notification.setEmailSent(true);
                    notificationRepository.save(notification);
                } catch (Exception e) {
                    log.error("Failed to send email notification to {}: {}", 
                             recipient.getEmail(), e.getMessage());
                }
            }
            
            // TODO: Send via WebSocket for real-time delivery
            // webSocketService.sendNotification(recipientId, toDto(notification));
            
            // Audit log
            User actor = getCurrentUser();
            if (actor != null) {
                auditService.logAction(
                    actor,
                    AuditLog.ActionType.NOTIFICATION_SENT,
                    "Notification",
                    notification.getId(),
                    title,
                    String.format("Sent %s notification to %s", type, recipient.getEmail())
                );
            }
            
        } catch (Exception e) {
            log.error("Failed to create notification for user {}: {}", recipientId, e.getMessage(), e);
        }
    }
    
    /**
     * Notify multiple users
     */
    @Async
    @Transactional
    public void notifyUsers(List<Long> recipientIds, NotificationType type, String title,
                           String message, String link) {
        for (Long recipientId : recipientIds) {
            notifyUser(recipientId, type, title, message, link);
        }
    }
    
    /**
     * Get all notifications for a user
     */
    @Transactional(readOnly = true)
    public List<NotificationDto> getUserNotifications(Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        List<Notification> notifications = notificationRepository
            .findByRecipientOrderByCreatedAtDesc(user);
        
        return notifications.stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get unread notifications for a user
     */
    @Transactional(readOnly = true)
    public List<NotificationDto> getUnreadNotifications(Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        List<Notification> notifications = notificationRepository
            .findByRecipientAndIsReadFalseOrderByCreatedAtDesc(user);
        
        return notifications.stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get unread count for a user
     */
    @Transactional(readOnly = true)
    public Long getUnreadCount(Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        return notificationRepository.countByRecipientAndIsReadFalse(user);
    }
    
    /**
     * Mark notification as read
     */
    @Transactional
    public void markAsRead(Long notificationId, Long userId) {
        Notification notification = notificationRepository.findById(notificationId)
            .orElseThrow(() -> new RuntimeException("Notification not found"));
        
        // Verify ownership
        if (!notification.getRecipient().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized access to notification");
        }
        
        if (!notification.getIsRead()) {
            notification.markAsRead();
            notificationRepository.save(notification);
            
            log.info("User {} marked notification {} as read", userId, notificationId);
        }
    }
    
    /**
     * Mark all notifications as read for a user
     */
    @Transactional
    public int markAllAsRead(Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        int count = notificationRepository.markAllAsRead(user, LocalDateTime.now());
        
        log.info("User {} marked {} notifications as read", userId, count);
        
        return count;
    }
    
    /**
     * Delete a notification
     */
    @Transactional
    public void deleteNotification(Long notificationId, Long userId) {
        Notification notification = notificationRepository.findById(notificationId)
            .orElseThrow(() -> new RuntimeException("Notification not found"));
        
        // Verify ownership
        if (!notification.getRecipient().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized access to notification");
        }
        
        notificationRepository.delete(notification);
        log.info("User {} deleted notification {}", userId, notificationId);
    }
    
    /**
     * Cleanup old read notifications (run as scheduled job)
     */
    @Transactional
    public int cleanupOldNotifications(int daysOld) {
        LocalDateTime before = LocalDateTime.now().minusDays(daysOld);
        int deleted = notificationRepository.deleteOldReadNotifications(before);
        
        log.info("Cleaned up {} old notifications (older than {} days)", deleted, daysOld);
        
        return deleted;
    }
    
    /**
     * Convert entity to DTO
     */
    private NotificationDto toDto(Notification notification) {
        NotificationDto dto = new NotificationDto();
        dto.setId(notification.getId());
        dto.setType(notification.getType());
        dto.setTitle(notification.getTitle());
        dto.setMessage(notification.getMessage());
        dto.setLink(notification.getLink());
        dto.setEntityType(notification.getEntityType());
        dto.setEntityId(notification.getEntityId());
        dto.setPriority(notification.getPriority());
        dto.setIsRead(notification.getIsRead());
        dto.setReadAt(notification.getReadAt());
        dto.setCreatedAt(notification.getCreatedAt());
        dto.setEmailSent(notification.getEmailSent());
        
        if (notification.getTriggeredBy() != null) {
            dto.setTriggeredBy(notification.getTriggeredBy().getFirstName() + " " + 
                              notification.getTriggeredBy().getLastName());
            dto.setTriggeredById(notification.getTriggeredBy().getId());
        }
        
        return dto;
    }
    
    /**
     * Get current authenticated user
     */
    private User getCurrentUser() {
        try {
            String email = SecurityContextHolder.getContext().getAuthentication().getName();
            return userRepository.findByEmail(email).orElse(null);
        } catch (Exception e) {
            return null;
        }
    }
}
