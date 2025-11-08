package com.bamikahub.inventorysystem.dto.assignment;

import com.bamikahub.inventorysystem.models.assignment.AssignmentPriority;
import com.bamikahub.inventorysystem.models.assignment.AssignmentStatus;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class AssignmentDTO {
    private Long id;

    @NotBlank(message = "Title is required")
    @Size(max = 200, message = "Title must not exceed 200 characters")
    private String title;

    private String description;

    @NotNull(message = "Priority is required")
    private AssignmentPriority priority;

    private AssignmentStatus status;

    @NotNull(message = "Due date is required")
    @Future(message = "Due date must be in the future")
    private LocalDateTime dueDate;

    @NotNull(message = "Assignee is required")
    private Long assigneeId;

    private Long assignerId;

    @Min(value = 0, message = "Progress must be at least 0")
    @Max(value = 100, message = "Progress must not exceed 100")
    private Integer progressPercentage;

    private LocalDateTime completedDate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Additional fields for display
    private String assigneeName;
    private String assignerName;
    private boolean overdue;
    private long daysRemaining;

    // V2 workflow fields
    private boolean manualProgressAllowed;
    private List<AssignmentActivityDTO> activities;
    private String finalReportStatus; // SUBMITTED, RETURNED, APPROVED
}
