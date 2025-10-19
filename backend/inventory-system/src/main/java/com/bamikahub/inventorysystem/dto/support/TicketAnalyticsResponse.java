package com.bamikahub.inventorysystem.dto.support;

import lombok.Builder;
import lombok.Value;

import java.util.Map;

@Value
@Builder
public class TicketAnalyticsResponse {
    Map<String, Long> ticketsByStatus;
    Map<String, Long> ticketsByCategory;
    Map<String, Long> ticketsByPriority;
    double averageResolutionHours;
    double averageResponseHours;
    double slaCompliancePercentage;
}
