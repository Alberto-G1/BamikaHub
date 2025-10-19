package com.bamikahub.inventorysystem.dto.reporting;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Requisition analysis by status for finance tracking.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RequisitionStatusDto {
    private String status;
    private Long count;
    private BigDecimal totalValue;
    private Double averageValue;
}
