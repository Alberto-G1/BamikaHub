package com.bamikahub.inventorysystem.dto.support;

import com.bamikahub.inventorysystem.models.support.SupportTicket.TicketPriority;
import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class TicketRequest {
    @NotBlank(message = "Subject is required.")
    @Size(max = 255, message = "Subject must be at most 255 characters.")
    private String subject;

    @NotBlank(message = "Description is required.")
    @Size(max = 5000, message = "Description must be at most 5000 characters.")
    private String description;

    @NotNull(message = "Priority is required.")
    private TicketPriority priority;

    @NotNull(message = "Category is required.")
    private Integer categoryId;

    @Size(max = 255, message = "Other category must be at most 255 characters.")
    private String otherCategory;

    private Long inventoryItemId;
    private Long projectId;

    @Size(max = 100, message = "Department must be at most 100 characters.")
    private String submitterDepartment;
}