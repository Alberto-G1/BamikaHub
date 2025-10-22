package com.bamikahub.inventorysystem.dto.reporting;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SiteReportSummaryDto {
    private Long projectId;
    private String projectName;
    private Long siteId;
    private String siteName;
    private String siteLocation;
    private long reportCount;
    private boolean projectLevel;
}
