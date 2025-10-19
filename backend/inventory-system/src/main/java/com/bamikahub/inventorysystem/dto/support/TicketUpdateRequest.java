package com.bamikahub.inventorysystem.dto.support;

import com.bamikahub.inventorysystem.models.support.SupportTicket;
import lombok.Data;

@Data
public class TicketUpdateRequest {
    private SupportTicket.TicketPriority priority;
    private Integer categoryId;
    private String otherCategory;
    private Long inventoryItemId;
    private Long projectId;
    private String submitterDepartment;
}
