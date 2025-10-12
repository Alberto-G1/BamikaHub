package com.bamikahub.inventorysystem.services;

import com.bamikahub.inventorysystem.dao.ProjectRepository;
import com.bamikahub.inventorysystem.dao.RequisitionItemRepository;
import com.bamikahub.inventorysystem.dao.RequisitionRepository;
import com.bamikahub.inventorysystem.dao.UserRepository;
import com.bamikahub.inventorysystem.dto.RequisitionRequest;
import com.bamikahub.inventorysystem.models.Project;
import com.bamikahub.inventorysystem.models.Requisition;
import com.bamikahub.inventorysystem.models.RequisitionItem;
import com.bamikahub.inventorysystem.models.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class FinanceService {

    @Autowired private RequisitionRepository requisitionRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private ProjectRepository projectRepository;
    @Autowired private RequisitionItemRepository requisitionItemRepository; // <-- Inject this


    @Transactional
    public Requisition createRequisition(RequisitionRequest request) {
        String currentUserEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new RuntimeException("Current user not found."));

        Project project = projectRepository.findById(request.getProjectId())
                .orElseThrow(() -> new RuntimeException("Project not found."));

        Requisition requisition = new Requisition();
        requisition.setRequestedBy(currentUser);
        requisition.setProject(project);
        requisition.setDateNeeded(request.getDateNeeded());
        requisition.setJustification(request.getJustification());
        requisition.setStatus(Requisition.RequisitionStatus.PENDING);

        // v-- THIS IS THE ROBUST FIX --v
        List<RequisitionItem> items = request.getItems().stream().map(itemDto -> {
            RequisitionItem item = new RequisitionItem();
            item.setItemName(itemDto.getItemName());
            item.setDescription(itemDto.getDescription());
            item.setQuantity(itemDto.getQuantity());
            item.setUnitOfMeasure(itemDto.getUnitOfMeasure());

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

        return requisitionRepository.save(requisition);
    }

    @Transactional
    public Requisition approveRequisition(Long requisitionId, String notes) {
        Requisition requisition = requisitionRepository.findById(requisitionId)
                .orElseThrow(() -> new RuntimeException("Requisition not found."));

        String currentUserEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        User approver = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new RuntimeException("Approver not found."));

        if (requisition.getStatus() != Requisition.RequisitionStatus.PENDING) {
            throw new IllegalStateException("Requisition is not in PENDING state and cannot be approved.");
        }

        requisition.setStatus(Requisition.RequisitionStatus.APPROVED_BY_FINANCE);
        requisition.setApprovedBy(approver);
        requisition.setApprovedAt(LocalDateTime.now());
        requisition.setApprovalNotes(notes);

        return requisitionRepository.save(requisition);
    }

    @Transactional
    public Requisition rejectRequisition(Long requisitionId, String reason) {
        Requisition requisition = requisitionRepository.findById(requisitionId)
                .orElseThrow(() -> new RuntimeException("Requisition not found."));

        requisition.setStatus(Requisition.RequisitionStatus.REJECTED);
        requisition.setApprovalNotes(reason);

        return requisitionRepository.save(requisition);
    }

    // Mark a requisition as fulfilled
    @Transactional
    public Requisition fulfillRequisition(Long requisitionId, String notes) {
        Requisition requisition = requisitionRepository.findById(requisitionId)
                .orElseThrow(() -> new RuntimeException("Requisition not found."));

        // Business Rule: Can only fulfill an approved requisition
        if (requisition.getStatus() != Requisition.RequisitionStatus.APPROVED_BY_FINANCE) {
            throw new IllegalStateException("Requisition must be approved before it can be fulfilled.");
        }

        requisition.setStatus(Requisition.RequisitionStatus.FULFILLED);
        // Optionally, you can add more fields to track fulfillment details
        // requisition.setFulfilledBy(currentUser);
        // requisition.setFulfilledAt(LocalDateTime.now());
        requisition.setApprovalNotes(requisition.getApprovalNotes() + "\nFulfilled: " + notes); // Append notes

        // TODO: In a more advanced system, this is where you would loop through
        // requisition.getItems() and automatically create 'Stock In' transactions
        // in the InventoryService for each procured item.

        return requisitionRepository.save(requisition);
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

        return requisitionRepository.save(requisition);
    }


    // NEW METHOD: Update an existing requisition
    @Transactional
    public Requisition updateRequisition(Long requisitionId, RequisitionRequest request) {
        Requisition requisition = requisitionRepository.findById(requisitionId)
                .orElseThrow(() -> new RuntimeException("Requisition not found."));

        // Business Rule: Can only edit if PENDING or REJECTED
        if (requisition.getStatus() != Requisition.RequisitionStatus.PENDING && requisition.getStatus() != Requisition.RequisitionStatus.REJECTED) {
            throw new IllegalStateException("Requisition cannot be edited in its current state.");
        }

        // Security Rule: Ensure the person editing is the original requester
        String currentUserEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        if (!requisition.getRequestedBy().getEmail().equals(currentUserEmail)) {
            throw new SecurityException("You are not authorized to edit this requisition.");
        }

        // If it was rejected, we are now resubmitting it
        if (requisition.getStatus() == Requisition.RequisitionStatus.REJECTED) {
            requisition.setStatus(Requisition.RequisitionStatus.PENDING);
            requisition.setSubmissionCount(requisition.getSubmissionCount() + 1);
            // Clear previous rejection notes for a clean slate
            requisition.setApprovedBy(null);
            requisition.setApprovedAt(null);
            requisition.setApprovalNotes(null);
        }

        // Update main details
        Project project = projectRepository.findById(request.getProjectId())
                .orElseThrow(() -> new RuntimeException("Project not found."));
        requisition.setProject(project);
        requisition.setDateNeeded(request.getDateNeeded());
        requisition.setJustification(request.getJustification());

        // Clear old items and add the new/updated ones
        requisitionItemRepository.deleteAll(requisition.getItems());
        requisition.getItems().clear();

        List<RequisitionItem> newItems = request.getItems().stream().map(itemDto -> {
            RequisitionItem item = new RequisitionItem();
            item.setItemName(itemDto.getItemName());
            item.setDescription(itemDto.getDescription());
            item.setQuantity(itemDto.getQuantity());
            item.setUnitOfMeasure(itemDto.getUnitOfMeasure());
            item.setEstimatedUnitCost(itemDto.getEstimatedUnitCost());
            item.setRequisition(requisition);
            return item;
        }).collect(Collectors.toList());
        requisition.getItems().addAll(newItems);

        return requisitionRepository.save(requisition);
    }
}