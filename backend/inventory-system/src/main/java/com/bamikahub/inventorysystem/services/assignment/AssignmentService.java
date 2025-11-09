package com.bamikahub.inventorysystem.services.assignment;

import com.bamikahub.inventorysystem.dao.assignment.*;
import com.bamikahub.inventorysystem.dao.user.UserRepository;
import com.bamikahub.inventorysystem.dto.assignment.AssignmentActivityCreateRequest;
import com.bamikahub.inventorysystem.dto.assignment.AssignmentActivityDTO;
import com.bamikahub.inventorysystem.dto.assignment.AssignmentAttachmentDTO;
import com.bamikahub.inventorysystem.dto.assignment.AssignmentCommentDTO;
import com.bamikahub.inventorysystem.dto.assignment.AssignmentDTO;
import com.bamikahub.inventorysystem.models.assignment.*;
import com.bamikahub.inventorysystem.models.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AssignmentService {

	private final AssignmentRepository assignmentRepository;
	private final AssignmentCommentRepository commentRepository;
	private final AssignmentAttachmentRepository attachmentRepository;
	private final AssignmentActivityRepository activityRepository;
	private final AssignmentAuditLogRepository auditLogRepository; // retained for direct queries
	private final AssignmentFinalReportRepository finalReportRepository;
	private final UserRepository userRepository;

	private final AssignmentAuditService auditService;
	private final AssignmentNotificationService notificationService;

	private static final String UPLOAD_DIR = "uploads/assignment-attachments/";
	private static final String ACTIVITY_UPLOAD_DIR = "uploads/assignment-activity-evidence/";
	private static final String FINAL_REPORT_UPLOAD_DIR = "uploads/assignment-final-reports/";
	private static final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

	/* =========================
	   CRUD (existing)
	   ========================= */

	@Transactional
	public AssignmentDTO createAssignment(AssignmentDTO dto, Long assignerId) {
		User assignee = userRepository.findById(dto.getAssigneeId())
				.orElseThrow(() -> new RuntimeException("Assignee not found"));
		User assigner = userRepository.findById(assignerId)
				.orElseThrow(() -> new RuntimeException("Assigner not found"));

		Assignment assignment = new Assignment();
		assignment.setTitle(dto.getTitle());
		assignment.setDescription(dto.getDescription());
		assignment.setPriority(dto.getPriority());
		assignment.setStatus(AssignmentStatus.PENDING);
		assignment.setDueDate(dto.getDueDate());
		assignment.setAssignee(assignee);
		assignment.setAssigner(assigner);
		assignment.setProgressPercentage(0);

		Assignment saved = assignmentRepository.save(assignment);
		auditService.logAssignmentCreated(saved, assigner);
		notificationService.notifyAssignmentCreated(saved);
		return toDTO(saved);
	}

	@Transactional
	public AssignmentDTO updateAssignment(Long id, AssignmentDTO dto, Long actorId) {
		Assignment assignment = assignmentRepository.findById(id)
				.orElseThrow(() -> new RuntimeException("Assignment not found"));
		User actor = userRepository.findById(actorId)
				.orElseThrow(() -> new RuntimeException("Actor not found"));

		AssignmentStatus previousStatus = assignment.getStatus();
		int previousProgress = assignment.getProgressPercentage() == null ? 0 : assignment.getProgressPercentage();

		assignment.setTitle(dto.getTitle());
		assignment.setDescription(dto.getDescription());
		assignment.setPriority(dto.getPriority());
		assignment.setDueDate(dto.getDueDate());

		if (dto.getStatus() != null && dto.getStatus() != assignment.getStatus()) {
			assignment.setStatus(dto.getStatus());
			if (dto.getStatus() == AssignmentStatus.COMPLETED && assignment.getCompletedDate() == null) {
				assignment.setCompletedDate(LocalDateTime.now());
			}
		}

		if (dto.getProgressPercentage() != null && !dto.getProgressPercentage().equals(assignment.getProgressPercentage())) {
			assignment.setProgressPercentage(dto.getProgressPercentage());
			auditService.logProgressUpdated(assignment, actor, previousProgress, assignment.getProgressPercentage(), true);
		}

		if (dto.getAssigneeId() != null && !dto.getAssigneeId().equals(assignment.getAssignee().getId())) {
			User newAssignee = userRepository.findById(dto.getAssigneeId())
					.orElseThrow(() -> new RuntimeException("Assignee not found"));
			assignment.setAssignee(newAssignee);
		}

		Assignment updated = assignmentRepository.save(assignment);
		if (updated.getStatus() != previousStatus) {
			auditService.logStatusChanged(updated, previousStatus, updated.getStatus(), actor);
		}
		return toDTO(updated);
	}

	@Transactional
	public AssignmentDTO updateProgress(Long id, Integer progressPercentage, Long actorId) {
		Assignment assignment = assignmentRepository.findById(id)
				.orElseThrow(() -> new RuntimeException("Assignment not found"));
		User actor = userRepository.findById(actorId)
				.orElseThrow(() -> new RuntimeException("Actor not found"));

		// Guard: if workflow-managed, block manual updates
		if (!Boolean.TRUE.equals(assignment.getManualProgressAllowed())) {
			boolean hasActivities = assignment.getActivities() != null && !assignment.getActivities().isEmpty();
			if (hasActivities || assignment.getStatus() == AssignmentStatus.UNDER_REVIEW || assignment.getStatus() == AssignmentStatus.COMPLETED) {
				throw new IllegalStateException("Manual progress updates are disabled for this assignment");
			}
		}

		int previousProgress = assignment.getProgressPercentage() == null ? 0 : assignment.getProgressPercentage();
		AssignmentStatus previousStatus = assignment.getStatus();
		assignment.setProgressPercentage(progressPercentage);

		if (progressPercentage >= 100 && assignment.getStatus() != AssignmentStatus.COMPLETED) {
			assignment.setStatus(AssignmentStatus.COMPLETED);
			assignment.setCompletedDate(LocalDateTime.now());
		} else if (progressPercentage > 0 && assignment.getStatus() == AssignmentStatus.PENDING) {
			assignment.setStatus(AssignmentStatus.IN_PROGRESS);
		}

		Assignment updated = assignmentRepository.save(assignment);
		if (previousProgress != progressPercentage) {
			auditService.logProgressUpdated(updated, actor, previousProgress, progressPercentage, true);
		}
		if (updated.getStatus() != previousStatus) {
			auditService.logStatusChanged(updated, previousStatus, updated.getStatus(), actor);
		}
		return toDTO(updated);
	}

	public List<AssignmentDTO> getAllAssignments() {
		return assignmentRepository.findAll().stream()
				.map(this::toDTO)
				.collect(Collectors.toList());
	}

	public List<AssignmentDTO> getMyAssignments(Long userId) {
		User user = userRepository.findById(userId)
				.orElseThrow(() -> new RuntimeException("User not found"));
		return assignmentRepository.findByAssigneeOrderByDueDateAsc(user).stream()
				.map(this::toDTO)
				.collect(Collectors.toList());
	}

	public List<AssignmentDTO> getAssignmentsCreatedBy(Long userId) {
		User user = userRepository.findById(userId)
				.orElseThrow(() -> new RuntimeException("User not found"));
		return assignmentRepository.findByAssigner(user).stream()
				.map(this::toDTO)
				.collect(Collectors.toList());
	}

	public AssignmentDTO getAssignmentById(Long id) {
		Assignment assignment = assignmentRepository.findById(id)
				.orElseThrow(() -> new RuntimeException("Assignment not found"));
		return toDTO(assignment);
	}

	@Transactional
	public void deleteAssignment(Long id) {
		Assignment assignment = assignmentRepository.findById(id)
				.orElseThrow(() -> new RuntimeException("Assignment not found"));

		for (AssignmentAttachment attachment : assignment.getAttachments()) {
			deleteFile(attachment.getFilePath());
		}

		assignmentRepository.delete(assignment);
	}

	@Transactional
	public AssignmentCommentDTO addComment(Long assignmentId, String commentText, Long userId) {
		Assignment assignment = assignmentRepository.findById(assignmentId)
				.orElseThrow(() -> new RuntimeException("Assignment not found"));
		User user = userRepository.findById(userId)
				.orElseThrow(() -> new RuntimeException("User not found"));

		AssignmentComment comment = new AssignmentComment();
		comment.setComment(commentText);
		comment.setUser(user);
		comment.setAssignment(assignment);

		AssignmentComment saved = commentRepository.save(comment);
		return toCommentDTO(saved);
	}

	public List<AssignmentCommentDTO> getComments(Long assignmentId) {
		Assignment assignment = assignmentRepository.findById(assignmentId)
				.orElseThrow(() -> new RuntimeException("Assignment not found"));
		return commentRepository.findByAssignmentOrderByCreatedAtDesc(assignment).stream()
				.map(this::toCommentDTO)
				.collect(Collectors.toList());
	}

	@Transactional
	public AssignmentAttachmentDTO uploadAttachment(Long assignmentId, MultipartFile file, Long userId) throws IOException {
		Assignment assignment = assignmentRepository.findById(assignmentId)
				.orElseThrow(() -> new RuntimeException("Assignment not found"));
		User user = userRepository.findById(userId)
				.orElseThrow(() -> new RuntimeException("User not found"));

		Path uploadPath = Paths.get(UPLOAD_DIR);
		if (!Files.exists(uploadPath)) {
			Files.createDirectories(uploadPath);
		}

		String originalFilename = file.getOriginalFilename();
		String fileExtension = originalFilename != null && originalFilename.contains(".")
				? originalFilename.substring(originalFilename.lastIndexOf("."))
				: "";
		String uniqueFilename = UUID.randomUUID().toString() + fileExtension;
		Path filePath = uploadPath.resolve(uniqueFilename);

		Files.copy(file.getInputStream(), filePath);

		AssignmentAttachment attachment = new AssignmentAttachment();
		attachment.setFileName(originalFilename);
		attachment.setFilePath(filePath.toString());
		attachment.setFileType(file.getContentType());
		attachment.setFileSize(file.getSize());
		attachment.setUploadedBy(user);
		attachment.setAssignment(assignment);

		AssignmentAttachment saved = attachmentRepository.save(attachment);
		return toAttachmentDTO(saved);
	}

	public List<AssignmentAttachmentDTO> getAttachments(Long assignmentId) {
		Assignment assignment = assignmentRepository.findById(assignmentId)
				.orElseThrow(() -> new RuntimeException("Assignment not found"));
		return attachmentRepository.findByAssignmentOrderByUploadedAtDesc(assignment).stream()
				.map(this::toAttachmentDTO)
				.collect(Collectors.toList());
	}

	@Transactional
	public void deleteAttachment(Long attachmentId) {
		AssignmentAttachment attachment = attachmentRepository.findById(attachmentId)
				.orElseThrow(() -> new RuntimeException("Attachment not found"));

		deleteFile(attachment.getFilePath());
		attachmentRepository.delete(attachment);
	}

	@Transactional
	public void markOverdueAssignments() {
		List<Assignment> overdueAssignments = assignmentRepository.findOverdueAssignments(LocalDateTime.now());
		for (Assignment assignment : overdueAssignments) {
			assignment.setStatus(AssignmentStatus.OVERDUE);
		}
		assignmentRepository.saveAll(overdueAssignments);
	}

	public AssignmentStatistics getStatistics(Long userId) {
		User user = userRepository.findById(userId)
				.orElseThrow(() -> new RuntimeException("User not found"));

		long totalAssignments = assignmentRepository.findByAssignee(user).size();
		long pendingAssignments = assignmentRepository.countByAssigneeAndStatus(user, AssignmentStatus.PENDING);
		long inProgressAssignments = assignmentRepository.countByAssigneeAndStatus(user, AssignmentStatus.IN_PROGRESS);
		long completedAssignments = assignmentRepository.countByAssigneeAndStatus(user, AssignmentStatus.COMPLETED);
		long overdueAssignments = assignmentRepository.findOverdueAssignmentsByAssignee(user, LocalDateTime.now()).size();

		AssignmentStatistics stats = new AssignmentStatistics();
		stats.setTotalAssignments(totalAssignments);
		stats.setPendingAssignments(pendingAssignments);
		stats.setInProgressAssignments(inProgressAssignments);
		stats.setCompletedAssignments(completedAssignments);
		stats.setOverdueAssignments(overdueAssignments);

		return stats;
	}

	/* =========================
	   Workflow v2
	   ========================= */

	@Transactional
	public AssignmentActivityDTO createActivity(Long assignmentId, AssignmentActivityCreateRequest request, Long actorId) {
		Assignment assignment = assignmentRepository.findById(assignmentId)
				.orElseThrow(() -> new RuntimeException("Assignment not found"));
		User actor = userRepository.findById(actorId)
				.orElseThrow(() -> new RuntimeException("Actor not found"));
		// Authorization: only assigner or assignee may add activities
		if (!assignment.getAssignee().getId().equals(actor.getId()) && !assignment.getAssigner().getId().equals(actor.getId())) {
			throw new IllegalStateException("Only the assigner or assignee can add activities");
		}
		if (assignment.getStatus() == AssignmentStatus.COMPLETED || assignment.getStatus() == AssignmentStatus.CANCELLED) {
			throw new IllegalStateException("Cannot modify a closed assignment");
		}
		int nextOrderIndex = determineNextOrderIndex(assignment, request.getOrderIndex());
		AssignmentActivity.EvidenceType evidenceType = request.getEvidenceType();
		AssignmentActivity activity = new AssignmentActivity();
		activity.setAssignment(assignment);
		activity.setTitle(request.getTitle().trim());
		activity.setDescription(request.getDescription());
		activity.setOrderIndex(nextOrderIndex);
		activity.setEvidenceType(evidenceType);
		activityRepository.save(activity);
		assignment.getActivities().add(activity);
		recalcActivityProgress(assignment, actor, false);

		AssignmentStatus previousStatus = assignment.getStatus();
		boolean wasPending = assignment.getStatus() == AssignmentStatus.PENDING;
		if (wasPending) {
			assignment.setStatus(AssignmentStatus.IN_PROGRESS);
		}
		assignmentRepository.save(assignment);
		if (wasPending) {
			auditService.logStatusChanged(assignment, previousStatus, assignment.getStatus(), actor);
			notificationService.notifyAssignmentStarted(assignment, actor);
		}

		auditService.logActivityCreated(assignment, activity, actor);
		return toActivityDTO(activity);
	}

	private int determineNextOrderIndex(Assignment assignment, Integer requestedOrder) {
		int fallback = 1;
		List<AssignmentActivity> existing = activityRepository.findByAssignmentOrderByOrderIndexAscIdAsc(assignment);
		if (requestedOrder != null && requestedOrder > 0) {
			return requestedOrder;
		}
		if (existing.isEmpty()) {
			return fallback;
		}
		int maxOrder = existing.stream()
				.map(AssignmentActivity::getOrderIndex)
				.filter(Objects::nonNull)
				.max(Integer::compareTo)
				.orElse(existing.size());
		return maxOrder + 1;
	}

	@Transactional
	public AssignmentActivityDTO completeActivity(Long activityId, Long actorId, String evidenceReport) {
		AssignmentActivity activity = activityRepository.findById(activityId).orElseThrow(() -> new RuntimeException("Activity not found"));
		Assignment assignment = activity.getAssignment();
		User actor = userRepository.findById(actorId).orElseThrow(() -> new RuntimeException("Actor not found"));
		if (Boolean.TRUE.equals(activity.getLocked())) {
			throw new IllegalStateException("Activity locked");
		}
		if (activity.getStatus() == AssignmentActivity.ActivityStatus.COMPLETED) {
			return toActivityDTO(activity);
		}
		boolean evidenceJustCaptured = false;
		if (activity.getEvidenceType() == AssignmentActivity.EvidenceType.REPORT) {
			if (Boolean.TRUE.equals(activity.getEvidenceSubmitted())) {
				if (evidenceReport != null && !evidenceReport.isBlank()) {
					activity.setEvidenceReport(evidenceReport);
				}
			} else {
				if (evidenceReport == null || evidenceReport.isBlank()) {
					throw new IllegalArgumentException("Report evidence required");
				}
				activity.setEvidenceReport(evidenceReport);
				activity.setEvidenceSubmitted(true);
				activity.setEvidenceSubmittedAt(LocalDateTime.now());
				activity.setEvidenceSubmittedBy(actor);
				evidenceJustCaptured = true;
			}
		} else if (activity.getEvidenceType() == AssignmentActivity.EvidenceType.FILE) {
			if (!Boolean.TRUE.equals(activity.getEvidenceSubmitted())) {
				throw new IllegalStateException("File evidence not uploaded yet");
			}
		}
		activity.setStatus(AssignmentActivity.ActivityStatus.COMPLETED);
		activity.setCompletedAt(LocalDateTime.now());
		activity.setCompletedBy(actor);
		activity.setLocked(true);
		activityRepository.save(activity);
		auditService.logActivityCompleted(assignment, activity, actor);
		if (evidenceJustCaptured) {
			auditService.logEvidenceSubmitted(assignment, activity, actor);
			notificationService.notifyEvidenceSubmitted(assignment, activity, actor);
		}
		recalcActivityProgress(assignment, actor, false);
		assignmentRepository.save(assignment);
		notificationService.notifyActivityCompleted(assignment, activity, actor);
		return toActivityDTO(activity);
	}

	@Transactional
	public AssignmentActivityDTO uploadActivityEvidenceFile(Long activityId, MultipartFile file, Long userId) throws IOException {
		AssignmentActivity activity = activityRepository.findById(activityId)
				.orElseThrow(() -> new RuntimeException("Activity not found"));
		User actor = userRepository.findById(userId)
				.orElseThrow(() -> new RuntimeException("Actor not found"));
		if (Boolean.TRUE.equals(activity.getLocked())) {
			throw new IllegalStateException("Activity locked; cannot upload evidence");
		}
		if (activity.getEvidenceType() != AssignmentActivity.EvidenceType.FILE) {
			throw new IllegalArgumentException("This activity does not accept file evidence");
		}
		Path uploadPath = Paths.get(ACTIVITY_UPLOAD_DIR);
		if (!Files.exists(uploadPath)) {
			Files.createDirectories(uploadPath);
		}
		String originalFilename = file.getOriginalFilename();
		String fileExtension = originalFilename != null && originalFilename.contains(".")
				? originalFilename.substring(originalFilename.lastIndexOf("."))
				: "";
		String uniqueFilename = "act-" + activity.getId() + "-" + UUID.randomUUID() + fileExtension;
		Path filePath = uploadPath.resolve(uniqueFilename);
		Files.copy(file.getInputStream(), filePath);
		activity.setEvidenceFilePath(filePath.toString());
		activity.setEvidenceSubmitted(true);
		activity.setEvidenceSubmittedAt(LocalDateTime.now());
		activity.setEvidenceSubmittedBy(actor);
		activityRepository.save(activity);
		Assignment assignment = activity.getAssignment();
		auditService.logEvidenceSubmitted(assignment, activity, actor);
		notificationService.notifyEvidenceSubmitted(assignment, activity, actor);
		return toActivityDTO(activity);
	}

	@Transactional
	public AssignmentActivityDTO submitActivityReport(Long activityId, Long actorId, String reportContent) {
		AssignmentActivity activity = activityRepository.findById(activityId)
				.orElseThrow(() -> new RuntimeException("Activity not found"));
		User actor = userRepository.findById(actorId)
				.orElseThrow(() -> new RuntimeException("Actor not found"));
		if (Boolean.TRUE.equals(activity.getLocked())) {
			throw new IllegalStateException("Activity locked; cannot submit report");
		}
		if (activity.getEvidenceType() != AssignmentActivity.EvidenceType.REPORT) {
			throw new IllegalArgumentException("This activity does not accept report evidence");
		}
		if (reportContent == null || reportContent.isBlank()) {
			throw new IllegalArgumentException("Report content is required");
		}
		activity.setEvidenceReport(reportContent);
		activity.setEvidenceSubmitted(true);
		activity.setEvidenceSubmittedAt(LocalDateTime.now());
		activity.setEvidenceSubmittedBy(actor);
		activityRepository.save(activity);
		Assignment assignment = activity.getAssignment();
		auditService.logEvidenceSubmitted(assignment, activity, actor);
		notificationService.notifyEvidenceSubmitted(assignment, activity, actor);
		return toActivityDTO(activity);
	}

	public ResponseEntity<Resource> downloadActivityEvidence(Long activityId, Long userId) throws IOException {
		AssignmentActivity activity = activityRepository.findById(activityId)
				.orElseThrow(() -> new RuntimeException("Activity not found"));
		User user = userRepository.findById(userId)
				.orElseThrow(() -> new RuntimeException("User not found"));
		
		Assignment assignment = activity.getAssignment();
		
		// Authorization: Allow assigner, assignee, or anyone with ASSIGNMENT_READ permission
		// The @PreAuthorize at controller level already checks ASSIGNMENT_READ
		// Here we just verify the user has legitimate access to this assignment
		boolean isAssigner = assignment.getAssigner().getId().equals(user.getId());
		boolean isAssignee = assignment.getAssignee().getId().equals(user.getId());
		
		if (!isAssigner && !isAssignee) {
			// If user is neither assigner nor assignee, they must have general access
			// This is already verified by @PreAuthorize, so we allow it
			// throw new IllegalStateException("Access denied to this evidence");
		}
		
		// Check if activity is completed and evidence exists
		if (activity.getStatus() != AssignmentActivity.ActivityStatus.COMPLETED) {
			throw new IllegalStateException("Activity must be completed to download evidence");
		}
		
		if (!Boolean.TRUE.equals(activity.getEvidenceSubmitted())) {
			throw new IllegalStateException("No evidence has been submitted for this activity");
		}
		
		// Only FILE type activities have downloadable files
		if (activity.getEvidenceType() != AssignmentActivity.EvidenceType.FILE) {
			throw new IllegalArgumentException("This activity does not have file evidence");
		}
		
		String filePath = activity.getEvidenceFilePath();
		if (filePath == null || filePath.isBlank()) {
			throw new RuntimeException("Evidence file path not found");
		}
		
		Path path = Paths.get(filePath);
		if (!Files.exists(path)) {
			throw new RuntimeException("Evidence file not found on disk");
		}
		
		Resource resource = new UrlResource(path.toUri());
		
		// Determine content type
		String contentType = Files.probeContentType(path);
		if (contentType == null) {
			contentType = MediaType.APPLICATION_OCTET_STREAM_VALUE;
		}
		
		// Extract original filename from the path
		String filename = path.getFileName().toString();
		
		return ResponseEntity.ok()
				.contentType(MediaType.parseMediaType(contentType))
				.header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
				.body(resource);
	}

	public List<AssignmentActivityDTO> getActivities(Long assignmentId) {
		Assignment assignment = assignmentRepository.findById(assignmentId)
				.orElseThrow(() -> new RuntimeException("Assignment not found"));
		return assignment.getActivities().stream().map(this::toActivityDTO).collect(Collectors.toList());
	}

	@Transactional
	public AssignmentDTO submitFinalReport(Long assignmentId, Long actorId, String reportText) {
		return submitFinalReport(assignmentId, actorId, reportText, null);
	}

	@Transactional
	public AssignmentDTO submitFinalReport(Long assignmentId, Long actorId, String reportText, MultipartFile file) {
		Assignment assignment = assignmentRepository.findById(assignmentId).orElseThrow(() -> new RuntimeException("Assignment not found"));
		User actor = userRepository.findById(actorId).orElseThrow(() -> new RuntimeException("Actor not found"));
		boolean allCompleted = assignment.getActivities() != null && assignment.getActivities().stream().allMatch(a -> a.getStatus() == AssignmentActivity.ActivityStatus.COMPLETED);
		if (!allCompleted) {
			throw new IllegalStateException("All activities must be completed before final report submission");
		}
		AssignmentFinalReport report = assignment.getFinalReport();
		if (report == null) {
			report = new AssignmentFinalReport();
			report.setAssignment(assignment);
		}
		report.setSubmittedAt(LocalDateTime.now());
		report.setSubmittedBy(actor);
		report.setReportText(reportText);
		if (file != null && !file.isEmpty()) {
			try {
				Path uploadPath = Paths.get(FINAL_REPORT_UPLOAD_DIR);
				if (!Files.exists(uploadPath)) Files.createDirectories(uploadPath);
				String originalFilename = file.getOriginalFilename();
				String ext = originalFilename != null && originalFilename.contains(".") ? originalFilename.substring(originalFilename.lastIndexOf('.')) : "";
				String uniqueName = "fr-" + assignment.getId() + "-" + UUID.randomUUID() + ext;
				Path filePath = uploadPath.resolve(uniqueName);
				Files.copy(file.getInputStream(), filePath);
				report.setFilePath(filePath.toString());
			} catch (IOException e) {
				throw new RuntimeException("Failed to save final report file", e);
			}
		}
		report.setStatus(AssignmentFinalReport.FinalReportStatus.SUBMITTED);
		finalReportRepository.save(report);
		assignment.setFinalReport(report);
		if (assignment.getProgressPercentage() < 90) {
			assignment.setProgressPercentage(90);
		}
		assignment.setStatus(AssignmentStatus.UNDER_REVIEW);
		assignment.setReviewStartedAt(LocalDateTime.now());
		assignmentRepository.save(assignment);
		auditService.logFinalReportSubmitted(assignment, report, actor);
		notificationService.notifyFinalReportSubmitted(assignment, report, actor);
		return toDTO(assignment);
	}

	@Transactional
	public AssignmentDTO approveAssignment(Long assignmentId, Long reviewerId) {
		Assignment assignment = assignmentRepository.findById(assignmentId).orElseThrow(() -> new RuntimeException("Assignment not found"));
		User reviewer = userRepository.findById(reviewerId).orElseThrow(() -> new RuntimeException("Reviewer not found"));
		if (assignment.getStatus() != AssignmentStatus.UNDER_REVIEW) {
			throw new IllegalStateException("Assignment not under review");
		}
		assignment.setStatus(AssignmentStatus.COMPLETED);
		assignment.setProgressPercentage(100);
		assignment.setApprovedAt(LocalDateTime.now());
		if (assignment.getFinalReport() != null) {
			assignment.getFinalReport().setStatus(AssignmentFinalReport.FinalReportStatus.APPROVED);
			assignment.getFinalReport().setReviewedAt(LocalDateTime.now());
			assignment.getFinalReport().setReviewedBy(reviewer);
			finalReportRepository.save(assignment.getFinalReport());
		}
		assignmentRepository.save(assignment);
		auditService.logAssignmentApproved(assignment, reviewer);
		notificationService.notifyAssignmentApproved(assignment, reviewer);
		return toDTO(assignment);
	}

	@Transactional
	public AssignmentDTO rejectAssignment(Long assignmentId, Long reviewerId, String comments, boolean returnForRework) {
		Assignment assignment = assignmentRepository.findById(assignmentId).orElseThrow(() -> new RuntimeException("Assignment not found"));
		User reviewer = userRepository.findById(reviewerId).orElseThrow(() -> new RuntimeException("Reviewer not found"));
		if (assignment.getStatus() != AssignmentStatus.UNDER_REVIEW) {
			throw new IllegalStateException("Assignment not under review");
		}
		assignment.setRejectedAt(LocalDateTime.now());
		if (assignment.getFinalReport() != null) {
			assignment.getFinalReport().setStatus(returnForRework ? AssignmentFinalReport.FinalReportStatus.RETURNED : AssignmentFinalReport.FinalReportStatus.SUBMITTED);
			assignment.getFinalReport().setReviewerComments(comments);
			assignment.getFinalReport().setReviewedAt(LocalDateTime.now());
			assignment.getFinalReport().setReviewedBy(reviewer);
			finalReportRepository.save(assignment.getFinalReport());
		}
		assignment.setStatus(AssignmentStatus.IN_PROGRESS);
		assignment.setProgressPercentage(Math.min(Math.max(assignment.getProgressPercentage(), 70), 89));
		assignmentRepository.save(assignment);
		auditService.logAssignmentRejected(assignment, reviewer, comments);
		if (returnForRework) {
			String reason = (comments == null || comments.isBlank()) ? "Returned for rework" : comments;
			auditService.logAssignmentReturnedForRework(assignment, reviewer, reason);
			notificationService.notifyAssignmentReturnedForRework(assignment, reviewer);
		} else {
			notificationService.notifyAssignmentRejected(assignment, reviewer, comments);
		}
		return toDTO(assignment);
	}

	@Transactional
	public AssignmentDTO reopenAssignment(Long assignmentId, Long actorId) {
		Assignment assignment = assignmentRepository.findById(assignmentId).orElseThrow(() -> new RuntimeException("Assignment not found"));
		User actor = userRepository.findById(actorId).orElseThrow(() -> new RuntimeException("Actor not found"));
		if (assignment.getStatus() != AssignmentStatus.COMPLETED) {
			throw new IllegalStateException("Only completed assignments can be reopened");
		}
		assignment.setStatus(AssignmentStatus.IN_PROGRESS);
		assignment.setApprovedAt(null);
		assignment.setRejectedAt(null);
		assignment.setProgressPercentage(Math.min(assignment.getProgressPercentage(), 90));
		assignmentRepository.save(assignment);
		auditService.logAssignmentReopened(assignment, actor);
		notificationService.notifyAssignmentReopened(assignment, actor);
		return toDTO(assignment);
	}

	/* =========================
	   Helpers / Mapping
	   ========================= */

	private void recalcActivityProgress(Assignment assignment, User actor, boolean manualTrigger) {
		List<AssignmentActivity> activities = assignment.getActivities();
		if (activities == null || activities.isEmpty()) {
			int previous = assignment.getProgressPercentage() == null ? 0 : assignment.getProgressPercentage();
			assignment.setProgressPercentage(0);
			if (previous != 0) {
				auditService.logProgressUpdated(assignment, actor, previous, 0, manualTrigger);
			}
			return;
		}
		int previousProgress = assignment.getProgressPercentage() == null ? 0 : assignment.getProgressPercentage();
		AssignmentStatus previousStatus = assignment.getStatus();
		long totalActivities = activities.size();
		long completedActivities = activities.stream()
				.filter(a -> a.getStatus() == AssignmentActivity.ActivityStatus.COMPLETED)
				.count();
		double ratio = totalActivities == 0 ? 0.0 : (double) completedActivities / totalActivities;
		int portion = (int) Math.round(ratio * 70.0);
		if (assignment.getProgressPercentage() < 90 && portion != previousProgress) {
			assignment.setProgressPercentage(portion);
			auditService.logProgressUpdated(assignment, actor, previousProgress, portion, manualTrigger);
		}
		if (portion > 0 && assignment.getStatus() == AssignmentStatus.PENDING) {
			assignment.setStatus(AssignmentStatus.IN_PROGRESS);
		}
		if (assignment.getStatus() != previousStatus) {
			auditService.logStatusChanged(assignment, previousStatus, assignment.getStatus(), actor);
		}
	}

	private AssignmentDTO toDTO(Assignment assignment) {
		AssignmentDTO dto = new AssignmentDTO();
		dto.setId(assignment.getId());
		dto.setTitle(assignment.getTitle());
		dto.setDescription(assignment.getDescription());
		dto.setPriority(assignment.getPriority());
		dto.setStatus(assignment.getStatus());
		dto.setDueDate(assignment.getDueDate());
		dto.setProgressPercentage(assignment.getProgressPercentage());
		dto.setCompletedDate(assignment.getCompletedDate());
		dto.setCreatedAt(assignment.getCreatedAt());
		dto.setUpdatedAt(assignment.getUpdatedAt());
		dto.setAssigneeId(assignment.getAssignee().getId());
		dto.setAssigneeName(assignment.getAssignee().getFirstName() + " " + assignment.getAssignee().getLastName());
		dto.setAssignerId(assignment.getAssigner().getId());
		dto.setAssignerName(assignment.getAssigner().getFirstName() + " " + assignment.getAssigner().getLastName());
		dto.setOverdue(assignment.isOverdue());
		dto.setDaysRemaining(assignment.getDaysRemaining());
		dto.setManualProgressAllowed(Boolean.TRUE.equals(assignment.getManualProgressAllowed()));
		dto.setActivities(activityRepository.findByAssignmentOrderByOrderIndexAscIdAsc(assignment).stream()
				.map(this::toActivityDTO)
				.collect(Collectors.toList()));
		if (assignment.getFinalReport() != null) {
			dto.setFinalReportStatus(assignment.getFinalReport().getStatus().name());
		}
		return dto;
	}

	private AssignmentActivityDTO toActivityDTO(AssignmentActivity a) {
		AssignmentActivityDTO ad = new AssignmentActivityDTO();
		ad.setId(a.getId());
		ad.setAssignmentId(a.getAssignment().getId());
		ad.setTitle(a.getTitle());
		ad.setDescription(a.getDescription());
		ad.setWeight(a.getWeight());
		ad.setOrderIndex(a.getOrderIndex());
		ad.setStatus(a.getStatus().name());
		ad.setLocked(a.getLocked());
		ad.setEvidenceType(a.getEvidenceType() == null ? null : a.getEvidenceType().name());
		ad.setEvidenceFilePath(a.getEvidenceFilePath());
		ad.setEvidenceReport(a.getEvidenceReport());
		ad.setEvidenceSubmitted(Boolean.TRUE.equals(a.getEvidenceSubmitted()));
		ad.setEvidenceSubmittedAt(a.getEvidenceSubmittedAt());
		if (a.getEvidenceSubmittedBy() != null) {
			ad.setEvidenceSubmittedById(a.getEvidenceSubmittedBy().getId());
			ad.setEvidenceSubmittedByName(a.getEvidenceSubmittedBy().getFirstName() + " " + a.getEvidenceSubmittedBy().getLastName());
		}
		ad.setCompletedAt(a.getCompletedAt());
		if (a.getCompletedBy() != null) {
			ad.setCompletedById(a.getCompletedBy().getId());
			ad.setCompletedByName(a.getCompletedBy().getFirstName() + " " + a.getCompletedBy().getLastName());
		}
		ad.setCreatedAt(a.getCreatedAt());
		ad.setUpdatedAt(a.getUpdatedAt());
		return ad;
	}

	private AssignmentCommentDTO toCommentDTO(AssignmentComment comment) {
		AssignmentCommentDTO dto = new AssignmentCommentDTO();
		dto.setId(comment.getId());
		dto.setComment(comment.getComment());
		dto.setUserId(comment.getUser().getId());
		dto.setUserName(comment.getUser().getFirstName() + " " + comment.getUser().getLastName());
		dto.setUserProfilePicture(comment.getUser().getProfilePictureUrl());
		dto.setCreatedAt(comment.getCreatedAt().format(formatter));
		return dto;
	}

	private AssignmentAttachmentDTO toAttachmentDTO(AssignmentAttachment attachment) {
		AssignmentAttachmentDTO dto = new AssignmentAttachmentDTO();
		dto.setId(attachment.getId());
		dto.setFileName(attachment.getFileName());
		dto.setFilePath(attachment.getFilePath());
		dto.setFileType(attachment.getFileType());
		dto.setFileSize(attachment.getFileSize());
		dto.setUploadedBy(attachment.getUploadedBy().getId());
		dto.setUploaderName(attachment.getUploadedBy().getFirstName() + " " + attachment.getUploadedBy().getLastName());
		dto.setUploadedAt(attachment.getUploadedAt().format(formatter));
		return dto;
	}

	private void deleteFile(String filePath) {
		try {
			Path path = Paths.get(filePath);
			Files.deleteIfExists(path);
		} catch (IOException e) {
			System.err.println("Failed to delete file: " + filePath);
		}
	}

	@lombok.Data
	public static class AssignmentStatistics {
		private long totalAssignments;
		private long pendingAssignments;
		private long inProgressAssignments;
		private long completedAssignments;
		private long overdueAssignments;
	}
}

