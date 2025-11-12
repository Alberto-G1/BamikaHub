package com.bamikahub.inventorysystem.dto.guest;

import com.bamikahub.inventorysystem.models.guest.GuestTicketStatus;
import com.bamikahub.inventorysystem.models.guest.GuestTicketPriority;
import java.time.LocalDateTime;
import java.util.List;
import lombok.Data;

@Data
public class GuestTicketDto {
    private Long id;
    private Long guestId;
    private String guestName;
    private String subject;
    private String description;
    private String category;
    private GuestTicketPriority priority;
    private GuestTicketStatus status;
    private Long assignedStaffId;
    private String assignedStaffName;
    private List<String> attachmentPaths;
    private LocalDateTime dueAt;
    private LocalDateTime responseDueAt;
    private LocalDateTime resolutionDueAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime lastMessageAt;
    private Integer ratingScore;
    private String ratingComment;
    private LocalDateTime ratedAt;
    private List<GuestTicketMessageDto> messages;
}
