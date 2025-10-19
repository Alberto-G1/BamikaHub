package com.bamikahub.inventorysystem.dto.reporting;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Stock movement analysis for an inventory item over a period.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockMovementDto {
    private Long itemId;
    private String itemName;
    private String sku;
    private Integer initialStock;
    private Integer stockIn;
    private Integer stockOut;
    private Integer finalStock;
    private Integer reorderFrequency;
    private BigDecimal averageTransactionValue;
}
