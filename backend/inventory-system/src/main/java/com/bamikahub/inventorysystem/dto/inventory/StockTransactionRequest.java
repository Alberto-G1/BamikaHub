package com.bamikahub.inventorysystem.dto.inventory;

import com.bamikahub.inventorysystem.models.inventory.StockTransaction.TransactionType;
import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class StockTransactionRequest {
    @NotNull(message = "Item id is required.")
    @Positive(message = "Item id must be a positive number.")
    private Long itemId;

    @NotNull(message = "Transaction type is required.")
    private TransactionType type;

    @NotNull(message = "Quantity is required.")
    @Positive(message = "Quantity must be greater than 0.")
    private Integer quantity;

    @DecimalMin(value = "0", inclusive = true, message = "Unit cost cannot be negative.")
    private BigDecimal unitCost; // UGX

    @Size(max = 255, message = "Reference must be at most 255 characters.")
    private String reference;
}