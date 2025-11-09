package com.bamikahub.inventorysystem.dto.chat;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class MarkThreadReadRequest {
    @NotNull
    private Long userId;

    @NotNull
    private Long lastMessageId;
}
