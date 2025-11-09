package com.bamikahub.inventorysystem.dto.chat;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ChatThreadParticipantDTO {
    private Long id;
    private String fullName;
    private boolean online;
    private String avatar;
}
