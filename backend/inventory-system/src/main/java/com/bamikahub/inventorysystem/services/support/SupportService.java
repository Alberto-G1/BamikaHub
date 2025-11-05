package com.bamikahub.inventorysystem.services.support;

import com.bamikahub.inventorysystem.dao.inventory.InventoryItemRepository;
import com.bamikahub.inventorysystem.dao.operations.ProjectRepository;
import com.bamikahub.inventorysystem.dao.support.SupportTicketRepository;
import com.bamikahub.inventorysystem.dao.support.SupportTicketSpecifications;
import com.bamikahub.inventorysystem.dao.support.TicketCategoryRepository;
import com.bamikahub.inventorysystem.dao.user.UserRepository;
import com.bamikahub.inventorysystem.dto.support.CommentRequest;
import com.bamikahub.inventorysystem.dto.support.TicketActivityResponse;
import com.bamikahub.inventorysystem.dto.support.TicketAnalyticsResponse;
import com.bamikahub.inventorysystem.dto.support.TicketAttachmentResponse;
import com.bamikahub.inventorysystem.dto.support.TicketCommentResponse;
import com.bamikahub.inventorysystem.dto.support.TicketDetailsResponse;
import com.bamikahub.inventorysystem.dto.support.TicketFilterCriteria;
import com.bamikahub.inventorysystem.dto.support.TicketListResponse;
import com.bamikahub.inventorysystem.dto.support.TicketRequest;
import com.bamikahub.inventorysystem.dto.support.TicketUpdateRequest;
import com.bamikahub.inventorysystem.models.inventory.InventoryItem;
import com.bamikahub.inventorysystem.models.operations.Project;
import com.bamikahub.inventorysystem.models.support.SupportTicket;
import com.bamikahub.inventorysystem.models.support.TicketActivity;
import com.bamikahub.inventorysystem.models.support.TicketAttachment;
import com.bamikahub.inventorysystem.models.support.TicketCategory;
import com.bamikahub.inventorysystem.models.support.TicketComment;
import com.bamikahub.inventorysystem.models.user.User;
import com.bamikahub.inventorysystem.services.FileStorageService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class SupportService {

    @Autowired private SupportTicketRepository ticketRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private TicketCategoryRepository categoryRepository;
    @Autowired private InventoryItemRepository inventoryItemRepository;
    @Autowired private ProjectRepository projectRepository;
    @Autowired private FileStorageService fileStorageService;
    @Autowired private SlaService slaService;
    @Autowired private TicketNotificationService notificationService;
    @Autowired private TicketExportService ticketExportService;

    public enum ExportFormat {
        EXCEL,
        PDF
    }

    @Transactional
    public SupportTicket createTicket(TicketRequest request) {
        User currentUser = getCurrentUser();
    SupportTicket ticket = new SupportTicket();
        ticket.setSubject(com.bamikahub.inventorysystem.util.ValidationUtil.sanitize(request.getSubject()));
        ticket.setDescription(com.bamikahub.inventorysystem.util.ValidationUtil.sanitize(request.getDescription()));
        ticket.setPriority(request.getPriority());
        ticket.setSubmittedBy(currentUser);
        ticket.setStatus(SupportTicket.TicketStatus.OPEN);
    ticket.setSubmitterDepartment(com.bamikahub.inventorysystem.util.ValidationUtil.sanitize(request.getSubmitterDepartment()));

        // Set Category
        TicketCategory category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Category not found."));
        ticket.setCategory(category);

        if ("OTHER".equalsIgnoreCase(category.getName())) {
            if (request.getOtherCategory() == null || request.getOtherCategory().isBlank()) {
                throw new IllegalArgumentException("Please specify the ticket category in the 'other' field.");
            }
            ticket.setOtherCategory(request.getOtherCategory());
        }

        if (request.getInventoryItemId() != null) {
            InventoryItem item = inventoryItemRepository.findById(request.getInventoryItemId())
                    .orElseThrow(() -> new RuntimeException("Inventory item not found."));
            ticket.setRelatedInventoryItem(item);
        }
        if (request.getProjectId() != null) {
            Project project = projectRepository.findById(request.getProjectId())
                    .orElseThrow(() -> new RuntimeException("Project not found."));
            ticket.setRelatedProject(project);
        }

        slaService.applyInitialSla(ticket);
        SupportTicket saved = ticketRepository.save(ticket);
        notificationService.notifyTicketCreated(saved);
        return saved;
    }

    @Transactional
    public SupportTicket assignTicketToSelf(Long ticketId) {
        User currentUser = getCurrentUser();
        SupportTicket ticket = findTicketById(ticketId);
        SupportTicket.TicketStatus previousStatus = ticket.getStatus();
        ticket.setAssignedTo(currentUser);
        ticket.setStatus(SupportTicket.TicketStatus.IN_PROGRESS);
        notificationService.notifyAssignment(ticket, currentUser, currentUser);
        notificationService.notifyStatusChange(ticket, previousStatus, currentUser);
        return ticketRepository.save(ticket);
    }

    @Transactional
    public TicketComment addComment(Long ticketId, String commentJson, MultipartFile file) {
        // Step 1: Deserialize the JSON part to get the comment text
        CommentRequest request;
        try {
            ObjectMapper objectMapper = new ObjectMapper();
            request = objectMapper.readValue(commentJson, CommentRequest.class);
        } catch (Exception e) {
            throw new RuntimeException("Could not parse comment data.", e);
        }

        // Step 2: Get the current user and the target ticket
        User currentUser = getCurrentUser();
        SupportTicket ticket = findTicketById(ticketId);

        // Security check: Don't allow comments on a closed ticket
        if (ticket.getStatus() == SupportTicket.TicketStatus.CLOSED) {
            throw new IllegalStateException("Cannot add comments to a closed ticket.");
        }

        // Step 3: Create and populate the new comment entity
        TicketComment comment = new TicketComment();
        comment.setTicket(ticket);
        comment.setCommenter(currentUser);
        comment.setComment(request.getComment());

        // Step 4: Handle the optional file upload
        if (file != null && !file.isEmpty()) {
            // Add validation for file size and type here if desired

            String filename = fileStorageService.storeSupportAttachment(file);
            comment.setFileUrl("/uploads/support-attachments/" + filename);
        }

        // Step 5: Add the new comment to the ticket's list and save
    ticket.getComments().add(comment);
    ticketRepository.save(ticket);

    notificationService.notifyComment(ticket, currentUser, truncate(request.getComment()));
    ticketRepository.save(ticket);

    return comment;
    }

    @Transactional
    public SupportTicket resolveTicket(Long ticketId, String resolutionNotes) {
        SupportTicket ticket = findTicketById(ticketId);

        if (ticket.getStatus() == SupportTicket.TicketStatus.CLOSED || ticket.getStatus() == SupportTicket.TicketStatus.RESOLVED) {
            throw new IllegalStateException("Ticket is already resolved or closed.");
        }

        SupportTicket.TicketStatus previousStatus = ticket.getStatus();
        ticket.setStatus(SupportTicket.TicketStatus.RESOLVED);
        ticket.setResolvedAt(LocalDateTime.now());

        // v-- THIS IS THE FIX --v
        // Create the JSON string for the comment and pass null for the file.
        try {
            CommentRequest resolutionComment = new CommentRequest();
            resolutionComment.setComment("Resolution: " + resolutionNotes);

            ObjectMapper objectMapper = new ObjectMapper();
            String commentJson = objectMapper.writeValueAsString(resolutionComment);

            addComment(ticketId, commentJson, null);
        } catch (Exception e) {
            // This should not happen in practice, but it's good practice to handle it
            throw new RuntimeException("Could not serialize resolution comment.", e);
        }
        // ^-- THIS IS THE FIX --^

    User actor = getCurrentUser();
    notificationService.notifyResolution(ticket, actor);
    notificationService.notifyStatusChange(ticket, previousStatus, actor);
    SupportTicket saved = ticketRepository.save(ticket);
    return saved;
    }

    @Transactional
    public SupportTicket closeTicket(Long ticketId) {
        User currentUser = getCurrentUser();
        SupportTicket ticket = findTicketById(ticketId);

        // Business Rule: Only the original submitter can close a resolved ticket
        if (!ticket.getSubmittedBy().getId().equals(currentUser.getId())) {
            throw new SecurityException("Only the user who submitted the ticket can close it.");
        }
        if (ticket.getStatus() != SupportTicket.TicketStatus.RESOLVED) {
            throw new IllegalStateException("Only a resolved ticket can be closed.");
        }

        SupportTicket.TicketStatus previousStatus = ticket.getStatus();
        ticket.setStatus(SupportTicket.TicketStatus.CLOSED);
    notificationService.notifyClosure(ticket, currentUser);
    notificationService.notifyStatusChange(ticket, previousStatus, currentUser);
    return ticketRepository.save(ticket);
    }

    @Transactional
    public TicketAttachment addAttachmentToTicket(Long ticketId, MultipartFile file) {
        SupportTicket ticket = findTicketById(ticketId);

        // --- FILE VALIDATION LOGIC START ---
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Attachment file cannot be empty.");
        }

        // Maximum file size (e.g., 5MB)
        final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("File size exceeds the maximum allowed limit of 5MB.");
        }

        // Allowed file extensions
        final List<String> allowedExtensions = List.of("png", "jpg", "jpeg", "pdf", "docx", "xlsx", "txt");
        String originalFilename = file.getOriginalFilename();

        if (originalFilename == null || !originalFilename.contains(".")) {
            throw new IllegalArgumentException("Invalid file name.");
        }

        String extension = originalFilename.substring(originalFilename.lastIndexOf(".") + 1).toLowerCase();
        if (!allowedExtensions.contains(extension)) {
            throw new IllegalArgumentException(
                    "Unsupported file type. Allowed formats: " + String.join(", ", allowedExtensions)
            );
        }

        // MIME type validation (extra layer of security)
        try {
            String contentType = file.getContentType();
            if (contentType == null || !isAllowedMimeType(contentType)) {
                throw new IllegalArgumentException("Invalid or unsafe file type uploaded.");
            }
        } catch (Exception e) {
            throw new IllegalArgumentException("Could not verify file type.");
        }
        // --- FILE VALIDATION LOGIC END ---

        // Store file (reuse existing file storage service)
        User currentUser = getCurrentUser();
        String filename = fileStorageService.storeSupportAttachment(file);

        // Build attachment entity
        TicketAttachment attachment = new TicketAttachment();
        attachment.setTicket(ticket);
        attachment.setOriginalFilename(originalFilename);
        attachment.setFileUrl("/uploads/support-attachments/" + filename);
        attachment.setUploadedAt(LocalDateTime.now());
        attachment.setUploadedBy(currentUser);

        // Add to ticket and persist
    ticket.getAttachments().add(attachment);
    notificationService.notifyAttachment(ticket, currentUser, originalFilename);
    ticketRepository.save(ticket);

    return attachment;
    }

    /**
     * Validate safe MIME types for uploaded files.
     */
    private boolean isAllowedMimeType(String mimeType) {
        List<String> allowedMimeTypes = List.of(
                "image/png",
                "image/jpeg",
                "application/pdf",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "text/plain"
        );
        return allowedMimeTypes.contains(mimeType);
    }


    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Authenticated user not found."));
    }

    private SupportTicket findTicketById(Long ticketId) {
        return ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Support ticket not found with id: " + ticketId));
    }

    public List<TicketListResponse> findTickets(TicketFilterCriteria criteria) {
    Specification<SupportTicket> specification = SupportTicketSpecifications.byFilter(criteria);
    List<SupportTicket> tickets = specification != null
        ? ticketRepository.findAll(specification, Sort.by(Sort.Direction.DESC, "updatedAt"))
        : ticketRepository.findAll(Sort.by(Sort.Direction.DESC, "updatedAt"));

    return tickets.stream().map(this::mapToListResponse).collect(Collectors.toList());
    }

    public byte[] exportTickets(TicketFilterCriteria criteria, ExportFormat format) {
        Specification<SupportTicket> specification = SupportTicketSpecifications.byFilter(criteria);
        List<SupportTicket> tickets = specification != null
                ? ticketRepository.findAll(specification, Sort.by(Sort.Direction.DESC, "updatedAt"))
                : ticketRepository.findAll(Sort.by(Sort.Direction.DESC, "updatedAt"));

    return format == ExportFormat.EXCEL
        ? ticketExportService.exportAsExcel(tickets)
        : ticketExportService.exportAsPdf(tickets);
    }

    public TicketDetailsResponse getTicketDetails(Long id) {
    SupportTicket ticket = findTicketById(id);
    return mapToDetailsResponse(ticket);
    }

    private TicketListResponse mapToListResponse(SupportTicket ticket) {
    return TicketListResponse.builder()
        .id(ticket.getId())
        .subject(ticket.getSubject())
        .categoryName(ticket.getCategory() != null ? ticket.getCategory().getName() : null)
        .otherCategory(ticket.getOtherCategory())
        .priority(ticket.getPriority())
        .status(ticket.getStatus())
        .createdAt(ticket.getCreatedAt())
        .updatedAt(ticket.getUpdatedAt())
        .responseDueAt(ticket.getResponseDueAt())
        .resolutionDueAt(ticket.getResolutionDueAt())
        .responseBreached(ticket.isResponseBreached())
        .resolutionBreached(ticket.isResolutionBreached())
        .submittedById(ticket.getSubmittedBy() != null ? ticket.getSubmittedBy().getId() : null)
        .submittedByName(ticket.getSubmittedBy() != null ? ticket.getSubmittedBy().getUsername() : null)
        .assignedToId(ticket.getAssignedTo() != null ? ticket.getAssignedTo().getId() : null)
        .assignedToName(ticket.getAssignedTo() != null ? ticket.getAssignedTo().getUsername() : null)
        .department(ticket.getSubmitterDepartment())
        .archived(ticket.isArchived())
        .build();
    }

    private TicketDetailsResponse mapToDetailsResponse(SupportTicket ticket) {
    List<TicketCommentResponse> comments = ticket.getComments().stream()
        .sorted(Comparator.comparing(TicketComment::getCreatedAt))
        .map(comment -> TicketCommentResponse.builder()
            .id(comment.getId())
            .comment(comment.getComment())
            .fileUrl(comment.getFileUrl())
            .createdAt(comment.getCreatedAt())
            .commenterId(comment.getCommenter() != null ? comment.getCommenter().getId() : null)
            .commenterName(comment.getCommenter() != null ? comment.getCommenter().getUsername() : null)
            .commenterAvatarUrl(comment.getCommenter() != null ? comment.getCommenter().getProfilePictureUrl() : null)
            .fromSubmitter(ticket.getSubmittedBy() != null && comment.getCommenter() != null
                && ticket.getSubmittedBy().getId().equals(comment.getCommenter().getId()))
            .build())
        .collect(Collectors.toList());

    List<TicketAttachmentResponse> attachments = ticket.getAttachments().stream()
        .sorted(Comparator.comparing(TicketAttachment::getUploadedAt))
        .map(attachment -> TicketAttachmentResponse.builder()
            .id(attachment.getId())
            .originalFilename(attachment.getOriginalFilename())
            .fileUrl(attachment.getFileUrl())
            .uploadedAt(attachment.getUploadedAt())
            .uploadedById(attachment.getUploadedBy() != null ? attachment.getUploadedBy().getId() : null)
            .uploadedByName(attachment.getUploadedBy() != null ? attachment.getUploadedBy().getUsername() : null)
            .build())
        .collect(Collectors.toList());

    List<TicketActivityResponse> activityLog = ticket.getActivities() == null ? Collections.emptyList() : ticket.getActivities().stream()
        .sorted(Comparator.comparing(TicketActivity::getCreatedAt))
        .map(activity -> TicketActivityResponse.builder()
            .id(activity.getId())
            .actionType(activity.getActionType())
            .details(activity.getDetails())
            .createdAt(activity.getCreatedAt())
            .performedById(activity.getPerformedBy() != null ? activity.getPerformedBy().getId() : null)
            .performedByName(activity.getPerformedBy() != null ? activity.getPerformedBy().getUsername() : null)
            .build())
        .collect(Collectors.toList());

    return TicketDetailsResponse.builder()
        .id(ticket.getId())
        .subject(ticket.getSubject())
        .description(ticket.getDescription())
        .status(ticket.getStatus())
        .priority(ticket.getPriority())
        .categoryName(ticket.getCategory() != null ? ticket.getCategory().getName() : null)
        .otherCategory(ticket.getOtherCategory())
        .submittedById(ticket.getSubmittedBy() != null ? ticket.getSubmittedBy().getId() : null)
        .submittedByName(ticket.getSubmittedBy() != null ? ticket.getSubmittedBy().getUsername() : null)
        .submittedByAvatarUrl(ticket.getSubmittedBy() != null ? ticket.getSubmittedBy().getProfilePictureUrl() : null)
        .submitterDepartment(ticket.getSubmitterDepartment())
        .assignedToId(ticket.getAssignedTo() != null ? ticket.getAssignedTo().getId() : null)
        .assignedToName(ticket.getAssignedTo() != null ? ticket.getAssignedTo().getUsername() : null)
        .createdAt(ticket.getCreatedAt())
        .updatedAt(ticket.getUpdatedAt())
        .resolvedAt(ticket.getResolvedAt())
        .responseDueAt(ticket.getResponseDueAt())
        .resolutionDueAt(ticket.getResolutionDueAt())
        .firstResponseAt(ticket.getFirstResponseAt())
        .responseBreached(ticket.isResponseBreached())
        .resolutionBreached(ticket.isResolutionBreached())
        .inventoryItemId(ticket.getRelatedInventoryItem() != null ? ticket.getRelatedInventoryItem().getId() : null)
        .inventoryItemName(ticket.getRelatedInventoryItem() != null ? ticket.getRelatedInventoryItem().getName() : null)
        .projectId(ticket.getRelatedProject() != null ? ticket.getRelatedProject().getId() : null)
        .projectName(ticket.getRelatedProject() != null ? ticket.getRelatedProject().getName() : null)
        .archived(ticket.isArchived())
        .archivedAt(ticket.getArchivedAt())
        .archivedById(ticket.getArchivedBy() != null ? ticket.getArchivedBy().getId() : null)
        .archivedByName(ticket.getArchivedBy() != null ? ticket.getArchivedBy().getUsername() : null)
        .comments(comments)
        .attachments(attachments)
        .activityLog(activityLog)
        .build();
    }

    public SupportTicket updateTicketMetadata(Long id, TicketUpdateRequest request) {
        SupportTicket ticket = findTicketById(id);
        SupportTicket.TicketPriority previousPriority = ticket.getPriority();

        if (request.getPriority() != null) {
            ticket.setPriority(request.getPriority());
        }
        if (request.getCategoryId() != null) {
            TicketCategory category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new RuntimeException("Category not found."));
            ticket.setCategory(category);
        }
        if (request.getOtherCategory() != null) {
            ticket.setOtherCategory(request.getOtherCategory());
        }
        if (request.getInventoryItemId() != null) {
            InventoryItem item = inventoryItemRepository.findById(request.getInventoryItemId())
                    .orElseThrow(() -> new RuntimeException("Inventory item not found."));
            ticket.setRelatedInventoryItem(item);
        }
        if (request.getProjectId() != null) {
            Project project = projectRepository.findById(request.getProjectId())
                    .orElseThrow(() -> new RuntimeException("Project not found."));
            ticket.setRelatedProject(project);
        }
        if (request.getSubmitterDepartment() != null) {
            ticket.setSubmitterDepartment(request.getSubmitterDepartment());
        }

        if (previousPriority != ticket.getPriority()) {
            slaService.recalculateSlaForPriorityChange(ticket);
        }

        return ticketRepository.save(ticket);
    }

    public SupportTicket archiveTicket(Long id) {
        SupportTicket ticket = findTicketById(id);
        ticket.setArchived(true);
        ticket.setArchivedAt(LocalDateTime.now());
        ticket.setArchivedBy(getCurrentUser());
        return ticketRepository.save(ticket);
    }

    public SupportTicket restoreTicket(Long id) {
        SupportTicket ticket = findTicketById(id);
        ticket.setArchived(false);
        ticket.setArchivedAt(null);
        ticket.setArchivedBy(null);
        return ticketRepository.save(ticket);
    }

    public TicketAnalyticsResponse buildAnalyticsSummary() {
        long open = ticketRepository.countByStatus(SupportTicket.TicketStatus.OPEN);
        long inProgress = ticketRepository.countByStatus(SupportTicket.TicketStatus.IN_PROGRESS);
        long resolved = ticketRepository.countByStatus(SupportTicket.TicketStatus.RESOLVED);
        long closed = ticketRepository.countByStatus(SupportTicket.TicketStatus.CLOSED);

        Map<String, Long> status = Map.of(
                "OPEN", open,
                "IN_PROGRESS", inProgress,
                "RESOLVED", resolved,
                "CLOSED", closed
        );

        Map<String, Long> byCategory = new HashMap<>();
        categoryRepository.findAll().forEach(category ->
                byCategory.put(category.getName(), ticketRepository.countByCategory_Name(category.getName())));

        Map<String, Long> byPriority = new HashMap<>();
        for (SupportTicket.TicketPriority priority : SupportTicket.TicketPriority.values()) {
            byPriority.put(priority.name(), ticketRepository.countByPriority(priority));
        }

        List<SupportTicket> allTickets = ticketRepository.findAll();
        List<SupportTicket> resolvedTickets = allTickets.stream()
                .filter(t -> t.getStatus() == SupportTicket.TicketStatus.RESOLVED)
                .collect(Collectors.toList());
        double averageResolution = resolvedTickets.stream()
                .filter(t -> t.getResolvedAt() != null)
                .mapToDouble(t -> Duration.between(t.getCreatedAt(), t.getResolvedAt()).toHours())
                .average().orElse(0);

        double averageResponse = allTickets.stream()
                .filter(t -> t.getFirstResponseAt() != null)
                .mapToDouble(t -> Duration.between(t.getCreatedAt(), t.getFirstResponseAt()).toHours())
                .average().orElse(0);

        long slaMet = resolvedTickets.stream()
                .filter(t -> !t.isResolutionBreached())
                .count();
        long resolvedTotal = resolvedTickets.size();
        double slaCompliance = resolvedTotal == 0 ? 100 : (slaMet * 100.0) / resolvedTotal;

        return TicketAnalyticsResponse.builder()
                .ticketsByStatus(status)
                .ticketsByCategory(byCategory)
                .ticketsByPriority(byPriority)
                .averageResolutionHours(averageResolution)
                .averageResponseHours(averageResponse)
                .slaCompliancePercentage(slaCompliance)
                .build();
    }

    private String truncate(String value) {
        if (value == null) {
            return "";
        }
        return value.length() > 120 ? value.substring(0, 117) + "..." : value;
    }
}