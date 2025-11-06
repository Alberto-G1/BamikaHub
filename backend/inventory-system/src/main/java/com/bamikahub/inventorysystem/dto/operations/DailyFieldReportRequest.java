package com.bamikahub.inventorysystem.dto.operations;
import lombok.Data;
import java.time.LocalDate;

@Data
public class DailyFieldReportRequest {
    private Long projectId;
    private Long siteId;
    private LocalDate reportDate;

    private String workProgressUpdate;

    private String materialsUsed;

    private String challengesFaced;

    private String weatherConditions;
}