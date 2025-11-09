package com.bamikahub.inventorysystem.dto.chat;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.Set;

@Data
@Builder
public class ChatThreadDTO {
    private Long id;
    private String type;
    private String subject;
    private Set<ChatThreadParticipantDTO> participants;
    private LocalDateTime lastMessageAt;
    private long unreadCount;
}
