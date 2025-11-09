package com.bamikahub.inventorysystem.models.chat;

import com.bamikahub.inventorysystem.models.user.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "chat_notifications", indexes = {
        @Index(name = "idx_chat_notification_user", columnList = "recipient_id"),
        @Index(name = "idx_chat_notification_created", columnList = "created_at")
})
public class ChatNotification {

    public enum NotificationType {
        PRIVATE_MESSAGE,
        GENERAL_ANNOUNCEMENT,
        FILE_RECEIVED,
        USER_MENTIONED,
        USER_FLAGGED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private NotificationType type;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "recipient_id", nullable = false)
    private User recipient;

    @Column(name = "thread_id")
    private Long threadId;

    @Column(name = "message_id")
    private Long messageId;

    @Column(columnDefinition = "TEXT")
    private String payload;

    @Column(name = "is_delivered", nullable = false)
    private boolean delivered;

    @Column(name = "is_read", nullable = false)
    private boolean read;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "delivered_at")
    private LocalDateTime deliveredAt;

    @Column(name = "read_at")
    private LocalDateTime readAt;
}
