package com.bamikahub.inventorysystem.dto.reporting;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectDelayDto {
    private Long projectId;
    private String projectName;
    private Integer delayDays;
    private String delayCause;
    private String department;
}
