package com.bamikahub.inventorysystem.dto.finance;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Data;
import java.util.List;

@Data
public class FulfillmentRequest {

    public enum FulfillmentType {
        RECEIVE_INTO_STOCK,
        FULFILL_AND_ISSUE_TO_PROJECT
    }

    @NotNull(message = "Fulfillment type is required.")
    private FulfillmentType fulfillmentType;

    @Size(max = 1000, message = "Notes must be at most 1000 characters.")
    private String notes;

    @NotEmpty(message = "At least one fulfilled item is required.")
    @Valid
    private List<FulfillmentItemDto> items;

    // The inner FulfillmentItemDto class has been removed from this file.
}