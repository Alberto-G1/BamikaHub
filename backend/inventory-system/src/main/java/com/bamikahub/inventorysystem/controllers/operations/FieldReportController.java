package com.bamikahub.inventorysystem.controllers.operations;

import com.bamikahub.inventorysystem.dao.operations.DailyFieldReportRepository;
import com.bamikahub.inventorysystem.dto.operations.DailyFieldReportRequest;
import com.bamikahub.inventorysystem.models.operations.DailyFieldReport;
import com.bamikahub.inventorysystem.services.operations.OperationsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reports")
@CrossOrigin(origins = "*", maxAge = 3600)
public class FieldReportController {

    @Autowired private OperationsService operationsService;
    @Autowired private DailyFieldReportRepository reportRepository;

    @PostMapping("/field-daily")
    @PreAuthorize("hasAuthority('FIELD_REPORT_SUBMIT')")
    public DailyFieldReport submitDailyReport(@RequestBody DailyFieldReportRequest request) {
        return operationsService.submitFieldReport(request);
    }

    @GetMapping("/project/{projectId}")
    @PreAuthorize("hasAuthority('FIELD_REPORT_READ')")
    public List<DailyFieldReport> getReportsForProject(@PathVariable Long projectId) {
        return reportRepository.findByProjectId(projectId);
    }
}