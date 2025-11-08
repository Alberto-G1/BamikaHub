package com.bamikahub.inventorysystem.dto.assignment;

import com.bamikahub.inventorysystem.models.assignment.AssignmentActivity;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AssignmentActivityCreateRequest {

    @NotBlank(message = "Activity title is required")
    private String title;

    private String description;

    @Min(value = 1, message = "Order index must be at least 1")
    private Integer orderIndex;

    @NotNull(message = "Evidence type is required")
    private AssignmentActivity.EvidenceType evidenceType;
}
