package com.bamikahub.inventorysystem.dto.reporting;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
@AllArgsConstructor
public class StockOutItemDto {
    private Long itemId;
    private String itemName;
    private String sku;
    private Long quantityOut;
    private BigDecimal revenue; // unitPrice * qty
    private BigDecimal cogs;    // unitCost * qty
    private BigDecimal margin;  // revenue - cogs
    private Double marginPercentage; // margin / revenue
}
