package com.bamikahub.inventorysystem.dto.finance;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class FulfillmentItemDto {
    private Long requisitionItemId;

    @NotNull(message = "Inventory item is required.")
    @Positive(message = "Inventory item id must be a positive number.")
    private Long inventoryItemId;

    @NotNull(message = "Quantity received is required.")
    @Positive(message = "Quantity received must be greater than 0.")
    private Integer quantityReceived;

    @DecimalMin(value = "0", inclusive = true, message = "Actual unit cost cannot be negative.")
    private BigDecimal actualUnitCost;
}