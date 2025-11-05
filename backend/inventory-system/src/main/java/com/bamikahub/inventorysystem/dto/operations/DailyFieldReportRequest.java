package com.bamikahub.inventorysystem.dto.operations;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.time.LocalDate;

@Data
public class DailyFieldReportRequest {
    @NotNull(message = "Project is required.")
    private Long projectId;
    private Long siteId;
    @NotNull(message = "Report date is required.")
    private LocalDate reportDate;

    @Size(max = 2000, message = "Work progress update must be at most 2000 characters.")
    private String workProgressUpdate;

    @Size(max = 2000, message = "Materials used must be at most 2000 characters.")
    private String materialsUsed;

    @Size(max = 2000, message = "Challenges faced must be at most 2000 characters.")
    private String challengesFaced;

    @Size(max = 2000, message = "Weather conditions must be at most 2000 characters.")
    private String weatherConditions;
}