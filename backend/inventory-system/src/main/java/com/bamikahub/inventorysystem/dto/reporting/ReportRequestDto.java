package com.bamikahub.inventorysystem.dto.reporting;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReportRequestDto {
    private LocalDate startDate;
    private LocalDate endDate;
    private Long projectId;
    private Long categoryId;
    private Long departmentId;
    private String status;
    private String priority;
    private String aggregationLevel; // DAILY, WEEKLY, MONTHLY
    private String exportFormat; // CSV, EXCEL, PDF
}
