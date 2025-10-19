package com.bamikahub.inventorysystem.dto.reporting;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MonthlyExpenditureDto {
    private String month; // Format: YYYY-MM
    private BigDecimal amount;
    private Long requisitionCount;
}
