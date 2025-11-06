package com.bamikahub.inventorysystem.dto.reporting;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
@AllArgsConstructor
public class FinancePerformanceTrendDto {
    private String reportType; // FINANCE_PERFORMANCE_TREND
    private String aggregationLevel; // DAILY/WEEKLY/MONTHLY
    private List<FinancePerformancePointDto> dataPoints;
    private String summary;
}
