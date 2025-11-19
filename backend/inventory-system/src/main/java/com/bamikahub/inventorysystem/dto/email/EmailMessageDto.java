package com.bamikahub.inventorysystem.dto.email;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class EmailMessageDto {
    private Long id;
    private String subject;
    private String body;
    private String recipientsCsv;
    private String attachmentPaths;
    private Long createdById;
    private LocalDateTime createdAt;
}
