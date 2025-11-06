package com.bamikahub.inventorysystem.controllers.support;

import com.bamikahub.inventorysystem.dao.support.SupportTicketRepository;
import com.bamikahub.inventorysystem.dao.support.TicketCategoryRepository;
import com.bamikahub.inventorysystem.dto.support.CommentRequest;
import com.bamikahub.inventorysystem.dto.support.TicketDetailsResponse;
import com.bamikahub.inventorysystem.dto.support.TicketFilterCriteria;
import com.bamikahub.inventorysystem.dto.support.TicketListResponse;
import com.bamikahub.inventorysystem.dto.support.TicketRequest;
import com.bamikahub.inventorysystem.dto.support.TicketUpdateRequest;
import com.bamikahub.inventorysystem.models.support.SupportTicket;
import com.bamikahub.inventorysystem.models.support.TicketAttachment;
import com.bamikahub.inventorysystem.models.support.TicketCategory;
import com.bamikahub.inventorysystem.models.support.TicketComment;
import com.bamikahub.inventorysystem.services.support.SupportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

@RestController
@RequestMapping("/api/support/tickets")
@CrossOrigin(origins = "*", maxAge = 3600)
public class SupportController {

    @Autowired private SupportService supportService;
    @Autowired private SupportTicketRepository ticketRepository;
    @Autowired private TicketCategoryRepository categoryRepository;

