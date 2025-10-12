package com.bamikahub.inventorysystem.services.operations;

import com.bamikahub.inventorysystem.dao.operations.DailyFieldReportRepository;
import com.bamikahub.inventorysystem.dao.operations.ProjectImageRepository;
import com.bamikahub.inventorysystem.dao.operations.ProjectRepository;
import com.bamikahub.inventorysystem.dao.user.UserRepository;
import com.bamikahub.inventorysystem.dto.operations.DailyFieldReportRequest;
import com.bamikahub.inventorysystem.models.operations.DailyFieldReport;
import com.bamikahub.inventorysystem.models.operations.Project;
import com.bamikahub.inventorysystem.models.operations.ProjectImage;
import com.bamikahub.inventorysystem.models.user.User;
import com.bamikahub.inventorysystem.services.FileStorageService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
public class OperationsService {

    @Autowired private DailyFieldReportRepository reportRepository;
    @Autowired private ProjectRepository projectRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private FileStorageService fileStorageService;
    @Autowired private ProjectImageRepository imageRepository;

    // Replace the old, incomplete submitFieldReport method with this one.
    @Transactional
    public DailyFieldReport submitFieldReport(String requestJson, MultipartFile file) {
        // Step 1: Deserialize the JSON string into our DTO
        DailyFieldReportRequest request;
        try {
            ObjectMapper objectMapper = new ObjectMapper();
            objectMapper.findAndRegisterModules(); // Needed for JavaTime types like LocalDate
            request = objectMapper.readValue(requestJson, DailyFieldReportRequest.class);
        } catch (Exception e) {
            throw new RuntimeException("Could not parse report data JSON.", e);
        }

        // Step 2: Get the currently authenticated user
        String currentUserEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new RuntimeException("Current user not found."));

        // Step 3: Get the associated project
        Project project = projectRepository.findById(request.getProjectId())
                .orElseThrow(() -> new RuntimeException("Project not found."));

        // Step 4: Create and populate the new DailyFieldReport entity
        DailyFieldReport report = new DailyFieldReport();
        report.setProject(project);
        report.setSubmittedBy(currentUser);
        report.setReportDate(request.getReportDate());
        report.setWorkProgressUpdate(request.getWorkProgressUpdate());
        report.setMaterialsUsed(request.getMaterialsUsed());
        report.setChallengesFaced(request.getChallengesFaced());
        report.setWeatherConditions(request.getWeatherConditions());

        // Handle optional Site association
        if (request.getSiteId() != null) {
            // This requires a SiteRepository. Assuming you'll create one.
            // Site site = siteRepository.findById(request.getSiteId()).orElse(null);
            // report.setSite(site);
        }

        // Step 5: Handle the optional file upload
        if (file != null && !file.isEmpty()) {
            // For better organization, let's create a new storage location for reports
            // You will need to add this property to application.properties and the FileStorageService constructor
            String filename = fileStorageService.storeItemImage(file); // Reusing item image logic for now
            report.setReportFileUrl("/uploads/item-images/" + filename); // Update this path later if you create a dedicated folder
        }

        // Step 6: Save the report to the database
        return reportRepository.save(report);
    }

    // METHOD: Archive a project
    @Transactional
    public void archiveProject(Long projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found."));

        // Business Rule: Only COMPLETED projects can be archived
        if (project.getStatus() != Project.ProjectStatus.COMPLETED) {
            throw new IllegalStateException("Only completed projects can be archived.");
        }
        project.setArchived(true);
        projectRepository.save(project);
    }

    // METHOD: Add an image to a project's gallery
    @Transactional
    public ProjectImage addImageToProjectGallery(Long projectId, String description, MultipartFile file) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found."));

        // Validation for image file (size, type) would go here

        String filename = fileStorageService.storeItemImage(file); // Reusing item image storage logic

        ProjectImage projectImage = new ProjectImage();
        projectImage.setProject(project);
        projectImage.setDescription(description);
        projectImage.setImageUrl("/uploads/item-images/" + filename); // Use appropriate path

        return imageRepository.save(projectImage);
    }
}