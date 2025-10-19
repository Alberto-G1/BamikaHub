package com.bamikahub.inventorysystem.dto.reporting;

import lombok.Data;
import lombok.AllArgsConstructor;
import java.util.List;

@Data
public class SupportTicketSummaryDto {
    private List<TicketStatusCountDto> ticketsByStatus;
    private List<TicketCategoryCountDto> ticketsByCategory;
}
