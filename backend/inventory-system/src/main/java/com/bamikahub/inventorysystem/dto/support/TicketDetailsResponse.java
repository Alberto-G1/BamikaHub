package com.bamikahub.inventorysystem.dto.support;

import com.bamikahub.inventorysystem.models.support.SupportTicket;
import lombok.Builder;
import lombok.Value;

import java.time.LocalDateTime;
import java.util.List;

@Value
@Builder
public class TicketDetailsResponse {
    Long id;
    String subject;
    String description;
    SupportTicket.TicketStatus status;
    SupportTicket.TicketPriority priority;
    String categoryName;
    String otherCategory;
    Long submittedById;
    String submittedByName;
    String submittedByAvatarUrl;
    String submitterDepartment;
    Long assignedToId;
    String assignedToName;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
    LocalDateTime resolvedAt;
    LocalDateTime responseDueAt;
    LocalDateTime resolutionDueAt;
    LocalDateTime firstResponseAt;
    boolean responseBreached;
    boolean resolutionBreached;
    Long inventoryItemId;
    String inventoryItemName;
    Long projectId;
    String projectName;
    boolean archived;
    LocalDateTime archivedAt;
    Long archivedById;
    String archivedByName;
    List<TicketCommentResponse> comments;
    List<TicketAttachmentResponse> attachments;
    List<TicketActivityResponse> activityLog;
}
