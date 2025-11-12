package com.bamikahub.inventorysystem.dto.guest;

import com.bamikahub.inventorysystem.models.guest.GuestTicketStatus;
import lombok.Data;

@Data
public class GuestTicketStatusUpdateRequest {
    private Long ticketId;
    private GuestTicketStatus nextStatus;
}
