package com.bamikahub.inventorysystem.dto.email;

import lombok.Data;

@Data
public class EmailTemplateRequest {
    private String name;
    private String subject;
    private String body; // HTML
}
