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
@Table(name = "chat_audit_logs", indexes = {
        @Index(name = "idx_chat_audit_actor", columnList = "actor_id"),
        @Index(name = "idx_chat_audit_channel", columnList = "channel"),
        @Index(name = "idx_chat_audit_created_at", columnList = "created_at")
})
public class ChatAuditLog {

    public enum AuditAction {
        MESSAGE_SENT,
        MESSAGE_DELETED,
        MESSAGE_DELIVERED,
        MESSAGE_READ,
        ATTACHMENT_UPLOADED,
        PRESENCE_JOINED,
        PRESENCE_LEFT,
        MESSAGE_FLAGGED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private AuditAction action;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "actor_id")
    private User actor;

    @Column(length = 50)
    private String channel;

    @Column(name = "thread_id")
    private Long threadId;

    @Column(name = "message_id")
    private Long messageId;

    @Column(name = "target_user_id")
    private Long targetUserId;

    @Column(columnDefinition = "TEXT")
    private String metadataJson;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
