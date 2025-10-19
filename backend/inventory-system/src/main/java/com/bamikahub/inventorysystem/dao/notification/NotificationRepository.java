package com.bamikahub.inventorysystem.dao.notification;

import com.bamikahub.inventorysystem.models.notification.Notification;
import com.bamikahub.inventorysystem.models.notification.NotificationType;
import com.bamikahub.inventorysystem.models.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    
    /**
     * Find all notifications for a user, ordered by creation date (newest first)
     */
    List<Notification> findByRecipientOrderByCreatedAtDesc(User recipient);
    
    /**
     * Find unread notifications for a user
     */
    List<Notification> findByRecipientAndIsReadFalseOrderByCreatedAtDesc(User recipient);
    
    /**
     * Count unread notifications for a user
     */
    Long countByRecipientAndIsReadFalse(User recipient);
    
    /**
     * Find notifications by type for a user
     */
    List<Notification> findByRecipientAndTypeOrderByCreatedAtDesc(User recipient, NotificationType type);
    
    /**
     * Find recent notifications (last N days)
     */
    @Query("SELECT n FROM Notification n WHERE n.recipient = :recipient " +
           "AND n.createdAt >= :since ORDER BY n.createdAt DESC")
    List<Notification> findRecentNotifications(@Param("recipient") User recipient, 
                                                @Param("since") LocalDateTime since);
    
    /**
     * Find notifications related to a specific entity
     */
    @Query("SELECT n FROM Notification n WHERE n.recipient = :recipient " +
           "AND n.entityType = :entityType AND n.entityId = :entityId " +
           "ORDER BY n.createdAt DESC")
    List<Notification> findByEntity(@Param("recipient") User recipient,
                                    @Param("entityType") String entityType,
                                    @Param("entityId") Long entityId);
    
    /**
     * Mark all notifications as read for a user
     */
    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true, n.readAt = :readAt " +
           "WHERE n.recipient = :recipient AND n.isRead = false")
    int markAllAsRead(@Param("recipient") User recipient, @Param("readAt") LocalDateTime readAt);
    
    /**
     * Mark specific notifications as read
     */
    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true, n.readAt = :readAt " +
           "WHERE n.id IN :ids")
    int markAsRead(@Param("ids") List<Long> ids, @Param("readAt") LocalDateTime readAt);
    
    /**
     * Delete old read notifications (cleanup)
     */
    @Modifying
    @Query("DELETE FROM Notification n WHERE n.isRead = true " +
           "AND n.createdAt < :before")
    int deleteOldReadNotifications(@Param("before") LocalDateTime before);
    
    /**
     * Find paginated notifications
     */
    @Query("SELECT n FROM Notification n WHERE n.recipient = :recipient " +
           "ORDER BY n.isRead ASC, n.createdAt DESC")
    List<Notification> findByRecipientPaginated(@Param("recipient") User recipient);
}
