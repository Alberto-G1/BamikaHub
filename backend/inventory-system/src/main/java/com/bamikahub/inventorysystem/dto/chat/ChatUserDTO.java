package com.bamikahub.inventorysystem.dto.chat;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ChatUserDTO {
    private Long id;
    private String fullName;
    private String email;
    private boolean online;
    private String avatar;
}
