package com.bamikahub.inventorysystem.dto.inventory;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class InventoryItemRequest {
    @NotBlank(message = "Item name is required.")
    @Size(max = 200, message = "Item name must be at most 200 characters.")
    private String name;

    @NotBlank(message = "SKU is required.")
    @Pattern(regexp = "^[A-Za-z0-9._-]{3,64}$", message = "SKU must be 3-64 characters and contain only letters, numbers, dashes, underscores, or dots.")
    private String sku;

    @NotNull(message = "Category is required.")
    private Long categoryId;

    @Size(max = 5000, message = "Description must be at most 5000 characters.")
    private String description;

    @NotNull(message = "Quantity is required.")
    @PositiveOrZero(message = "Quantity cannot be negative.")
    private Integer quantity;

    @NotNull(message = "Reorder level is required.")
    @PositiveOrZero(message = "Reorder level cannot be negative.")
    private Integer reorderLevel;

    @NotNull(message = "Unit price is required.")
    @DecimalMin(value = "0", inclusive = true, message = "Unit price cannot be negative.")
    private BigDecimal unitPrice; // UGX

    @Positive(message = "Supplier id must be a positive number.")
    private Long supplierId;

    @Size(max = 255, message = "Location must be at most 255 characters.")
    private String location;
    private boolean isActive;
    private Integer version;
}