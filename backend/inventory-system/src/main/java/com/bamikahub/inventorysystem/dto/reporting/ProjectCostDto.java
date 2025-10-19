package com.bamikahub.inventorysystem.dto.reporting;

import lombok.AllArgsConstructor;
import lombok.Data;
import java.math.BigDecimal;

@Data
@AllArgsConstructor
public class ProjectCostDto {
    private Long projectId;
    private String projectName;
    private BigDecimal totalCost;
}