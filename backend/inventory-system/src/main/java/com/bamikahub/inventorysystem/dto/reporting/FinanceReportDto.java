package com.bamikahub.inventorysystem.dto.reporting;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FinanceReportDto {
    private Map<String, Long> requisitionsByStatus;
    private List<MonthlyExpenditureDto> monthlyTrends;
    private List<BudgetVsActualDto> budgetVsActual;
    private BigDecimal totalPendingAmount;
    private BigDecimal totalApprovedAmount;
    private BigDecimal totalFulfilledAmount;
}
