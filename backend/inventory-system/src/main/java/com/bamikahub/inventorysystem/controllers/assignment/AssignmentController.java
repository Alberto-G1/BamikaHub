package com.bamikahub.inventorysystem.controllers.assignment;

import com.bamikahub.inventorysystem.dto.assignment.AssignmentActivityCreateRequest;
import com.bamikahub.inventorysystem.dto.assignment.AssignmentActivityDTO;
import com.bamikahub.inventorysystem.dto.assignment.AssignmentAttachmentDTO;
import com.bamikahub.inventorysystem.dto.assignment.AssignmentCommentDTO;
import com.bamikahub.inventorysystem.dto.assignment.AssignmentDTO;
import com.bamikahub.inventorysystem.security.services.UserDetailsImpl;
import com.bamikahub.inventorysystem.services.assignment.AssignmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/assignments")
@RequiredArgsConstructor
public class AssignmentController {

    private final AssignmentService assignmentService;

    /**
     * Create a new assignment (requires ASSIGNMENT_CREATE permission)
     */
    @PostMapping
    @PreAuthorize("hasAuthority('ASSIGNMENT_CREATE')")
    public ResponseEntity<AssignmentDTO> createAssignment(
            @Valid @RequestBody AssignmentDTO dto,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        Long assignerId = userDetails.getId();
        AssignmentDTO created = assignmentService.createAssignment(dto, assignerId);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * Update an assignment (requires ASSIGNMENT_UPDATE permission)
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ASSIGNMENT_UPDATE')")
    public ResponseEntity<AssignmentDTO> updateAssignment(
            @PathVariable Long id,
            @Valid @RequestBody AssignmentDTO dto,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        Long actorId = userDetails.getId();
        AssignmentDTO updated = assignmentService.updateAssignment(id, dto, actorId);
        return ResponseEntity.ok(updated);
    }

    /**
     * Update assignment progress (assignee can update their own)
     */
    @PatchMapping("/{id}/progress")
    @PreAuthorize("hasAuthority('ASSIGNMENT_READ')")
    public ResponseEntity<AssignmentDTO> updateProgress(
            @PathVariable Long id,
            @RequestParam Integer progress,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        Long actorId = userDetails.getId();
        AssignmentDTO updated = assignmentService.updateProgress(id, progress, actorId);
        return ResponseEntity.ok(updated);
    }

    /**
     * Get all assignments (requires ASSIGNMENT_CREATE - for managers/assigners)
     */
    @GetMapping
    @PreAuthorize("hasAuthority('ASSIGNMENT_CREATE')")
    public ResponseEntity<List<AssignmentDTO>> getAllAssignments() {
        List<AssignmentDTO> assignments = assignmentService.getAllAssignments();
        return ResponseEntity.ok(assignments);
    }

    /**
     * Get my assignments (assignments where I am the assignee)
     */
    @GetMapping("/my-assignments")
    @PreAuthorize("hasAuthority('ASSIGNMENT_READ')")
    public ResponseEntity<List<AssignmentDTO>> getMyAssignments(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        Long userId = userDetails.getId();
        List<AssignmentDTO> assignments = assignmentService.getMyAssignments(userId);
        return ResponseEntity.ok(assignments);
    }

    /**
     * Get assignments created by me (assignments I assigned to others)
     */
    @GetMapping("/created-by-me")
    @PreAuthorize("hasAuthority('ASSIGNMENT_CREATE')")
    public ResponseEntity<List<AssignmentDTO>> getAssignmentsCreatedByMe(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        Long userId = userDetails.getId();
        List<AssignmentDTO> assignments = assignmentService.getAssignmentsCreatedBy(userId);
        return ResponseEntity.ok(assignments);
    }

    /**
     * Get a single assignment by ID
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('ASSIGNMENT_READ')")
    public ResponseEntity<AssignmentDTO> getAssignment(@PathVariable Long id) {
        AssignmentDTO assignment = assignmentService.getAssignmentById(id);
        return ResponseEntity.ok(assignment);
    }

    /**
     * Delete an assignment (requires ASSIGNMENT_DELETE permission)
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ASSIGNMENT_DELETE')")
    public ResponseEntity<Void> deleteAssignment(@PathVariable Long id) {
        assignmentService.deleteAssignment(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Add a comment to an assignment
     */
    @PostMapping("/{id}/comments")
    @PreAuthorize("hasAuthority('ASSIGNMENT_READ')")
    public ResponseEntity<AssignmentCommentDTO> addComment(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        Long userId = userDetails.getId();
        String commentText = body.get("comment");
        AssignmentCommentDTO comment = assignmentService.addComment(id, commentText, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(comment);
    }

    /**
     * Get all comments for an assignment
     */
    @GetMapping("/{id}/comments")
    @PreAuthorize("hasAuthority('ASSIGNMENT_READ')")
    public ResponseEntity<List<AssignmentCommentDTO>> getComments(@PathVariable Long id) {
        List<AssignmentCommentDTO> comments = assignmentService.getComments(id);
        return ResponseEntity.ok(comments);
    }

    /**
     * Upload an attachment to an assignment
     */
    @PostMapping("/{id}/attachments")
    @PreAuthorize("hasAuthority('ASSIGNMENT_READ')")
    public ResponseEntity<AssignmentAttachmentDTO> uploadAttachment(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserDetailsImpl userDetails) throws IOException {
        Long userId = userDetails.getId();
        AssignmentAttachmentDTO attachment = assignmentService.uploadAttachment(id, file, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(attachment);
    }

    /**
     * Get all attachments for an assignment
     */
    @GetMapping("/{id}/attachments")
    @PreAuthorize("hasAuthority('ASSIGNMENT_READ')")
    public ResponseEntity<List<AssignmentAttachmentDTO>> getAttachments(@PathVariable Long id) {
        List<AssignmentAttachmentDTO> attachments = assignmentService.getAttachments(id);
        return ResponseEntity.ok(attachments);
    }

    /**
     * Delete an attachment
     */
    @DeleteMapping("/attachments/{attachmentId}")
    @PreAuthorize("hasAuthority('ASSIGNMENT_UPDATE')")
    public ResponseEntity<Void> deleteAttachment(@PathVariable Long attachmentId) {
        assignmentService.deleteAttachment(attachmentId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Get assignment statistics for the current user
     */
    @GetMapping("/statistics")
    @PreAuthorize("hasAuthority('ASSIGNMENT_READ')")
    public ResponseEntity<AssignmentService.AssignmentStatistics> getStatistics(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        Long userId = userDetails.getId();
        AssignmentService.AssignmentStatistics stats = assignmentService.getStatistics(userId);
        return ResponseEntity.ok(stats);
    }

    /**
     * Manual trigger to mark overdue assignments (can be scheduled)
     */
    @PostMapping("/mark-overdue")
    @PreAuthorize("hasAuthority('ASSIGNMENT_CREATE')")
    public ResponseEntity<Map<String, String>> markOverdueAssignments() {
        assignmentService.markOverdueAssignments();
        Map<String, String> response = new HashMap<>();
        response.put("message", "Overdue assignments marked successfully");
        return ResponseEntity.ok(response);
    }

    // ====== Workflow v2 endpoints ======

    @PostMapping("/{id}/activities")
    @PreAuthorize("hasAuthority('ASSIGNMENT_READ')")
    public ResponseEntity<AssignmentActivityDTO> createActivity(
            @PathVariable Long id,
            @Valid @RequestBody AssignmentActivityCreateRequest request,
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {
        AssignmentActivityDTO dto = assignmentService.createActivity(id, request, userDetails.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(dto);
    }

    @GetMapping("/{id}/activities")
    @PreAuthorize("hasAuthority('ASSIGNMENT_READ')")
    public ResponseEntity<List<AssignmentActivityDTO>> getActivities(@PathVariable Long id) {
        return ResponseEntity.ok(assignmentService.getActivities(id));
    }

    @PostMapping("/activities/{activityId}/evidence/file")
    @PreAuthorize("hasAuthority('ASSIGNMENT_READ')")
    public ResponseEntity<AssignmentActivityDTO> uploadActivityEvidenceFile(
            @PathVariable Long activityId,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserDetailsImpl userDetails) throws IOException {
        AssignmentActivityDTO dto = assignmentService.uploadActivityEvidenceFile(activityId, file, userDetails.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(dto);
    }

    @PostMapping("/activities/{activityId}/complete")
    @PreAuthorize("hasAuthority('ASSIGNMENT_READ')")
    public ResponseEntity<AssignmentActivityDTO> completeActivity(
            @PathVariable Long activityId,
            @RequestBody(required = false) Map<String, String> body,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        String report = body == null ? null : body.get("report");
        AssignmentActivityDTO dto = assignmentService.completeActivity(activityId, userDetails.getId(), report);
        return ResponseEntity.ok(dto);
    }

    @PostMapping("/{id}/final-report")
    @PreAuthorize("hasAuthority('ASSIGNMENT_READ')")
    public ResponseEntity<AssignmentDTO> submitFinalReport(
            @PathVariable Long id,
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestParam(value = "reportText", required = false) String reportText,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        AssignmentDTO dto = assignmentService.submitFinalReport(id, userDetails.getId(), reportText, file);
        return ResponseEntity.ok(dto);
    }

    @PostMapping("/{id}/review/approve")
    @PreAuthorize("hasAuthority('ASSIGNMENT_UPDATE')")
    public ResponseEntity<AssignmentDTO> approveAssignment(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        AssignmentDTO dto = assignmentService.approveAssignment(id, userDetails.getId());
        return ResponseEntity.ok(dto);
    }

    @PostMapping("/{id}/review/reject")
    @PreAuthorize("hasAuthority('ASSIGNMENT_UPDATE')")
    public ResponseEntity<AssignmentDTO> rejectAssignment(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        String comments = (String) body.getOrDefault("comments", "");
        boolean returnForRework = body.get("returnForRework") != null && (Boolean) body.get("returnForRework");
        AssignmentDTO dto = assignmentService.rejectAssignment(id, userDetails.getId(), comments, returnForRework);
        return ResponseEntity.ok(dto);
    }

    @PostMapping("/{id}/reopen")
    @PreAuthorize("hasAuthority('ASSIGNMENT_UPDATE')")
    public ResponseEntity<AssignmentDTO> reopenAssignment(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        AssignmentDTO dto = assignmentService.reopenAssignment(id, userDetails.getId());
        return ResponseEntity.ok(dto);
    }
}
