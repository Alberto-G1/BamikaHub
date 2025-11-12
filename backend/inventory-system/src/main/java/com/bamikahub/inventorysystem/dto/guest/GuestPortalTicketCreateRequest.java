package com.bamikahub.inventorysystem.dto.guest;

import java.util.List;
import lombok.Data;

@Data
public class GuestPortalTicketCreateRequest {
    private String subject;
    private String description;
    private List<String> attachmentPaths;
}
