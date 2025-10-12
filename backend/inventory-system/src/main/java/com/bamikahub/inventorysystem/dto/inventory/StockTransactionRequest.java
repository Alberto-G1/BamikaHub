package com.bamikahub.inventorysystem.dto.inventory;

import com.bamikahub.inventorysystem.models.inventory.StockTransaction.TransactionType;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class StockTransactionRequest {
    private Long itemId;
    private TransactionType type;
    private Integer quantity;
    private BigDecimal unitCost; // UGX
    private String reference;
}