package com.bamikahub.inventorysystem.dto.reporting;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
public class StockOutRevenueSummaryDto {
    private Long totalItemsCount; // distinct items with stock out
    private Long totalQuantityOut;
    private BigDecimal totalRevenue;
    private BigDecimal totalCogs;
    private BigDecimal totalMargin;
    private List<StockOutItemDto> items;
}
