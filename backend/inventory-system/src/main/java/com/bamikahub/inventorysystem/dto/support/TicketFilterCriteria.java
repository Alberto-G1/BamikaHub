package com.bamikahub.inventorysystem.dto.support;

import com.bamikahub.inventorysystem.models.support.SupportTicket;
import lombok.Builder;
import lombok.Value;

import java.time.LocalDate;

@Value
@Builder
public class TicketFilterCriteria {
    SupportTicket.TicketStatus status;
    SupportTicket.TicketPriority priority;
    Integer categoryId;
    Long assignedToId;
    Long submittedById;
    LocalDate startDate;
    LocalDate endDate;
    Long inventoryItemId;
    Long projectId;
    String department;
    String search;
    boolean includeArchived;
}
