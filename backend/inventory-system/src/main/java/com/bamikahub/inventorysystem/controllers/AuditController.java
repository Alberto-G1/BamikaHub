package com.bamikahub.inventorysystem.controllers;

import com.bamikahub.inventorysystem.dto.audit.AuditFilterDto;
import com.bamikahub.inventorysystem.dto.audit.AuditLogDto;
import com.bamikahub.inventorysystem.services.audit.AuditExportService;
import com.bamikahub.inventorysystem.services.audit.AuditQueryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

/**
 * REST Controller for Audit Log Management
 * Restricted to users with audit permissions
 */
@RestController
@RequestMapping("/api/audit")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('AUDIT_READ')") // Permission-based access control
public class AuditController {

    private final AuditQueryService auditQueryService;
    private final AuditExportService auditExportService;

    /**
     * Query audit logs with filters
     * 
     * @param filters AuditFilterDto containing filter criteria
     * @return List of AuditLogDto
     */
    @PostMapping("/query")
    public ResponseEntity<List<AuditLogDto>> queryAuditLogs(@RequestBody AuditFilterDto filters) {
        List<AuditLogDto> logs = auditQueryService.queryAuditLogs(filters);
        return ResponseEntity.ok(logs);
    }

    /**
     * Get all audit logs (paginated in future)
     */
    @GetMapping
    public ResponseEntity<List<AuditLogDto>> getAllAuditLogs() {
        AuditFilterDto emptyFilter = new AuditFilterDto();
        List<AuditLogDto> logs = auditQueryService.queryAuditLogs(emptyFilter);
        return ResponseEntity.ok(logs);
    }

    /**
     * Get audit logs for a specific user
     * 
     * @param userId User ID
     * @param limit Max number of records (default 100)
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<AuditLogDto>> getUserActivity(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "100") int limit) {
        List<AuditLogDto> logs = auditQueryService.getUserActivity(userId, limit);
        return ResponseEntity.ok(logs);
    }

    /**
     * Get audit history for a specific entity
     * 
     * @param entityType Type of entity (e.g., "Project", "Requisition")
     * @param entityId ID of the entity
     */
    @GetMapping("/entity/{entityType}/{entityId}")
    public ResponseEntity<List<AuditLogDto>> getEntityHistory(
            @PathVariable String entityType,
            @PathVariable Long entityId) {
        List<AuditLogDto> logs = auditQueryService.getEntityHistory(entityType, entityId);
        return ResponseEntity.ok(logs);
    }

    /**
     * Get critical actions from the last N days
     * 
     * @param days Number of days to look back (default 7)
     */
    @GetMapping("/critical")
    public ResponseEntity<List<AuditLogDto>> getCriticalActions(
            @RequestParam(defaultValue = "7") int days) {
        List<AuditLogDto> logs = auditQueryService.getCriticalActions(days);
        return ResponseEntity.ok(logs);
    }

    /**
     * Get available action types for filtering
     */
    @GetMapping("/action-types")
    public ResponseEntity<List<String>> getActionTypes() {
        List<String> actionTypes = auditQueryService.getAvailableActionTypes();
        return ResponseEntity.ok(actionTypes);
    }

    /**
     * Get audit statistics for a user
     * 
     * @param userId User ID
     */
    @GetMapping("/stats/user/{userId}")
    public ResponseEntity<Map<String, Object>> getUserStats(@PathVariable Long userId) {
        Long actionCount = auditQueryService.getUserActionCount(userId);
        return ResponseEntity.ok(Map.of(
                "userId", userId,
                "totalActions", actionCount
        ));
    }

    /**
     * Export audit logs to CSV
     * 
     * @param filters AuditFilterDto containing filter criteria
     */
    @PostMapping("/export/csv")
    @PreAuthorize("hasAuthority('AUDIT_EXPORT')")
    public ResponseEntity<byte[]> exportToCsv(@RequestBody AuditFilterDto filters) {
        List<AuditLogDto> logs = auditQueryService.queryAuditLogs(filters);
        byte[] csvData = auditExportService.exportToCsv(logs);
        
        String filename = "audit_log_" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss")) + ".csv";
        
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csvData);
    }

    /**
     * Export audit logs to Excel
     * 
     * @param filters AuditFilterDto containing filter criteria
     */
    @PostMapping("/export/excel")
    @PreAuthorize("hasAuthority('AUDIT_EXPORT')")
    public ResponseEntity<byte[]> exportToExcel(@RequestBody AuditFilterDto filters) {
        try {
            List<AuditLogDto> logs = auditQueryService.queryAuditLogs(filters);
            byte[] excelData = auditExportService.exportToExcel(logs);
            
            String filename = "audit_log_" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss")) + ".xlsx";
            
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                    .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                    .body(excelData);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Export audit logs to PDF
     * 
     * @param filters AuditFilterDto containing filter criteria
     */
    @PostMapping("/export/pdf")
    @PreAuthorize("hasAuthority('AUDIT_EXPORT')")
    public ResponseEntity<byte[]> exportToPdf(@RequestBody AuditFilterDto filters) {
        List<AuditLogDto> logs = auditQueryService.queryAuditLogs(filters);
        byte[] pdfData = auditExportService.exportToPdf(logs);
        
        String filename = "audit_log_" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss")) + ".pdf";
        
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdfData);
    }
}
