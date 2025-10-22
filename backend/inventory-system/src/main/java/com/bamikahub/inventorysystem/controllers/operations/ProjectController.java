package com.bamikahub.inventorysystem.controllers.operations;

import com.bamikahub.inventorysystem.dto.operations.ProjectRequest;
import com.bamikahub.inventorysystem.models.operations.Project;
import com.bamikahub.inventorysystem.models.operations.ProjectImage;
import com.bamikahub.inventorysystem.services.operations.OperationsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/projects")
@CrossOrigin(origins = "*", maxAge = 3600)
public class ProjectController {

    @Autowired private OperationsService operationsService;

    @GetMapping
    @PreAuthorize("hasAuthority('PROJECT_READ')")
    public List<Project> getAllProjects() {
        return operationsService.getAllProjects();
    }

    @PostMapping
    @PreAuthorize("hasAuthority('PROJECT_CREATE')")
    public Project createProject(@RequestBody ProjectRequest request) {
        return operationsService.createProject(request);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('PROJECT_READ')")
    public Project getProjectById(@PathVariable Long id) {
        return operationsService.getProjectById(id);
    }

    @GetMapping("/{projectId}/reports")
    @PreAuthorize("hasAuthority('FIELD_REPORT_READ')")
    public ResponseEntity<OperationsService.ReportListing> getProjectReports(
            @PathVariable Long projectId,
            @RequestParam(value = "siteId", required = false) Long siteId
    ) {
        OperationsService.ReportListing reports = operationsService.getReportsForProject(projectId, siteId);
        return ResponseEntity.ok(reports);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('PROJECT_UPDATE')")
    public Project updateProject(@PathVariable Long id, @RequestBody ProjectRequest request) {
        return operationsService.updateProject(id, request);
    }

    // Endpoint to archive a project
    @PostMapping("/{id}/archive")
    @PreAuthorize("hasAuthority('PROJECT_DELETE')") // Reuse DELETE permission for archiving
    public ResponseEntity<Void> archiveProject(@PathVariable Long id) {
        operationsService.archiveProject(id);
        return ResponseEntity.ok().build();
    }

    // NEW: Endpoint to get archived projects
    @GetMapping("/archived")
    @PreAuthorize("hasAuthority('PROJECT_READ')")
    public List<Project> getArchivedProjects() {
        return operationsService.getArchivedProjects();
    }

    // Endpoint for gallery image upload
    @PostMapping("/{id}/gallery")
    @PreAuthorize("hasAuthority('PROJECT_UPDATE')")
    public ProjectImage addGalleryImage(@PathVariable Long id,
                                        @RequestPart("description") String description,
                                        @RequestPart("file") MultipartFile file) {
        return operationsService.addImageToProjectGallery(id, description, file);
    }

    @DeleteMapping("/{projectId}/gallery/{imageId}")
    @PreAuthorize("hasAuthority('PROJECT_DELETE')") // Reuse a high-level permission for deletion
    public ResponseEntity<Void> deleteGalleryImage(@PathVariable Long projectId, @PathVariable Long imageId) {
        operationsService.deleteImageFromProjectGallery(projectId, imageId);
        return ResponseEntity.ok().build();
    }
}