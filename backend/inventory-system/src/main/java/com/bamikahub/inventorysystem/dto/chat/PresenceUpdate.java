package com.bamikahub.inventorysystem.dto.chat;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class PresenceUpdate {
    private Long userId;
    private boolean online;
    private LocalDateTime lastSeen;
}
