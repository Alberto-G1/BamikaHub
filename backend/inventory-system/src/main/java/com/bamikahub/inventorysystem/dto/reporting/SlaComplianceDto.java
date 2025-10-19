package com.bamikahub.inventorysystem.dto.reporting;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * SLA compliance metrics for support tickets.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SlaComplianceDto {
    private String priority;
    private Long totalTickets;
    private Long responseMetCount;
    private Long resolutionMetCount;
    private Double responseCompliancePercentage;
    private Double resolutionCompliancePercentage;
    private Double averageResponseHours;
    private Double averageResolutionHours;
}
