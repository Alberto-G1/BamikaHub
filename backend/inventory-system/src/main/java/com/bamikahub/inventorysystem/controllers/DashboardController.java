package com.bamikahub.inventorysystem.controllers;

import com.bamikahub.inventorysystem.dto.DashboardSummaryDto;
import com.bamikahub.inventorysystem.services.DashboardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
@CrossOrigin(origins = "*", maxAge = 3600)
public class DashboardController {

    @Autowired
    private DashboardService dashboardService;

    @GetMapping("/summary")
    @PreAuthorize("isAuthenticated()") // Any authenticated user can see the dashboard
    public DashboardSummaryDto getSummary() {
        return dashboardService.getDashboardSummary();
    }
}