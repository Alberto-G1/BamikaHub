package com.bamikahub.inventorysystem.help;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SupportTicketDto {

    private Long id;
    private String ticketNumber;
    private String userId;
    private String subject;
    private String description;
    private SupportTicket.TicketPriority priority;
    private SupportTicket.TicketStatus status;
    private SupportTicket.TicketCategory category;
    private String assignedTo;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime resolvedAt;
    private LocalDateTime closedAt;
    private String resolution;
    private String createdBy;
    private String updatedBy;
    private List<TicketMessageDto> messages;
    private Integer messageCount;
}