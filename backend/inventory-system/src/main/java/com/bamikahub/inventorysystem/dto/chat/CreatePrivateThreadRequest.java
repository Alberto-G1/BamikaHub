package com.bamikahub.inventorysystem.dto.chat;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreatePrivateThreadRequest {
    @NotNull
    private Long senderId;
    @NotNull
    private Long recipientId;
}
