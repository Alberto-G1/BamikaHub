package com.bamikahub.inventorysystem.dto.finance;

import lombok.Data;
import java.time.LocalDate;
import java.util.List;

@Data
public class RequisitionRequest {
    private Long projectId;

    private LocalDate dateNeeded;

    private String justification;

    private List<RequisitionItemRequest> items;
}