package com.bamikahub.inventorysystem.dto.email;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class EmailTemplateResponse {
    private Long id;
    private String name;
    private String subject;
    private String body;
    private Long createdById;
    private LocalDateTime createdAt;
}
