package com.bamikahub.inventorysystem.dto.guest;

import com.bamikahub.inventorysystem.models.guest.GuestMessageSender;
import java.util.List;
import lombok.Data;

@Data
public class GuestTicketMessageRequest {
    private Long ticketId;
    private GuestMessageSender sender;
    private String message;
    private List<String> attachmentPaths;
}
