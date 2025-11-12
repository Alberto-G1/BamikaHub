package com.bamikahub.inventorysystem.dto.guest;

import java.util.List;
import lombok.Data;

@Data
public class GuestPortalTicketCreateRequest {
    private String category;
    private String priority; // CRITICAL, HIGH, MEDIUM, LOW
    private String subject;
    private String description;
    private List<String> attachmentPaths;
}
