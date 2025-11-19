package com.bamikahub.inventorysystem.dto.email;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class EmailRecipientLogDto {
    private Long id;
    private Long messageId;
    private Long recipientId;
    private String recipientEmail;
    private String status;
    private LocalDateTime attemptedAt;
    private String errorMessage;
}
