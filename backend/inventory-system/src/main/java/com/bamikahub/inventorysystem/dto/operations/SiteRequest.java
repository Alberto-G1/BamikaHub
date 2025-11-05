package com.bamikahub.inventorysystem.dto.operations;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class SiteRequest {
    @NotNull(message = "Project is required.")
    private Long projectId;

    @NotBlank(message = "Site name is required.")
    @Size(max = 200, message = "Site name must be at most 200 characters.")
    private String name;

    @Size(max = 255, message = "Location must be at most 255 characters.")
    private String location;
}
