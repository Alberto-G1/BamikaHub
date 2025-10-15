package com.bamikahub.inventorysystem.controllers.operations;

import com.bamikahub.inventorysystem.dao.operations.ProjectRepository;
import com.bamikahub.inventorysystem.dao.user.UserRepository;
import com.bamikahub.inventorysystem.dto.operations.ProjectRequest;
import com.bamikahub.inventorysystem.models.operations.Project;
import com.bamikahub.inventorysystem.models.operations.ProjectImage;
import com.bamikahub.inventorysystem.models.user.User;
import com.bamikahub.inventorysystem.services.operations.OperationsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/projects")
@CrossOrigin(origins = "*", maxAge = 3600)
public class ProjectController {

    @Autowired private ProjectRepository projectRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private OperationsService operationsService;

    @GetMapping
    @PreAuthorize("hasAuthority('PROJECT_READ')")
    public List<Project> getAllProjects() {
        return projectRepository.findAll();
    }

    @PostMapping
    @PreAuthorize("hasAuthority('PROJECT_CREATE')")
    public Project createProject(@RequestBody ProjectRequest request) {
        Project project = new Project();
        project.setName(request.getName());
        project.setClientName(request.getClientName());
        project.setDescription(request.getDescription());
        project.setStatus(request.getStatus());
        project.setStartDate(request.getStartDate());
        project.setEndDate(request.getEndDate());

        if (request.getAssignedEngineerIds() != null && !request.getAssignedEngineerIds().isEmpty()) {
            Set<User> engineers = new HashSet<>(userRepository.findAllById(request.getAssignedEngineerIds()));
            project.setAssignedEngineers(engineers);
        }

        return projectRepository.save(project);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('PROJECT_READ')")
    public Project getProjectById(@PathVariable Long id) {
        return projectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Project not found."));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('PROJECT_UPDATE')")
    public Project updateProject(@PathVariable Long id, @RequestBody ProjectRequest request) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Project not found."));

        project.setName(request.getName());
        project.setClientName(request.getClientName());
        project.setDescription(request.getDescription());
        project.setStatus(request.getStatus());
        project.setStartDate(request.getStartDate());
        project.setEndDate(request.getEndDate());

        if (request.getAssignedEngineerIds() != null) {
            Set<User> engineers = new HashSet<>(userRepository.findAllById(request.getAssignedEngineerIds()));
            project.setAssignedEngineers(engineers);
        } else {
            project.getAssignedEngineers().clear(); // Clear engineers if an empty list is sent
        }

        return projectRepository.save(project);
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
        return projectRepository.findByIsArchived(true);
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