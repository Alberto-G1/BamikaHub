package com.bamikahub.inventorysystem.dto.chat;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.Set;

@Data
@Builder
public class ChatMessageDTO {
    private Long id;
    private Long threadId;
    private Long senderId;
    private String senderName;
    private String senderAvatar;
    private String content;
    private String messageType;
    private ChatAttachmentDTO attachment;
    private LocalDateTime sentAt;
    private LocalDateTime deliveredAt;
    private LocalDateTime readAt;
    private boolean deleted;
    private Set<Long> recipients;
}
