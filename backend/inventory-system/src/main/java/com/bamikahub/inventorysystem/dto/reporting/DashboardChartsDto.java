package com.bamikahub.inventorysystem.dto.reporting;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
public class DashboardChartsDto {
    private List<CategoryValueDto> inventoryValueByCategory;
    private List<ProjectStatusCountDto> projectsByStatus;
}
