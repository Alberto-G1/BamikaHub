package com.bamikahub.inventorysystem.dto;

import com.bamikahub.inventorysystem.models.StockTransaction.TransactionType;
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