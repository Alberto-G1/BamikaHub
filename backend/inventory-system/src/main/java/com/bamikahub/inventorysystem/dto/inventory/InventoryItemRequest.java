package com.bamikahub.inventorysystem.dto.inventory;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class InventoryItemRequest {
    private String name;

    private String sku;

    private Long categoryId;

    private String description;

    private Integer quantity;

    private Integer reorderLevel;

    private BigDecimal unitPrice; // UGX

    private Long supplierId;

    private String location;
    private boolean isActive;
    private Integer version;
}