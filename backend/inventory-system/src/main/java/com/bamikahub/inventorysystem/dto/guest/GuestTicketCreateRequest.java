package com.bamikahub.inventorysystem.dto.guest;

import java.util.List;
import lombok.Data;

@Data
public class GuestTicketCreateRequest {
    private Long guestId;
    private String subject;
    private String description;
    private List<String> attachmentPaths;
}
