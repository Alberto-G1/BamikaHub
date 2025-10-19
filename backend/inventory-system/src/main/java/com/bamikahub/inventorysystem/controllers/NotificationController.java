package com.bamikahub.inventorysystem.controllers;

import com.bamikahub.inventorysystem.dto.notification.CreateNotificationRequest;
import com.bamikahub.inventorysystem.dto.notification.NotificationDto;
import com.bamikahub.inventorysystem.security.services.UserDetailsImpl;
import com.bamikahub.inventorysystem.services.notification.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST Controller for notification management
 */
@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@CrossOrigin(origins = "*", maxAge = 3600)
public class NotificationController {
    
    private final NotificationService notificationService;
    
    /**
     * Get all notifications for current user
     */
    @GetMapping
    public ResponseEntity<List<NotificationDto>> getMyNotifications(
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        List<NotificationDto> notifications = notificationService
            .getUserNotifications(userDetails.getId());
        return ResponseEntity.ok(notifications);
    }
    
    /**
     * Get unread notifications for current user
     */
    @GetMapping("/unread")
    public ResponseEntity<List<NotificationDto>> getUnreadNotifications(
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        List<NotificationDto> notifications = notificationService
            .getUnreadNotifications(userDetails.getId());
        return ResponseEntity.ok(notifications);
    }
    
    /**
     * Get unread notification count
     */
    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        Long count = notificationService.getUnreadCount(userDetails.getId());
        return ResponseEntity.ok(Map.of("count", count));
    }
    
    /**
     * Mark a notification as read
     */
    @PutMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        notificationService.markAsRead(id, userDetails.getId());
        return ResponseEntity.ok().build();
    }
    
    /**
     * Mark all notifications as read
     */
    @PutMapping("/mark-all-read")
    public ResponseEntity<Map<String, Integer>> markAllAsRead(
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        int count = notificationService.markAllAsRead(userDetails.getId());
        return ResponseEntity.ok(Map.of("markedCount", count));
    }
    
    /**
     * Delete a notification
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNotification(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        notificationService.deleteNotification(id, userDetails.getId());
        return ResponseEntity.ok().build();
    }
    
    /**
     * Create notification (admin only)
     */
    @PostMapping
    @PreAuthorize("hasAuthority('NOTIFICATION_SEND')")
    public ResponseEntity<Void> createNotification(@RequestBody CreateNotificationRequest request) {
        notificationService.notifyUser(
            request.getRecipientId(),
            request.getType(),
            request.getTitle(),
            request.getMessage(),
            request.getLink(),
            request.getPriority(),
            request.getEntityType(),
            request.getEntityId(),
            request.getSendEmail() != null && request.getSendEmail()
        );
        return ResponseEntity.ok().build();
    }
}
