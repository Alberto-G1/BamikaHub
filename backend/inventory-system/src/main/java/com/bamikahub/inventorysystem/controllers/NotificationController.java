package com.bamikahub.inventorysystem.controllers;

import com.bamikahub.inventorysystem.dto.notification.CreateNotificationRequest;
import com.bamikahub.inventorysystem.dto.notification.NotificationDto;
import com.bamikahub.inventorysystem.models.notification.NotificationPriority;
import com.bamikahub.inventorysystem.models.notification.NotificationType;
import com.bamikahub.inventorysystem.security.services.UserDetailsImpl;
import com.bamikahub.inventorysystem.services.notification.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import jakarta.validation.Valid;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

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
    public ResponseEntity<Page<NotificationDto>> getMyNotifications(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String priority,
            @RequestParam(required = false) Boolean isRead) {

        final NotificationType typeFilter = resolveTypeFilter(type);
        final NotificationPriority priorityFilter = resolvePriorityFilter(priority);

        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), 100);
        Pageable pageable = PageRequest.of(safePage, safeSize);

        List<NotificationDto> filtered = notificationService
                .getUserNotifications(userDetails.getId())
                .stream()
                .filter(dto -> typeFilter == null || dto.getType() == typeFilter)
                .filter(dto -> priorityFilter == null || dto.getPriority() == priorityFilter)
                .filter(dto -> isRead == null || Objects.equals(dto.getIsRead(), isRead))
                .collect(Collectors.toList());

        int start = (int) pageable.getOffset();
    List<NotificationDto> content = start >= filtered.size()
        ? Collections.emptyList()
                : filtered.subList(start, Math.min(start + pageable.getPageSize(), filtered.size()));

        Page<NotificationDto> response = new PageImpl<>(content, pageable, filtered.size());
        return ResponseEntity.ok(response);
    }

    private NotificationType resolveTypeFilter(String type) {
        if (type == null || type.isBlank()) {
            return null;
        }
        try {
            return NotificationType.valueOf(type.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid notification type: " + type);
        }
    }

    private NotificationPriority resolvePriorityFilter(String priority) {
        if (priority == null || priority.isBlank()) {
            return null;
        }
        try {
            return NotificationPriority.valueOf(priority.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid notification priority: " + priority);
        }
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
    public ResponseEntity<Void> createNotification(@Valid @RequestBody CreateNotificationRequest request) {
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
