package com.bamikahub.inventorysystem.controllers.reporting;

import com.bamikahub.inventorysystem.dto.reporting.DashboardChartsDto;
import com.bamikahub.inventorysystem.dto.reporting.InventoryValuationDto;
import com.bamikahub.inventorysystem.dto.reporting.ProjectCostDto;
import com.bamikahub.inventorysystem.dto.reporting.SupportTicketSummaryDto;
import com.bamikahub.inventorysystem.services.reporting.ReportingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/reports")
@CrossOrigin(origins = "*", maxAge = 3600)
public class ReportingController {

    @Autowired
    private ReportingService reportingService;

    @GetMapping("/dashboard-charts")
    @PreAuthorize("isAuthenticated()")
    public DashboardChartsDto getDashboardChartData() {
        return reportingService.getDashboardChartsData();
    }

    @GetMapping("/inventory-valuation")
    @PreAuthorize("hasAuthority('FINANCE_READ') or hasAuthority('ITEM_READ')")
    public List<InventoryValuationDto> getInventoryValuation() {
        return reportingService.getInventoryValuationReport();
    }

    @GetMapping("/project-costs")
    @PreAuthorize("hasAuthority('FINANCE_READ') or hasAuthority('PROJECT_READ')")
    public List<ProjectCostDto> getProjectCosts() {
        return reportingService.getProjectCostReport();
    }

    @GetMapping("/support-summary")
    @PreAuthorize("hasAuthority('TICKET_MANAGE')")
    public SupportTicketSummaryDto getSupportSummary() {
        return reportingService.getSupportTicketSummary();
    }
}