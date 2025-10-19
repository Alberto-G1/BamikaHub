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
public class OperationsReportDto {
    private List<ProjectPerformanceDto> projectPerformance;
    private Map<String, Double> averageDurationByDepartment;
    private List<ProjectDelayDto> delayAnalysis;
    private Map<String, Long> projectStatusDistribution;
}
