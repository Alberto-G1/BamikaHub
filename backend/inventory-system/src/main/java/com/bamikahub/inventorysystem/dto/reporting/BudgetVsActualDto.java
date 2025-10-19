package com.bamikahub.inventorysystem.dto.reporting;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Budget vs Actual cost analysis per project.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BudgetVsActualDto {
    private Long projectId;
    private String projectName;
    private BigDecimal budgetedCost;
    private BigDecimal actualCost;
    private BigDecimal variance;
    private Double variancePercentage;
    private String status; // UNDER_BUDGET, ON_BUDGET, OVER_BUDGET
}
