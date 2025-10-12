package com.bamikahub.inventorysystem.controllers.finance;

import com.bamikahub.inventorysystem.dao.finance.RequisitionRepository;
import com.bamikahub.inventorysystem.dto.finance.ApprovalRequest;
import com.bamikahub.inventorysystem.dto.finance.FulfillmentRequest;
import com.bamikahub.inventorysystem.dto.finance.RequisitionRequest;
import com.bamikahub.inventorysystem.models.finance.Requisition;
import com.bamikahub.inventorysystem.services.finance.FinanceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/requisitions")
@CrossOrigin(origins = "*", maxAge = 3600)
public class RequisitionController {

    @Autowired private FinanceService financeService;
    @Autowired private RequisitionRepository requisitionRepository;

    @PostMapping
    @PreAuthorize("hasAuthority('REQUISITION_CREATE')")
    public Requisition submitRequisition(@RequestBody RequisitionRequest request) {
        return financeService.createRequisition(request);
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()") // Any logged-in user can view requisitions
    public List<Requisition> getAllRequisitions() {
        return requisitionRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public Requisition getRequisitionById(@PathVariable Long id) {
        return requisitionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Requisition not found"));
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasAuthority('REQUISITION_APPROVE')")
    public Requisition approveRequisition(@PathVariable Long id, @RequestBody ApprovalRequest request) {
        return financeService.approveRequisition(id, request.getNotes());
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasAuthority('REQUISITION_APPROVE')") // Same permission to approve/reject
    public Requisition rejectRequisition(@PathVariable Long id, @RequestBody ApprovalRequest request) {
        return financeService.rejectRequisition(id, request.getNotes());
    }

    // Permission can be ITEM_UPDATE as Inventory Manager handles this
    @PostMapping("/{id}/fulfill")
    @PreAuthorize("hasAuthority('ITEM_UPDATE')")
    public Requisition fulfillRequisition(@PathVariable Long id, @RequestBody FulfillmentRequest request) {
        return financeService.fulfillRequisition(id, request);
    }

    @PostMapping("/{id}/close")
    @PreAuthorize("hasAuthority('REQUISITION_APPROVE')") // Finance Manager can close
    public Requisition closeRequisition(@PathVariable Long id, @RequestBody ApprovalRequest request) {
        return financeService.closeRequisition(id, request.getNotes());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('REQUISITION_CREATE')") // Users who can create can also edit
    public Requisition updateRequisition(@PathVariable Long id, @RequestBody RequisitionRequest request) {
        return financeService.updateRequisition(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('REQUISITION_CREATE') or hasAuthority('REQUISITION_APPROVE')") // Requester or Admin/Manager can delete
    public ResponseEntity<Void> deleteRequisition(@PathVariable Long id) {
        // Add security check in service to ensure only owner or admin can delete
        requisitionRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}