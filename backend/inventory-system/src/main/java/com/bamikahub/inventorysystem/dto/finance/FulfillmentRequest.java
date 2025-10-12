package com.bamikahub.inventorysystem.dto.finance;

import lombok.Data;
import java.util.List;

@Data
public class FulfillmentRequest {

    public enum FulfillmentType {
        RECEIVE_INTO_STOCK,
        FULFILL_AND_ISSUE_TO_PROJECT
    }

    private FulfillmentType fulfillmentType;
    private String notes;
    private List<FulfillmentItemDto> items;

    // The inner FulfillmentItemDto class has been removed from this file.
}