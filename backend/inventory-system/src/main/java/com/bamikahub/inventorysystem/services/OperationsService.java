package com.bamikahub.inventorysystem.services;

import com.bamikahub.inventorysystem.dao.DailyFieldReportRepository;
import com.bamikahub.inventorysystem.dao.ProjectRepository;
import com.bamikahub.inventorysystem.dao.UserRepository;
import com.bamikahub.inventorysystem.dto.DailyFieldReportRequest;
import com.bamikahub.inventorysystem.models.DailyFieldReport;
import com.bamikahub.inventorysystem.models.Project;
import com.bamikahub.inventorysystem.models.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OperationsService {

    @Autowired private DailyFieldReportRepository reportRepository;
    @Autowired private ProjectRepository projectRepository;
    @Autowired private UserRepository userRepository;

    @Transactional
    public DailyFieldReport submitFieldReport(DailyFieldReportRequest request) {
        String currentUserEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new RuntimeException("Current user not found."));

        Project project = projectRepository.findById(request.getProjectId())
                .orElseThrow(() -> new RuntimeException("Project not found."));

        DailyFieldReport report = new DailyFieldReport();
        report.setProject(project);
        report.setSubmittedBy(currentUser);
        report.setReportDate(request.getReportDate());
        report.setWorkProgressUpdate(request.getWorkProgressUpdate());
        report.setMaterialsUsed(request.getMaterialsUsed());
        report.setChallengesFaced(request.getChallengesFaced());
        report.setWeatherConditions(request.getWeatherConditions());

        // Site is optional
        if (request.getSiteId() != null) {
            // Logic to find and set Site would go here
        }

        return reportRepository.save(report);
    }
}