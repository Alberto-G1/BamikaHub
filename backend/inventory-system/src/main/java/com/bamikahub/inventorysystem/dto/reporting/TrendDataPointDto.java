package com.bamikahub.inventorysystem.dto.reporting;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Represents a single data point in a time-series trend analysis.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TrendDataPointDto {
    private LocalDate date;
    private String period; // "2025-01", "2025-W42", "2025-10-15"
    private BigDecimal value;
    private Long count;
    private String label;
}
