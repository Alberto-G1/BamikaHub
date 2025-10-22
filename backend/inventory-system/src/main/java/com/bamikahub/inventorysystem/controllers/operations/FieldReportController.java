package com.bamikahub.inventorysystem.controllers.operations;

import com.bamikahub.inventorysystem.models.operations.DailyFieldReport;
import com.bamikahub.inventorysystem.services.operations.FieldReportExportService;
import com.bamikahub.inventorysystem.services.operations.OperationsService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@RestController
@RequestMapping("/api/reports")
@CrossOrigin(origins = "*", maxAge = 3600)
public class FieldReportController {

    @Autowired private OperationsService operationsService;
    @Autowired private FieldReportExportService fieldReportExportService;

    @PostMapping("/field-daily")
    @PreAuthorize("hasAuthority('FIELD_REPORT_SUBMIT')")
    public DailyFieldReport submitDailyReport(@RequestPart("reportData") String reportDataJson,
                                              @RequestPart(value = "file", required = false) MultipartFile file) {
        return operationsService.submitFieldReport(reportDataJson, file);
    }

    @GetMapping("/project/{projectId}")
    @PreAuthorize("hasAuthority('FIELD_REPORT_READ')")
    public OperationsService.ReportListing getReportsForProject(@PathVariable Long projectId,
                                                                @RequestParam(value = "siteId", required = false) Long siteId) {
        return operationsService.getReportsForProject(projectId, siteId);
    }

    @GetMapping(value = "/project/{projectId}/export/excel", produces = MediaType.APPLICATION_OCTET_STREAM_VALUE)
    @Transactional(readOnly = true)
    @PreAuthorize("hasAuthority('FIELD_REPORT_READ')")
    public ResponseEntity<byte[]> exportFieldReportsExcel(
        @PathVariable Long projectId,
        @RequestParam(value = "siteId", required = false) Long siteId,
        @RequestParam(value = "startDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) java.time.LocalDate startDate,
        @RequestParam(value = "endDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) java.time.LocalDate endDate
    ) {
    List<DailyFieldReport> reports = operationsService.getReportsForProject(projectId, siteId).reports();
    reports = reports.stream()
        .filter(r -> startDate == null || (r.getReportDate() != null && !r.getReportDate().isBefore(startDate)))
        .filter(r -> endDate == null || (r.getReportDate() != null && !r.getReportDate().isAfter(endDate)))
        .toList();
    byte[] data = fieldReportExportService.exportAsExcel(reports);
    String filename = "field-reports-" + projectId + ".xlsx";
    return ResponseEntity.ok()
        .header("Content-Disposition", "attachment; filename=" + filename)
        .body(data);
    }

    @GetMapping(value = "/project/{projectId}/export/pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    @Transactional(readOnly = true)
    @PreAuthorize("hasAuthority('FIELD_REPORT_READ')")
    public ResponseEntity<byte[]> exportFieldReportsPdf(
        @PathVariable Long projectId,
        @RequestParam(value = "siteId", required = false) Long siteId,
        @RequestParam(value = "startDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) java.time.LocalDate startDate,
        @RequestParam(value = "endDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) java.time.LocalDate endDate
    ) {
    List<DailyFieldReport> reports = operationsService.getReportsForProject(projectId, siteId).reports();
    reports = reports.stream()
        .filter(r -> startDate == null || (r.getReportDate() != null && !r.getReportDate().isBefore(startDate)))
        .filter(r -> endDate == null || (r.getReportDate() != null && !r.getReportDate().isAfter(endDate)))
        .toList();
    byte[] data = fieldReportExportService.exportAsPdf(reports);
    String filename = "field-reports-" + projectId + ".pdf";
    return ResponseEntity.ok()
        .header("Content-Disposition", "attachment; filename=" + filename)
        .body(data);
    }
}