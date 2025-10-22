package com.bamikahub.inventorysystem.controllers.operations;

import com.bamikahub.inventorysystem.dto.operations.SiteRequest;
import com.bamikahub.inventorysystem.models.operations.Site;
import com.bamikahub.inventorysystem.services.operations.OperationsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*", maxAge = 3600)
public class SiteController {

    @Autowired private OperationsService operationsService;

    @GetMapping("/projects/{projectId}/sites")
    @PreAuthorize("hasAuthority('PROJECT_READ')")
    public List<Site> getSitesForProject(@PathVariable Long projectId) {
        return operationsService.getSitesForProject(projectId);
    }

    @PostMapping("/projects/{projectId}/sites")
    @PreAuthorize("hasAuthority('PROJECT_UPDATE')")
    public Site createSite(@PathVariable Long projectId, @RequestBody SiteRequest request) {
        request.setProjectId(projectId);
        return operationsService.createSite(request);
    }

    @PutMapping("/sites/{siteId}")
    @PreAuthorize("hasAuthority('PROJECT_UPDATE')")
    public Site updateSite(@PathVariable Long siteId, @RequestBody SiteRequest request) {
        return operationsService.updateSite(siteId, request);
    }

    @DeleteMapping("/sites/{siteId}")
    @PreAuthorize("hasAuthority('PROJECT_DELETE')")
    public ResponseEntity<Void> deleteSite(@PathVariable Long siteId) {
        operationsService.deleteSite(siteId);
        return ResponseEntity.ok().build();
    }
}
