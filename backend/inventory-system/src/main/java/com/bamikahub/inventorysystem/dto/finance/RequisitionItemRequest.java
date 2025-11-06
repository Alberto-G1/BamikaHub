package com.bamikahub.inventorysystem.dto.finance;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class RequisitionItemRequest {
    private String itemName;

    private String description;

    private Double quantity;

    private String unitOfMeasure;

    private BigDecimal estimatedUnitCost;
}