package com.bamikahub.inventorysystem.dto.reporting;

import com.bamikahub.inventorysystem.models.inventory.InventoryItem;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class InventoryValuationDto {
    private String sku;
    private String name;
    private String category;
    private Integer quantity;
    private BigDecimal unitPrice;
    private BigDecimal totalValue;

    public InventoryValuationDto(InventoryItem item) {
        this.sku = item.getSku();
        this.name = item.getName();
        this.category = item.getCategory().getName();
        this.quantity = item.getQuantity();
        this.unitPrice = item.getUnitPrice();
        this.totalValue = item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
    }
}