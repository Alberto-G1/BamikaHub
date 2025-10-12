package com.bamikahub.inventorysystem.controllers.operations;

import com.bamikahub.inventorysystem.dao.operations.ProjectRepository;
import com.bamikahub.inventorysystem.dao.user.UserRepository;
import com.bamikahub.inventorysystem.dto.operations.ProjectRequest;
import com.bamikahub.inventorysystem.models.operations.Project;
import com.bamikahub.inventorysystem.models.user.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/projects")
@CrossOrigin(origins = "*", maxAge = 3600)
public class ProjectController {

    @Autowired
    private ProjectRepository projectRepository;
    // NOTE: This is a simplified update. A full implementation would use a service layer.
    @Autowired private UserRepository userRepository;

    @GetMapping
    @PreAuthorize("hasAuthority('PROJECT_READ')")
    public List<Project> getAllProjects() {
        return projectRepository.findAll();
    }

    @PostMapping
    @PreAuthorize("hasAuthority('PROJECT_CREATE')")
    public Project createProject(@RequestBody Project project) {
        // More complex logic using ProjectRequest DTO would go here in a real service
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
        }

        return projectRepository.save(project);
    }
}