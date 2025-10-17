package com.bamikahub.inventorysystem.dto.support;

import com.bamikahub.inventorysystem.models.support.SupportTicket.TicketPriority;
import lombok.Data;

@Data
public class TicketRequest {
    private String subject;
    private String description;
    private TicketPriority priority;
}