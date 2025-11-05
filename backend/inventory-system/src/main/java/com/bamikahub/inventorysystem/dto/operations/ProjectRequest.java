package com.bamikahub.inventorysystem.dto.operations;

import com.bamikahub.inventorysystem.models.operations.Project.ProjectStatus;
import jakarta.validation.constraints.*;
import lombok.Data;
import java.time.LocalDate;
import java.util.Set;

@Data
public class ProjectRequest {
    @NotBlank(message = "Project name is required.")
    @Size(max = 200, message = "Project name must be at most 200 characters.")
    private String name;

    @NotBlank(message = "Client name is required.")
    @Size(max = 200, message = "Client name must be at most 200 characters.")
    private String clientName;

    @Size(max = 5000, message = "Description must be at most 5000 characters.")
    private String description;

    @NotNull(message = "Project status is required.")
    private ProjectStatus status;

    private LocalDate startDate;
    private LocalDate endDate;

    private Set<@NotNull(message = "Engineer id cannot be null.") Long> assignedEngineerIds;
}