package com.bamikahub.inventorysystem.dto.finance;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Data;
import java.time.LocalDate;
import java.util.List;

@Data
public class RequisitionRequest {
    @NotNull(message = "Project is required.")
    private Long projectId;

    @NotNull(message = "Date needed is required.")
    private LocalDate dateNeeded;

    @NotBlank(message = "Justification is required.")
    @Size(max = 2000, message = "Justification must be at most 2000 characters.")
    private String justification;

    @NotEmpty(message = "At least one item is required.")
    @Valid
    private List<RequisitionItemRequest> items;
}