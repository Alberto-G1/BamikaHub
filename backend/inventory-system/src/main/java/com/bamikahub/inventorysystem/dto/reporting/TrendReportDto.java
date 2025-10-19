package com.bamikahub.inventorysystem.dto.reporting;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Contains trend analysis data over time periods.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TrendReportDto {
    private String reportType;
    private String aggregationLevel; // DAILY, WEEKLY, MONTHLY
    private List<TrendDataPointDto> dataPoints;
    private String summary; // Optional summary text
}
