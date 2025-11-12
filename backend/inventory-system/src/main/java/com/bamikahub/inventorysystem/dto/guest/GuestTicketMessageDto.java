package com.bamikahub.inventorysystem.dto.guest;

import com.bamikahub.inventorysystem.models.guest.GuestMessageSender;
import java.time.LocalDateTime;
import java.util.List;
import lombok.Data;

@Data
public class GuestTicketMessageDto {
    private Long id;
    private Long ticketId;
    private GuestMessageSender sender;
    private String message;
    private List<String> attachmentPaths;
    private boolean readByGuest;
    private boolean readByStaff;
    private LocalDateTime createdAt;
}
