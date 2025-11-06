package com.bamikahub.inventorysystem.services.finance;

import com.bamikahub.inventorysystem.dao.operations.ProjectRepository;
import com.bamikahub.inventorysystem.dao.finance.RequisitionItemRepository;
import com.bamikahub.inventorysystem.dao.finance.RequisitionRepository;
import com.bamikahub.inventorysystem.dao.user.UserRepository;
import com.bamikahub.inventorysystem.dto.finance.FulfillmentItemDto;
import com.bamikahub.inventorysystem.dto.finance.FulfillmentRequest;
import com.bamikahub.inventorysystem.dto.finance.RequisitionRequest;
import com.bamikahub.inventorysystem.models.audit.AuditLog;
import com.bamikahub.inventorysystem.models.operations.Project;
import com.bamikahub.inventorysystem.models.finance.Requisition;
import com.bamikahub.inventorysystem.models.finance.RequisitionItem;
import com.bamikahub.inventorysystem.models.user.User;
import com.bamikahub.inventorysystem.services.audit.AuditService;
import com.bamikahub.inventorysystem.services.inventory.InventoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class FinanceService {

    @Autowired private RequisitionRepository requisitionRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private ProjectRepository projectRepository;
    @Autowired private RequisitionItemRepository requisitionItemRepository;
    @Autowired private InventoryService inventoryService;
    @Autowired private AuditService auditService;


    @Transactional
    public Requisition createRequisition(RequisitionRequest request) {
    User currentUser = getCurrentUser();

        Project project = projectRepository.findById(request.getProjectId())
                .orElseThrow(() -> new RuntimeException("Project not found."));

    Requisition requisition = new Requisition();
        requisition.setRequestedBy(currentUser);
        requisition.setProject(project);
    requisition.setDateNeeded(com.bamikahub.inventorysystem.util.ValidationUtil.validateRequisitionDate(request.getDateNeeded()));
    requisition.setJustification(com.bamikahub.inventorysystem.util.ValidationUtil.validateJustification(request.getJustification()));
        requisition.setStatus(Requisition.RequisitionStatus.PENDING);

        // v-- THIS IS THE ROBUST FIX --v
        List<RequisitionItem> items = request.getItems().stream().map(itemDto -> {
            RequisitionItem item = new RequisitionItem();
            item.setItemName(com.bamikahub.inventorysystem.util.ValidationUtil.validateItemName(itemDto.getItemName()));
            item.setDescription(com.bamikahub.inventorysystem.util.ValidationUtil.validateDescriptionOptional(itemDto.getDescription()));
            item.setQuantity(itemDto.getQuantity());
            item.setUnitOfMeasure(com.bamikahub.inventorysystem.util.ValidationUtil.validateUnit(itemDto.getUnitOfMeasure()));

            // Ensure BigDecimal is not null before setting
            if (itemDto.getEstimatedUnitCost() != null) {
                item.setEstimatedUnitCost(itemDto.getEstimatedUnitCost());
            }

            // Explicitly set the back-reference to the parent
            item.setRequisition(requisition);
            return item;
        }).collect(Collectors.toList());

        requisition.setItems(items);
        // ^-- THIS IS THE ROBUST FIX --^

        Requisition saved = requisitionRepository.save(requisition);

        try {
            Map<String, Object> details = auditService.createDetailsMap();
            details.put("projectId", project.getId());
            details.put("projectName", project.getName());
            details.put("dateNeeded", request.getDateNeeded());
            details.put("itemCount", items.size());

            auditService.logAction(
                    currentUser,
                    AuditLog.ActionType.REQUISITION_CREATED,
                    "Requisition",
                    saved.getId(),
                    "REQ-" + saved.getId(),
                    details
            );
        } catch (Exception ignored) {
            // audit failures should never prevent requisition creation
        }

        return saved;
    }

    @Transactional
    public Requisition approveRequisition(Long requisitionId, String notes) {
        Requisition requisition = requisitionRepository.findById(requisitionId)
                .orElseThrow(() -> new RuntimeException("Requisition not found."));

    User approver = getCurrentUser();

        if (requisition.getStatus() != Requisition.RequisitionStatus.PENDING) {
            throw new IllegalStateException("Requisition is not in PENDING state and cannot be approved.");
        }

        requisition.setStatus(Requisition.RequisitionStatus.APPROVED_BY_FINANCE);
        requisition.setApprovedBy(approver);
        requisition.setApprovedAt(LocalDateTime.now());
        requisition.setApprovalNotes(notes);

        Requisition saved = requisitionRepository.save(requisition);

        try {
            Map<String, Object> details = auditService.createDetailsMap();
            details.put("notes", notes);
            details.put("status", saved.getStatus());
            details.put("projectId", saved.getProject() != null ? saved.getProject().getId() : null);

            auditService.logAction(
                    approver,
                    AuditLog.ActionType.REQUISITION_APPROVED_FINANCE,
                    "Requisition",
                    saved.getId(),
                    "REQ-" + saved.getId(),
                    details
            );
        } catch (Exception ignored) {
            // keep approval flow resilient
        }

        return saved;
    }

    @Transactional
    public Requisition rejectRequisition(Long requisitionId, String reason) {
        Requisition requisition = requisitionRepository.findById(requisitionId)
                .orElseThrow(() -> new RuntimeException("Requisition not found."));

    User rejecter = getCurrentUser();

        requisition.setStatus(Requisition.RequisitionStatus.REJECTED);
        requisition.setApprovalNotes(reason);
        requisition.setApprovedBy(rejecter); // Set who rejected it
        requisition.setApprovedAt(LocalDateTime.now()); // Set when it was rejected

        Requisition saved = requisitionRepository.save(requisition);

        try {
            Map<String, Object> details = auditService.createDetailsMap();
            details.put("reason", reason);
            details.put("status", saved.getStatus());
            details.put("projectId", saved.getProject() != null ? saved.getProject().getId() : null);

            auditService.logAction(
                    rejecter,
                    AuditLog.ActionType.REQUISITION_REJECTED,
                    "Requisition",
                    saved.getId(),
                    "REQ-" + saved.getId(),
                    details
            );
        } catch (Exception ignored) {
            // rejection must proceed even if audit fails
        }

        return saved;
    }

    // Mark a requisition as fulfilled
    @Transactional
    public Requisition fulfillRequisition(Long requisitionId, FulfillmentRequest request) {
        Requisition requisition = requisitionRepository.findById(requisitionId)
                .orElseThrow(() -> new RuntimeException("Requisition not found."));

        if (requisition.getStatus() != Requisition.RequisitionStatus.APPROVED_BY_FINANCE) {
            throw new IllegalStateException("Requisition must be approved before it can be fulfilled.");
        }

    User currentUser = getCurrentUser();

        // Loop through the items received from the frontend
        for (FulfillmentItemDto itemDto : request.getItems()) {
            String reference = "Req ID: " + requisitionId + " / " + request.getNotes();

            // The CORE LOGIC: Choose which workflow to execute
            if (request.getFulfillmentType() == FulfillmentRequest.FulfillmentType.RECEIVE_INTO_STOCK) {
                inventoryService.receiveGoodsIntoStock(
                        itemDto.getInventoryItemId(),
                        itemDto.getQuantityReceived(),
                        itemDto.getActualUnitCost(),
                        reference,
                        currentUser
                );
            } else if (request.getFulfillmentType() == FulfillmentRequest.FulfillmentType.FULFILL_AND_ISSUE_TO_PROJECT) {
                inventoryService.recordDirectToProjectTransaction(
                        itemDto.getInventoryItemId(),
                        itemDto.getQuantityReceived(),
                        itemDto.getActualUnitCost(),
                        reference,
                        currentUser
                );
            }
        }

        requisition.setStatus(Requisition.RequisitionStatus.FULFILLED);
        requisition.setApprovalNotes((requisition.getApprovalNotes() != null ? requisition.getApprovalNotes() : "") + "\nFulfilled: " + request.getNotes());

        Requisition saved = requisitionRepository.save(requisition);

        try {
            Map<String, Object> details = auditService.createDetailsMap();
            details.put("fulfillmentType", request.getFulfillmentType());
            details.put("notes", request.getNotes());
            details.put("items", request.getItems().stream().map(item -> {
                Map<String, Object> itemDetails = auditService.createDetailsMap();
                itemDetails.put("inventoryItemId", item.getInventoryItemId());
                itemDetails.put("quantityReceived", item.getQuantityReceived());
                itemDetails.put("actualUnitCost", item.getActualUnitCost());
                return itemDetails;
            }).collect(Collectors.toList()));

            auditService.logAction(
                    currentUser,
                    AuditLog.ActionType.REQUISITION_FULFILLED,
                    "Requisition",
                    saved.getId(),
                    "REQ-" + saved.getId(),
                    details
            );
        } catch (Exception ignored) {
            // audit logging should not block requisition fulfillment
        }

        return saved;
    }

    //  Mark a requisition as closed
    @Transactional
    public Requisition closeRequisition(Long requisitionId, String notes) {
        Requisition requisition = requisitionRepository.findById(requisitionId)
                .orElseThrow(() -> new RuntimeException("Requisition not found."));

        // Business Rule: Can only close a fulfilled requisition
        if (requisition.getStatus() != Requisition.RequisitionStatus.FULFILLED) {
            throw new IllegalStateException("Requisition must be fulfilled before it can be closed.");
        }

        requisition.setStatus(Requisition.RequisitionStatus.CLOSED);
        requisition.setApprovalNotes(requisition.getApprovalNotes() + "\nClosed: " + notes);

        Requisition saved = requisitionRepository.save(requisition);

        try {
            Map<String, Object> details = auditService.createDetailsMap();
            details.put("notes", notes);
            details.put("status", saved.getStatus());

            auditService.logAction(
                    getCurrentUser(),
                    AuditLog.ActionType.REQUISITION_CLOSED,
                    "Requisition",
                    saved.getId(),
                    "REQ-" + saved.getId(),
                    details
            );
        } catch (Exception ignored) {
            // closing should remain robust
        }

        return saved;
    }


    // NEW METHOD: Update an existing requisition
    @Transactional
    public Requisition updateRequisition(Long requisitionId, RequisitionRequest request) {
        Requisition requisition = requisitionRepository.findById(requisitionId)
                .orElseThrow(() -> new RuntimeException("Requisition not found."));

        if (requisition.getStatus() != Requisition.RequisitionStatus.PENDING && requisition.getStatus() != Requisition.RequisitionStatus.REJECTED) {
            throw new IllegalStateException("Requisition cannot be edited in its current state.");
        }

        User currentUser = getCurrentUser();
        if (!requisition.getRequestedBy().getEmail().equals(currentUser.getEmail())) {
            throw new SecurityException("You are not authorized to edit this requisition.");
        }

        if (requisition.getStatus() == Requisition.RequisitionStatus.REJECTED) {
            String rejectionReason = requisition.getApprovalNotes();
            String history = requisition.getNotesHistory() != null ? requisition.getNotesHistory() : "";

            // Add a null check for the user who rejected it.
            String rejectedByUsername = (requisition.getApprovedBy() != null) ? requisition.getApprovedBy().getUsername() : "System";

            requisition.setNotesHistory(
                    "Rejected on " + LocalDateTime.now().toString() + " by " + rejectedByUsername +
                            " with reason: '" + rejectionReason + "'\n---\n" + history
            );

            requisition.setApprovedBy(null);
            requisition.setApprovedAt(null);
            requisition.setApprovalNotes(null);
            requisition.setStatus(Requisition.RequisitionStatus.PENDING);
            requisition.setSubmissionCount(requisition.getSubmissionCount() + 1);
        }

        Project project = projectRepository.findById(request.getProjectId())
                .orElseThrow(() -> new RuntimeException("Project not found."));
    requisition.setProject(project);
    requisition.setDateNeeded(com.bamikahub.inventorysystem.util.ValidationUtil.validateRequisitionDate(request.getDateNeeded()));
    requisition.setJustification(com.bamikahub.inventorysystem.util.ValidationUtil.validateJustification(request.getJustification()));

        requisitionItemRepository.deleteAll(requisition.getItems());
        requisition.getItems().clear();

        List<RequisitionItem> newItems = request.getItems().stream().map(itemDto -> {
            RequisitionItem item = new RequisitionItem();
            item.setItemName(com.bamikahub.inventorysystem.util.ValidationUtil.validateItemName(itemDto.getItemName()));
            item.setDescription(com.bamikahub.inventorysystem.util.ValidationUtil.validateDescriptionOptional(itemDto.getDescription()));
            item.setQuantity(itemDto.getQuantity());
            item.setUnitOfMeasure(com.bamikahub.inventorysystem.util.ValidationUtil.validateUnit(itemDto.getUnitOfMeasure()));
            item.setEstimatedUnitCost(itemDto.getEstimatedUnitCost());
            item.setRequisition(requisition);
            return item;
        }).collect(Collectors.toList());
        requisition.getItems().addAll(newItems);

        Requisition saved = requisitionRepository.save(requisition);

        try {
            Map<String, Object> details = auditService.createDetailsMap();
            details.put("projectId", project.getId());
            details.put("submissionCount", saved.getSubmissionCount());
            details.put("itemCount", saved.getItems().size());

            auditService.logAction(
                    currentUser,
                    AuditLog.ActionType.REQUISITION_UPDATED,
                    "Requisition",
                    saved.getId(),
                    "REQ-" + saved.getId(),
                    details
            );
        } catch (Exception ignored) {
            // edits should continue even if audit fails
        }

        return saved;
    }

    private User getCurrentUser() {
        String currentUserEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new RuntimeException("Current user not found."));
    }
}