package com.bamikahub.inventorysystem.dto.finance;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class RequisitionItemRequest {
    @NotBlank(message = "Item name is required.")
    @Size(max = 255, message = "Item name must be at most 255 characters.")
    private String itemName;

    @Size(max = 2000, message = "Description must be at most 2000 characters.")
    private String description;

    @NotNull(message = "Quantity is required.")
    @DecimalMin(value = "0.01", inclusive = true, message = "Quantity must be greater than 0.")
    private Double quantity;

    @NotBlank(message = "Unit of measure is required.")
    @Size(max = 50, message = "Unit of measure must be at most 50 characters.")
    private String unitOfMeasure;

    @DecimalMin(value = "0", inclusive = true, message = "Estimated unit cost cannot be negative.")
    private BigDecimal estimatedUnitCost;
}