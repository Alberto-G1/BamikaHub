package com.bamikahub.inventorysystem.dto.chat;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class SendMessageRequest {

    private Long threadId;

    @NotNull
    private Long senderId;

    @Size(max = 4000)
    private String content;

    private boolean general;

    private Long recipientId; // only for new private chat threads

    private boolean markAsImportant;
}
