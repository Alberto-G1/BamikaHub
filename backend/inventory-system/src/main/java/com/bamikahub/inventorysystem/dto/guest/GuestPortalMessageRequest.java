package com.bamikahub.inventorysystem.dto.guest;

import java.util.List;
import lombok.Data;

@Data
public class GuestPortalMessageRequest {
    private String message;
    private List<String> attachmentPaths;
}