    @PostMapping
    @PreAuthorize("hasAuthority('TICKET_CREATE') or isAuthenticated()") // Allow any logged-in user to create
    public SupportTicket createTicket(@RequestBody TicketRequest request) {
        return supportService.createTicket(request);
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public List<TicketListResponse> getAllTickets(
            @RequestParam(required = false) SupportTicket.TicketStatus status,
            @RequestParam(required = false) SupportTicket.TicketPriority priority,
            @RequestParam(required = false) Integer categoryId,
            @RequestParam(required = false) Long assignedToId,
            @RequestParam(required = false) Long submittedById,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) Long inventoryItemId,
            @RequestParam(required = false) Long projectId,
            @RequestParam(required = false) String department,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "false") boolean includeArchived
    ) {
    TicketFilterCriteria criteria = buildCriteria(status, priority, categoryId, assignedToId, submittedById,
        startDate, endDate, inventoryItemId, projectId, department, search, includeArchived);
    return supportService.findTickets(criteria);
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public TicketDetailsResponse getTicketById(@PathVariable Long id) {
        return supportService.getTicketDetails(id);
    }

    @PostMapping("/{id}/assign")
    @PreAuthorize("hasAuthority('TICKET_MANAGE')")
    public SupportTicket assignTicket(@PathVariable Long id) {
        return supportService.assignTicketToSelf(id);
    }

    @PostMapping("/{id}/comments")
    @PreAuthorize("isAuthenticated()")
    public TicketComment addComment(@PathVariable Long id,
                                    @RequestPart("comment") String commentJson,
                                    @RequestPart(value = "file", required = false) MultipartFile file) {
        return supportService.addComment(id, commentJson, file);
    }

    @PostMapping("/{id}/resolve")
    @PreAuthorize("hasAuthority('TICKET_MANAGE')")
    public SupportTicket resolveTicket(@PathVariable Long id, @RequestBody CommentRequest request) {
        return supportService.resolveTicket(id, request.getComment());
    }

    @PostMapping("/{id}/close")
    @PreAuthorize("isAuthenticated()")
    public SupportTicket closeTicket(@PathVariable Long id) {
        return supportService.closeTicket(id);
    }

    @GetMapping("/categories")
    @PreAuthorize("isAuthenticated()")
    public List<TicketCategory> getTicketCategories() {
        return categoryRepository.findAll();
    }

    // Endpoint for adding attachments
    @PostMapping("/{id}/attachments")
    @PreAuthorize("isAuthenticated()")
    public TicketAttachment addAttachment(@PathVariable Long id, @RequestParam("file") MultipartFile file) {
        return supportService.addAttachmentToTicket(id, file);
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasAuthority('TICKET_MANAGE')")
    public SupportTicket updateTicket(@PathVariable Long id, @RequestBody TicketUpdateRequest request) {
        return supportService.updateTicketMetadata(id, request);
    }

    @PostMapping("/{id}/archive")
    @PreAuthorize("hasAuthority('TICKET_ARCHIVE')")
    public SupportTicket archiveTicket(@PathVariable Long id) {
        return supportService.archiveTicket(id);
    }

    @PostMapping("/{id}/restore")
    @PreAuthorize("hasAuthority('TICKET_ARCHIVE')")
    public SupportTicket restoreTicket(@PathVariable Long id) {
        return supportService.restoreTicket(id);
    }

    @GetMapping("/analytics/summary")
    @PreAuthorize("hasAuthority('TICKET_MANAGE')")
    public ResponseEntity<?> getAnalyticsSummary() {
        return ResponseEntity.ok(supportService.buildAnalyticsSummary());
    }

    @GetMapping(value = "/export/excel", produces = MediaType.APPLICATION_OCTET_STREAM_VALUE)
    @PreAuthorize("hasAuthority('TICKET_MANAGE')")
    public ResponseEntity<byte[]> exportExcel(
        @RequestParam(required = false) SupportTicket.TicketStatus status,
        @RequestParam(required = false) SupportTicket.TicketPriority priority,
        @RequestParam(required = false) Integer categoryId,
        @RequestParam(required = false) Long assignedToId,
        @RequestParam(required = false) Long submittedById,
        @RequestParam(required = false) String startDate,
        @RequestParam(required = false) String endDate,
        @RequestParam(required = false) Long inventoryItemId,
        @RequestParam(required = false) Long projectId,
        @RequestParam(required = false) String department,
        @RequestParam(required = false) String search,
        @RequestParam(defaultValue = "false") boolean includeArchived
    ) {
    TicketFilterCriteria criteria = buildCriteria(status, priority, categoryId, assignedToId, submittedById,
        startDate, endDate, inventoryItemId, projectId, department, search, includeArchived);
    byte[] data = supportService.exportTickets(criteria, SupportService.ExportFormat.EXCEL);
    return ResponseEntity.ok()
        .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
        .header("Content-Disposition", "attachment; filename=" + exportFileName("tickets", "xlsx"))
        .body(data);
    }

    @GetMapping(value = "/export/pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    @PreAuthorize("hasAuthority('TICKET_MANAGE')")
    public ResponseEntity<byte[]> exportPdf(
        @RequestParam(required = false) SupportTicket.TicketStatus status,
        @RequestParam(required = false) SupportTicket.TicketPriority priority,
        @RequestParam(required = false) Integer categoryId,
        @RequestParam(required = false) Long assignedToId,
        @RequestParam(required = false) Long submittedById,
        @RequestParam(required = false) String startDate,
        @RequestParam(required = false) String endDate,
        @RequestParam(required = false) Long inventoryItemId,
        @RequestParam(required = false) Long projectId,
        @RequestParam(required = false) String department,
        @RequestParam(required = false) String search,
        @RequestParam(defaultValue = "false") boolean includeArchived
    ) {
    TicketFilterCriteria criteria = buildCriteria(status, priority, categoryId, assignedToId, submittedById,
        startDate, endDate, inventoryItemId, projectId, department, search, includeArchived);
    byte[] data = supportService.exportTickets(criteria, SupportService.ExportFormat.PDF);
    return ResponseEntity.ok()
        .contentType(MediaType.APPLICATION_PDF)
        .header("Content-Disposition", "attachment; filename=" + exportFileName("tickets", "pdf"))
        .body(data);
    }

    private TicketFilterCriteria buildCriteria(SupportTicket.TicketStatus status,
                           SupportTicket.TicketPriority priority,
                           Integer categoryId,
                           Long assignedToId,
                           Long submittedById,
                           String startDate,
                           String endDate,
                           Long inventoryItemId,
                           Long projectId,
                           String department,
                           String search,
                           boolean includeArchived) {
    return TicketFilterCriteria.builder()
        .status(status)
        .priority(priority)
        .categoryId(categoryId)
        .assignedToId(assignedToId)
        .submittedById(submittedById)
        .startDate(startDate != null ? LocalDate.parse(startDate) : null)
        .endDate(endDate != null ? LocalDate.parse(endDate) : null)
        .inventoryItemId(inventoryItemId)
        .projectId(projectId)
        .department(department)
        .search(search)
        .includeArchived(includeArchived)
        .build();
    }

    private String exportFileName(String base, String extension) {
    return base + "-" + DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss").format(java.time.LocalDateTime.now()) + "." + extension;
    }
}