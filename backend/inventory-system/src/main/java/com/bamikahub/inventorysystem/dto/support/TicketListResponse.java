package com.bamikahub.inventorysystem.dto.support;

import com.bamikahub.inventorysystem.models.support.SupportTicket;
import lombok.Builder;
import lombok.Value;

import java.time.LocalDateTime;

@Value
@Builder
public class TicketListResponse {
    Long id;
    String subject;
    String categoryName;
    String otherCategory;
    SupportTicket.TicketPriority priority;
    SupportTicket.TicketStatus status;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
    LocalDateTime responseDueAt;
    LocalDateTime resolutionDueAt;
    boolean responseBreached;
    boolean resolutionBreached;
    Long submittedById;
    String submittedByName;
    Long assignedToId;
    String assignedToName;
    String department;
    boolean archived;
}
