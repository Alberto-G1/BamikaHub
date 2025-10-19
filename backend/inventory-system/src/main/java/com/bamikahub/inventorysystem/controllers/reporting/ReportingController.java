package com.bamikahub.inventorysystem.controllers.reporting;

import com.bamikahub.inventorysystem.dto.reporting.*;
import com.bamikahub.inventorysystem.models.reporting.ReportHistory;
import com.bamikahub.inventorysystem.services.reporting.ReportingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/reports")
@CrossOrigin(origins = "*", maxAge = 3600)
public class ReportingController {

    @Autowired
    private ReportingService reportingService;

    // ============= DASHBOARD & GENERAL =============

    @GetMapping("/dashboard-charts")
    @PreAuthorize("isAuthenticated()")
    public DashboardChartsDto getDashboardChartData() {
        return reportingService.getDashboardChartsData();
    }

    @GetMapping("/history")
    @PreAuthorize("hasAuthority('FINANCE_READ') or hasAuthority('PROJECT_READ')")
    public List<ReportHistory> getReportHistory() {
        return reportingService.getReportHistory();
    }

    // ============= OPERATIONS REPORTS =============

    @GetMapping("/operations/project-performance")
    @PreAuthorize("hasAuthority('PROJECT_READ')")
    public List<ProjectPerformanceDto> getProjectPerformance(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) Long projectId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String aggregationLevel) {

        ReportRequestDto request = buildRequest(startDate, endDate, projectId, null, null, status, null, aggregationLevel, null);
        return reportingService.getProjectPerformance(request);
    }

    @GetMapping("/operations/project-delays")
    @PreAuthorize("hasAuthority('PROJECT_READ')")
    public List<ProjectDelayDto> getProjectDelays(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) Long projectId,
            @RequestParam(required = false) String status) {

        ReportRequestDto request = buildRequest(startDate, endDate, projectId, null, null, status, null, null, null);
        return reportingService.getProjectDelays(request);
    }

    @GetMapping("/operations/project-completion-trend")
    @PreAuthorize("hasAuthority('PROJECT_READ')")
    public TrendReportDto getProjectCompletionTrend(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false, defaultValue = "MONTHLY") String aggregationLevel) {

        ReportRequestDto request = buildRequest(startDate, endDate, null, null, null, null, null, aggregationLevel, null);
        return reportingService.getProjectCompletionTrend(request);
    }

    // ============= FINANCE REPORTS =============

    @GetMapping("/finance/requisitions-by-status")
    @PreAuthorize("hasAuthority('FINANCE_READ')")
    public List<RequisitionStatusDto> getRequisitionsByStatus(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) Long projectId,
            @RequestParam(required = false) String status) {

        ReportRequestDto request = buildRequest(startDate, endDate, projectId, null, null, status, null, null, null);
        return reportingService.getRequisitionsByStatus(request);
    }

    @GetMapping("/finance/expenditure-trend")
    @PreAuthorize("hasAuthority('FINANCE_READ')")
    public TrendReportDto getExpenditureTrend(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false, defaultValue = "MONTHLY") String aggregationLevel) {

        ReportRequestDto request = buildRequest(startDate, endDate, null, null, null, null, null, aggregationLevel, null);
        return reportingService.getMonthlyExpenditureTrend(request);
    }

    @GetMapping("/finance/budget-vs-actual")
    @PreAuthorize("hasAuthority('FINANCE_READ')")
    public List<BudgetVsActualDto> getBudgetVsActual(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) Long projectId,
            @RequestParam(required = false) String status) {

        ReportRequestDto request = buildRequest(startDate, endDate, projectId, null, null, status, null, null, null);
        return reportingService.getBudgetVsActual(request);
    }

    @GetMapping("/finance/project-costs")
    @PreAuthorize("hasAuthority('FINANCE_READ') or hasAuthority('PROJECT_READ')")
    public List<ProjectCostDto> getProjectCosts() {
        return reportingService.getProjectCostReport();
    }

    // ============= INVENTORY REPORTS =============

    @GetMapping("/inventory/valuation")
    @PreAuthorize("hasAuthority('FINANCE_READ') or hasAuthority('ITEM_READ')")
    public List<InventoryValuationDto> getInventoryValuation() {
        return reportingService.getInventoryValuationReport();
    }

    @GetMapping("/inventory/stock-movement")
    @PreAuthorize("hasAuthority('ITEM_READ')")
    public List<StockMovementDto> getStockMovement(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) Long categoryId) {

        ReportRequestDto request = buildRequest(startDate, endDate, null, categoryId, null, null, null, null, null);
        return reportingService.getStockMovementReport(request);
    }

    // ============= SUPPORT REPORTS =============

    @GetMapping("/support/summary")
    @PreAuthorize("hasAuthority('TICKET_MANAGE')")
    public SupportTicketSummaryDto getSupportSummary() {
        return reportingService.getSupportTicketSummary();
    }

    @GetMapping("/support/sla-compliance")
    @PreAuthorize("hasAuthority('TICKET_MANAGE')")
    public List<SlaComplianceDto> getSlaCompliance(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String priority,
            @RequestParam(required = false) String status) {

        ReportRequestDto request = buildRequest(startDate, endDate, null, null, null, status, priority, null, null);
        return reportingService.getSlaComplianceReport(request);
    }

    @GetMapping("/support/ticket-volume-trend")
    @PreAuthorize("hasAuthority('TICKET_MANAGE')")
    public TrendReportDto getTicketVolumeTrend(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String priority,
            @RequestParam(required = false) String status,
            @RequestParam(required = false, defaultValue = "MONTHLY") String aggregationLevel) {

        ReportRequestDto request = buildRequest(startDate, endDate, null, null, null, status, priority, aggregationLevel, null);
        return reportingService.getTicketVolumeTrend(request);
    }

    // ============= HELPER METHOD =============

    private ReportRequestDto buildRequest(LocalDate startDate, LocalDate endDate, Long projectId,
                                          Long categoryId, Long departmentId, String status,
                                          String priority, String aggregationLevel, String exportFormat) {
        return ReportRequestDto.builder()
                .startDate(startDate)
                .endDate(endDate)
                .projectId(projectId)
                .categoryId(categoryId)
                .departmentId(departmentId)
                .status(status)
                .priority(priority)
                .aggregationLevel(aggregationLevel)
                .exportFormat(exportFormat)
                .build();
    }
}