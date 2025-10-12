package com.bamikahub.inventorysystem.dto.finance;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class FulfillmentItemDto {
    private Long requisitionItemId;
    private Long inventoryItemId;
    private Integer quantityReceived;
    private BigDecimal actualUnitCost;
}