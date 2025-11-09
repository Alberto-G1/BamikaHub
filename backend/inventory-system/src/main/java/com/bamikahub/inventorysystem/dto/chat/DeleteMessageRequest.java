package com.bamikahub.inventorysystem.dto.chat;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class DeleteMessageRequest {

    @NotNull
    private Long messageId;

    @NotNull
    private Long actorId;
}
