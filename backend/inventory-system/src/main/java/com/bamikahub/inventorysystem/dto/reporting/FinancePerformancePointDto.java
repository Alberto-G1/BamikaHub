package com.bamikahub.inventorysystem.dto.reporting;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
@AllArgsConstructor
public class FinancePerformancePointDto {
    private String period; // yyyy-MM or yyyy-MM-dd
    private BigDecimal revenue;     // from stock-outs
    private BigDecimal expenditure; // from fulfilled/closed requisitions
    private BigDecimal net;         // revenue - expenditure
}
