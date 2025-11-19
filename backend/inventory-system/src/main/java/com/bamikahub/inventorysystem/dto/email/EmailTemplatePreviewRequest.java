package com.bamikahub.inventorysystem.dto.email;

import lombok.Data;
import java.util.Map;

@Data
public class EmailTemplatePreviewRequest {
    private Long templateId;
    private String body; // optional direct body to render
    private Map<String, Object> vars;
}
