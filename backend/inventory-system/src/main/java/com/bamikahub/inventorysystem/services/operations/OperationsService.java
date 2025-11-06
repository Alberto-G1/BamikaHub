package com.bamikahub.inventorysystem.services.operations;

import com.bamikahub.inventorysystem.dao.operations.DailyFieldReportRepository;
import com.bamikahub.inventorysystem.dao.operations.ProjectImageRepository;
import com.bamikahub.inventorysystem.dao.operations.ProjectRepository;
import com.bamikahub.inventorysystem.dao.operations.SiteRepository;
import com.bamikahub.inventorysystem.dao.user.UserRepository;
import com.bamikahub.inventorysystem.dto.operations.DailyFieldReportRequest;
import com.bamikahub.inventorysystem.dto.operations.ProjectRequest;
import com.bamikahub.inventorysystem.dto.operations.SiteRequest;
import com.bamikahub.inventorysystem.models.audit.AuditLog;
import com.bamikahub.inventorysystem.models.operations.DailyFieldReport;
import com.bamikahub.inventorysystem.models.operations.Project;
import com.bamikahub.inventorysystem.models.operations.ProjectImage;
import com.bamikahub.inventorysystem.models.operations.Site;
import com.bamikahub.inventorysystem.models.user.User;
import com.bamikahub.inventorysystem.services.FileStorageService;
import com.bamikahub.inventorysystem.services.audit.AuditService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class OperationsService {

    @Autowired private DailyFieldReportRepository reportRepository;
    @Autowired private ProjectRepository projectRepository;
    @Autowired private ProjectImageRepository imageRepository;
    @Autowired private SiteRepository siteRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private FileStorageService fileStorageService;
    @Autowired private AuditService auditService;

    @Transactional(readOnly = true)
    public List<Project> getAllProjects() {
        return projectRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<Project> getArchivedProjects() {
        return projectRepository.findByIsArchived(true);
    }

    @Transactional(readOnly = true)
    public Project getProjectById(Long id) {
        return projectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Project not found."));
    }

    @Transactional
    public Project createProject(ProjectRequest request) {
        Project project = new Project();
        applyProjectRequest(project, request);
        project.setArchived(false);

        Project savedProject = projectRepository.save(project);

        User actor = safeGetCurrentUser();
        if (actor != null) {
            try {
                Map<String, Object> details = buildProjectSnapshot(savedProject);
                details.put("action", "CREATE");
                auditService.logAction(
                        actor,
                        AuditLog.ActionType.PROJECT_CREATED,
                        "Project",
                        savedProject.getId(),
                        savedProject.getName(),
                        details
                );
            } catch (Exception ignored) {
                // audit logging best-effort
            }
        }

        return savedProject;
    }

    @Transactional
    public Project updateProject(Long id, ProjectRequest request) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Project not found."));

    Map<String, Object> beforeSnapshot = buildProjectSnapshot(project);
    Project.ProjectStatus previousStatus = project.getStatus();
    Set<Long> previousEngineerIds = new HashSet<>(extractEngineerIds(project));
    Set<String> previousEngineerNames = new HashSet<>(extractEngineerNames(project));

        applyProjectRequest(project, request);

        Project updatedProject = projectRepository.save(project);

    Set<Long> updatedEngineerIds = extractEngineerIds(updatedProject);
        Set<Long> addedEngineerIds = new HashSet<>(updatedEngineerIds);
        addedEngineerIds.removeAll(previousEngineerIds);
        Set<Long> removedEngineerIds = new HashSet<>(previousEngineerIds);
        removedEngineerIds.removeAll(updatedEngineerIds);
    Set<String> updatedEngineerNames = extractEngineerNames(updatedProject);
    Set<String> addedEngineerNames = new HashSet<>(updatedEngineerNames);
    addedEngineerNames.removeAll(previousEngineerNames);
    Set<String> removedEngineerNames = new HashSet<>(previousEngineerNames);
    removedEngineerNames.removeAll(updatedEngineerNames);

        User actor = safeGetCurrentUser();
        if (actor != null) {
            try {
                Map<String, Object> afterSnapshot = buildProjectSnapshot(updatedProject);
                Map<String, Object> details = auditService.createDetailsMap();
                details.put("before", beforeSnapshot);
                details.put("after", afterSnapshot);
                details.put("changedFields", computeChangedFields(beforeSnapshot, afterSnapshot));
                details.put("addedEngineerIds", addedEngineerIds);
                details.put("removedEngineerIds", removedEngineerIds);
                details.put("addedEngineerNames", addedEngineerNames);
                details.put("removedEngineerNames", removedEngineerNames);
                details.put("previousStatus", previousStatus);
                details.put("newStatus", updatedProject.getStatus());
                details.put("action", "UPDATE");

                auditService.logAction(
                        actor,
                        AuditLog.ActionType.PROJECT_UPDATED,
                        "Project",
                        updatedProject.getId(),
                        updatedProject.getName(),
                        details
                );

                if (!Objects.equals(previousStatus, updatedProject.getStatus())) {
                    Map<String, Object> statusDetails = auditService.createDetailsMap();
                    statusDetails.put("previousStatus", previousStatus);
                    statusDetails.put("newStatus", updatedProject.getStatus());
                    auditService.logAction(
                            actor,
                            AuditLog.ActionType.PROJECT_STATUS_CHANGED,
                            "Project",
                            updatedProject.getId(),
                            updatedProject.getName(),
                            statusDetails
                    );
                }
            } catch (Exception ignored) {
                // audit logging best-effort
            }
        }

        return updatedProject;
    }

    @Transactional(readOnly = true)
    public List<Site> getSitesForProject(Long projectId) {
        projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found."));
        return siteRepository.findByProjectId(projectId);
    }

    @Transactional
    public Site createSite(SiteRequest request) {
        if (request.getProjectId() == null) {
            throw new IllegalArgumentException("Project ID is required to create a site.");
        }
        if (request.getName() == null || request.getName().isBlank()) {
            throw new IllegalArgumentException("Site name is required.");
        }

        Project project = projectRepository.findById(request.getProjectId())
                .orElseThrow(() -> new RuntimeException("Project not found."));

        if (project.isArchived()) {
            throw new IllegalStateException("Cannot modify sites for an archived project.");
        }

        Site site = new Site();
        site.setName(request.getName());
        site.setLocation(request.getLocation());
        site.setProject(project);

        Site saved = siteRepository.save(site);
        if (project.getSites() != null && !project.getSites().contains(saved)) {
            project.getSites().add(saved);
        }

        User actor = safeGetCurrentUser();
        if (actor != null) {
            try {
                Map<String, Object> details = buildSiteSnapshot(saved);
                details.put("action", "CREATE");

                auditService.logAction(
                        actor,
                        AuditLog.ActionType.SITE_CREATED,
                        "Site",
                        saved.getId(),
                        saved.getName(),
                        details
                );
            } catch (Exception ignored) {
                // keep site creation resilient to audit outages
            }
        }

        return saved;
    }

    @Transactional
    public Site updateSite(Long siteId, SiteRequest request) {
        Site site = siteRepository.findById(siteId)
                .orElseThrow(() -> new RuntimeException("Site not found."));

        Project currentProject = site.getProject();
        if (currentProject != null && currentProject.isArchived()) {
            throw new IllegalStateException("Cannot modify a site belonging to an archived project.");
        }

        Map<String, Object> beforeSnapshot = buildSiteSnapshot(site);

        if (request.getName() != null && !request.getName().isBlank()) {
            site.setName(request.getName());
        }
        site.setLocation(request.getLocation());

        if (request.getProjectId() != null && (currentProject == null || !Objects.equals(currentProject.getId(), request.getProjectId()))) {
            Project targetProject = projectRepository.findById(request.getProjectId())
                    .orElseThrow(() -> new RuntimeException("Target project not found."));
            if (targetProject.isArchived()) {
                throw new IllegalStateException("Cannot assign a site to an archived project.");
            }
            site.setProject(targetProject);
        }

        Site saved = siteRepository.save(site);

        User actor = safeGetCurrentUser();
        if (actor != null) {
            try {
                Map<String, Object> afterSnapshot = buildSiteSnapshot(saved);
                Map<String, Object> details = auditService.createDetailsMap();
                details.put("before", beforeSnapshot);
                details.put("after", afterSnapshot);
                details.put("changedFields", computeChangedFields(beforeSnapshot, afterSnapshot));
                details.put("action", "UPDATE");

                auditService.logAction(
                        actor,
                        AuditLog.ActionType.SITE_UPDATED,
                        "Site",
                        saved.getId(),
                        saved.getName(),
                        details
                );
            } catch (Exception ignored) {
                // updates should not fail because of audit logging issues
            }
        }

        return saved;
    }

    @Transactional
    public void deleteSite(Long siteId) {
        Site site = siteRepository.findById(siteId)
                .orElseThrow(() -> new RuntimeException("Site not found."));

        Project project = site.getProject();
        if (project != null && project.isArchived()) {
            throw new IllegalStateException("Cannot delete sites from an archived project.");
        }

        long linkedReports = reportRepository.countBySiteId(siteId);
        if (linkedReports > 0) {
            throw new IllegalStateException("Cannot delete site that is referenced by field reports.");
        }

        String siteName = site.getName();
        Map<String, Object> snapshot = buildSiteSnapshot(site);
        siteRepository.delete(site);
        if (project != null && project.getSites() != null) {
            project.getSites().removeIf(existing -> Objects.equals(existing.getId(), siteId));
        }

        User actor = safeGetCurrentUser();
        if (actor != null) {
            try {
                Map<String, Object> details = auditService.createDetailsMap();
                details.put("site", snapshot);
                details.put("action", "DELETE");
                details.put("linkedReportCount", linkedReports);

                auditService.logAction(
                        actor,
                        AuditLog.ActionType.SITE_DELETED,
                        "Site",
                        siteId,
                        siteName,
                        details
                );
            } catch (Exception ignored) {
                // deletions must remain resilient
            }
        }
    }

    @Transactional(readOnly = true)
    public ReportListing getReportsForProject(Long projectId, Long siteId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found."));

        Site site = null;
        if (siteId != null) {
            site = siteRepository.findById(siteId)
                    .orElseThrow(() -> new RuntimeException("Site not found."));
            if (site.getProject() == null || !Objects.equals(site.getProject().getId(), projectId)) {
                throw new IllegalStateException("Requested site is not associated with this project.");
            }
        }

        List<DailyFieldReport> reports = (site != null)
                ? reportRepository.findByProjectIdAndSiteId(projectId, siteId)
                : reportRepository.findByProjectId(projectId);

    List<SiteSnapshot> siteSummaries = siteRepository.findByProjectId(projectId).stream()
        .map(s -> new SiteSnapshot(
            s.getId(),
            s.getName(),
            s.getLocation(),
            reportRepository.countBySiteId(s.getId()),
            false
        ))
        .collect(Collectors.toList());

    long projectLevelReportCount = reportRepository.countByProjectIdAndSiteIsNull(projectId);
    SiteSnapshot projectRollup = new SiteSnapshot(null, "Whole Project", null, projectLevelReportCount, true);
    siteSummaries.add(0, projectRollup);

        User actor = safeGetCurrentUser();
        if (actor != null) {
            try {
                Map<String, Object> details = auditService.createDetailsMap();
                details.put("projectId", project.getId());
                details.put("projectName", project.getName());
                details.put("siteId", site != null ? site.getId() : null);
                details.put("siteName", site != null ? site.getName() : null);
                details.put("resultCount", reports.size());

                auditService.logAction(
                        actor,
                        AuditLog.ActionType.FIELD_REPORT_VIEWED,
                        "Project",
                        project.getId(),
                        project.getName(),
                        details
                );
            } catch (Exception ignored) {
                // report retrieval must continue even if audit logging fails
            }
        }

        return new ReportListing(reports, siteSummaries);
    }

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

    User currentUser = getCurrentUser();

        DailyFieldReport report = new DailyFieldReport();
        report.setProject(project);
        report.setSubmittedBy(currentUser);
        report.setReportDate(request.getReportDate());
        report.setWorkProgressUpdate(request.getWorkProgressUpdate());
        report.setMaterialsUsed(request.getMaterialsUsed());
        report.setChallengesFaced(request.getChallengesFaced());
        report.setWeatherConditions(request.getWeatherConditions());

        if (request.getSiteId() != null) {
            Site site = siteRepository.findById(request.getSiteId())
                    .orElseThrow(() -> new RuntimeException("Site not found."));
            if (site.getProject() == null || !Objects.equals(site.getProject().getId(), project.getId())) {
                throw new IllegalStateException("Selected site does not belong to the specified project.");
            }
            report.setSite(site);
        }

        if (file != null && !file.isEmpty()) {
            // For better organization, let's create a new storage location for reports
            // You will need to add this property to application.properties and the FileStorageService constructor
            String filename = fileStorageService.storeItemImage(file); // Reusing item image logic for now
            report.setReportFileUrl("/uploads/item-images/" + filename); // Update this path later if you create a dedicated folder
        }

        DailyFieldReport saved = reportRepository.save(report);

        try {
            Map<String, Object> details = auditService.createDetailsMap();
            details.put("projectId", project.getId());
            details.put("projectName", project.getName());
            details.put("reportDate", saved.getReportDate());
            details.put("fileAttached", saved.getReportFileUrl() != null);
            details.put("siteId", saved.getSite() != null ? saved.getSite().getId() : null);
            details.put("siteName", saved.getSite() != null ? saved.getSite().getName() : null);
        details.put("submittedBy", currentUser.getFullName());

            auditService.logAction(
                    currentUser,
                    AuditLog.ActionType.FIELD_REPORT_CREATED,
                    "Project",
                    project.getId(),
                    project.getName(),
                    details
            );
        } catch (Exception ignored) {
            // field report submissions must remain resilient to audit outages
        }

        return saved;
    }

    @Transactional
    public void archiveProject(Long projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found."));

        if (project.isArchived()) {
            throw new IllegalStateException("Project is already archived.");
        }

        Project.ProjectStatus previousStatus = project.getStatus();
        boolean previousArchived = project.isArchived();

        if (project.getStatus() != Project.ProjectStatus.COMPLETED) {
            throw new IllegalStateException("Only completed projects can be archived.");
        }
        project.setArchived(true);
        Project archivedProject = projectRepository.save(project);

        User actor = safeGetCurrentUser();
        if (actor != null) {
            try {
                Map<String, Object> details = auditService.createDetailsMap();
                details.put("previousStatus", previousStatus);
                details.put("newStatus", archivedProject.getStatus());
                details.put("previousArchived", previousArchived);
                details.put("newArchived", archivedProject.isArchived());
                details.put("action", "ARCHIVE");

                auditService.logAction(
                        actor,
                        AuditLog.ActionType.PROJECT_ARCHIVED,
                        "Project",
                        archivedProject.getId(),
                        archivedProject.getName(),
                        details
                );
            } catch (Exception ignored) {
                // audit must remain best-effort
            }
        }
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

        ProjectImage saved = imageRepository.save(projectImage);

        User actor = safeGetCurrentUser();
        if (actor != null) {
            try {
                Map<String, Object> details = auditService.createDetailsMap();
                details.put("imageId", saved.getId());
                details.put("description", description);
                details.put("imageUrl", saved.getImageUrl());
                details.put("action", "GALLERY_ADD");

                auditService.logAction(
                        actor,
                        AuditLog.ActionType.PROJECT_UPDATED,
                        "Project",
                        project.getId(),
                        project.getName(),
                        details
                );
            } catch (Exception ignored) {
                // gallery updates should continue even if audit logging fails
            }
        }

        return saved;
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

        String imageUrl = image.getImageUrl();
        imageRepository.delete(image);

        User actor = safeGetCurrentUser();
        if (actor != null) {
            try {
                Map<String, Object> details = auditService.createDetailsMap();
                details.put("imageId", imageId);
                details.put("imageUrl", imageUrl);
                details.put("action", "GALLERY_DELETE");

                auditService.logAction(
                        actor,
                        AuditLog.ActionType.PROJECT_UPDATED,
                        "Project",
                        project.getId(),
                        project.getName(),
                        details
                );
            } catch (Exception ignored) {
                // audit logs should not block deletions
            }
        }
    }

    private void applyProjectRequest(Project project, ProjectRequest request) {
        project.setName(com.bamikahub.inventorysystem.util.ValidationUtil.validateProjectName(request.getName()));
        project.setClientName(com.bamikahub.inventorysystem.util.ValidationUtil.validateClientName(request.getClientName()));
        project.setDescription(com.bamikahub.inventorysystem.util.ValidationUtil.validateProjectDescriptionOptional(request.getDescription()));
        project.setStatus(request.getStatus());
        com.bamikahub.inventorysystem.util.ValidationUtil.validateProjectDates(request.getStartDate(), request.getEndDate());
        project.setStartDate(request.getStartDate());
        project.setEndDate(request.getEndDate());
        updateAssignedEngineers(project, request.getAssignedEngineerIds());
    }

    private void updateAssignedEngineers(Project project, Set<Long> engineerIds) {
        if (project.getAssignedEngineers() == null) {
            project.setAssignedEngineers(new HashSet<>());
        }

        project.getAssignedEngineers().clear();

        if (engineerIds != null && !engineerIds.isEmpty()) {
            Set<User> engineers = new HashSet<>(userRepository.findAllById(engineerIds));
            project.getAssignedEngineers().addAll(engineers);
        }
    }

    private Map<String, Object> buildProjectSnapshot(Project project) {
        Map<String, Object> snapshot = new HashMap<>();
        snapshot.put("clientName", project.getClientName());
        snapshot.put("status", project.getStatus());
        snapshot.put("description", project.getDescription());
        snapshot.put("startDate", project.getStartDate());
        snapshot.put("endDate", project.getEndDate());
        snapshot.put("archived", project.isArchived());
        snapshot.put("assignedEngineerIds", extractEngineerIds(project));
        snapshot.put("assignedEngineerNames", extractEngineerNames(project));
        return snapshot;
    }

    public record SiteSnapshot(Long id, String name, String location, long reportCount, boolean projectLevel) { }

    public record ReportListing(List<DailyFieldReport> reports, List<SiteSnapshot> siteSummaries) { }

    private Map<String, Object> buildSiteSnapshot(Site site) {
        Map<String, Object> snapshot = new HashMap<>();
        snapshot.put("name", site.getName());
        snapshot.put("location", site.getLocation());
        if (site.getProject() != null) {
            snapshot.put("projectId", site.getProject().getId());
            snapshot.put("projectName", site.getProject().getName());
        } else {
            snapshot.put("projectId", null);
            snapshot.put("projectName", null);
        }
        return snapshot;
    }

    private Set<Long> extractEngineerIds(Project project) {
        if (project.getAssignedEngineers() == null) {
            return new HashSet<>();
        }
        return project.getAssignedEngineers().stream()
                .map(User::getId)
                .collect(Collectors.toSet());
    }

    private Set<String> extractEngineerNames(Project project) {
        if (project.getAssignedEngineers() == null) {
            return new HashSet<>();
        }
        return project.getAssignedEngineers().stream()
                .map(User::getFullName)
                .collect(Collectors.toSet());
    }

    private Set<String> computeChangedFields(Map<String, Object> before, Map<String, Object> after) {
        Set<String> changed = new HashSet<>();
        after.forEach((key, newValue) -> {
            Object oldValue = before.get(key);
            if (!Objects.equals(oldValue, newValue)) {
                changed.add(key);
            }
        });
        return changed;
    }

    private User safeGetCurrentUser() {
        try {
            return getCurrentUser();
        } catch (Exception ignored) {
            return null;
        }
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Current user not found."));
    }
}