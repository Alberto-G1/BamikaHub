package com.bamikahub.inventorysystem.dto;

import com.bamikahub.inventorysystem.models.Project.ProjectStatus;
import lombok.Data;
import java.time.LocalDate;
import java.util.Set;

@Data
public class ProjectRequest {
    private String name;
    private String clientName;
    private String description;
    private ProjectStatus status;
    private LocalDate startDate;
    private LocalDate endDate;
    private Set<Long> assignedEngineerIds;
}