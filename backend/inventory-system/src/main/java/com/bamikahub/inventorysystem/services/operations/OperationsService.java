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
    @Autowired private ProjectImageRepository imageRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private FileStorageService fileStorageService;

    @Transactional
    public DailyFieldReport submitFieldReport(String requestJson, MultipartFile file) {
        DailyFieldReportRequest request;
        try {
            ObjectMapper objectMapper = new ObjectMapper();
            objectMapper.findAndRegisterModules();
            request = objectMapper.readValue(requestJson, DailyFieldReportRequest.class);
        } catch (Exception e) {
            throw new RuntimeException("Could not parse report data JSON.", e);
        }

        Project project = projectRepository.findById(request.getProjectId())
                .orElseThrow(() -> new RuntimeException("Project not found."));

        // THE FIX: Prevent submission on archived projects
        if (project.isArchived()) {
            throw new IllegalStateException("Cannot submit reports for an archived project.");
        }

        User currentUser = userRepository.findByEmail(SecurityContextHolder.getContext().getAuthentication().getName())
                .orElseThrow(() -> new RuntimeException("Current user not found."));

        DailyFieldReport report = new DailyFieldReport();
        report.setProject(project);
        report.setSubmittedBy(currentUser);
        report.setReportDate(request.getReportDate());
        report.setWorkProgressUpdate(request.getWorkProgressUpdate());
        report.setMaterialsUsed(request.getMaterialsUsed());
        report.setChallengesFaced(request.getChallengesFaced());
        report.setWeatherConditions(request.getWeatherConditions());

        if (file != null && !file.isEmpty()) {
            // For better organization, let's create a new storage location for reports
            // You will need to add this property to application.properties and the FileStorageService constructor
            String filename = fileStorageService.storeItemImage(file); // Reusing item image logic for now
            report.setReportFileUrl("/uploads/item-images/" + filename); // Update this path later if you create a dedicated folder
        }

        return reportRepository.save(report);
    }

    @Transactional
    public void archiveProject(Long projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found."));

        if (project.getStatus() != Project.ProjectStatus.COMPLETED) {
            throw new IllegalStateException("Only completed projects can be archived.");
        }
        project.setArchived(true);
        projectRepository.save(project);
    }

    @Transactional
    public ProjectImage addImageToProjectGallery(Long projectId, String description, MultipartFile file) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found."));

        // THE FIX: Prevent upload on archived projects
        if (project.isArchived()) {
            throw new IllegalStateException("Cannot add images to an archived project gallery.");
        }

        // ... (validation for image file) ...

        String filename = fileStorageService.storeItemImage(file);
        ProjectImage projectImage = new ProjectImage();
        projectImage.setProject(project);
        projectImage.setDescription(description);
        projectImage.setImageUrl("/uploads/item-images/" + filename);

        return imageRepository.save(projectImage);
    }

    // NEW METHOD: Delete an image from a project's gallery
    @Transactional
    public void deleteImageFromProjectGallery(Long projectId, Long imageId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found."));

        // Security check: cannot modify an archived project
        if (project.isArchived()) {
            throw new IllegalStateException("Cannot delete images from an archived project gallery.");
        }

        ProjectImage image = imageRepository.findById(imageId)
                .orElseThrow(() -> new RuntimeException("Image not found in gallery."));

        // Verify the image belongs to the correct project before deleting
        if (!image.getProject().getId().equals(projectId)) {
            throw new SecurityException("Image does not belong to the specified project.");
        }

        // TODO: Add logic here to delete the actual file from the filesystem
        // File fileToDelete = new File(uploadDir + image.getImageUrl());
        // fileToDelete.delete();

        imageRepository.delete(image);
    }
}