package com.bamikahub.inventorysystem.services.inventory;

import com.bamikahub.inventorysystem.dao.inventory.SupplierRepository;
import com.bamikahub.inventorysystem.dao.user.UserRepository;
import com.bamikahub.inventorysystem.models.audit.AuditLog;
import com.bamikahub.inventorysystem.models.inventory.Supplier;
import com.bamikahub.inventorysystem.models.user.User;
import com.bamikahub.inventorysystem.services.audit.AuditService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

@Service
public class SupplierService {

    @Autowired private SupplierRepository supplierRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private AuditService auditService;

    @Transactional(readOnly = true)
    public List<Supplier> getAllSuppliers() {
        return supplierRepository.findAll();
    }

    @Transactional
    public Supplier createSupplier(Supplier supplierRequest) {
        Supplier savedSupplier = supplierRepository.save(supplierRequest);

        try {
            User actor = getAuthenticatedUser();
            if (actor != null) {
                Map<String, Object> details = buildSupplierSnapshot(savedSupplier);
                auditService.logAction(
                        actor,
                        AuditLog.ActionType.SUPPLIER_CREATED,
                        "Supplier",
                        savedSupplier.getId(),
                        savedSupplier.getName(),
                        details
                );
            }
        } catch (Exception ignored) {
            // audit logging must not interrupt supplier creation
        }

        return savedSupplier;
    }

    @Transactional(readOnly = true)
    public Supplier getSupplierById(Long id) {
        return supplierRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Supplier not found with id: " + id));
    }

    @Transactional
    public Supplier updateSupplier(Long id, Supplier supplierDetails) {
        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Supplier not found with id: " + id));

        Map<String, Object> beforeDetails = buildSupplierSnapshot(supplier);

        supplier.setName(supplierDetails.getName());
        supplier.setContactPerson(supplierDetails.getContactPerson());
        supplier.setEmail(supplierDetails.getEmail());
        supplier.setPhone(supplierDetails.getPhone());
        supplier.setAddress(supplierDetails.getAddress());

        Supplier updatedSupplier = supplierRepository.save(supplier);

        try {
            User actor = getAuthenticatedUser();
            if (actor != null) {
        Map<String, Object> afterDetails = buildSupplierSnapshot(updatedSupplier);
                Map<String, Object> details = auditService.createDetailsMap();
                details.put("before", beforeDetails);
                details.put("after", afterDetails);
        details.put("changedFields", computeChangedFields(beforeDetails, afterDetails));

                auditService.logAction(
                        actor,
                        AuditLog.ActionType.SUPPLIER_UPDATED,
                        "Supplier",
                        updatedSupplier.getId(),
                        updatedSupplier.getName(),
                        details
                );
            }
        } catch (Exception ignored) {
            // best-effort audit logging
        }

        return updatedSupplier;
    }

    @Transactional
    public void deleteSupplier(Long id) {
        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Supplier not found with id: " + id));

        if (supplier.getItems() != null && !supplier.getItems().isEmpty()) {
            throw new IllegalStateException("Cannot delete supplier: It is currently assigned to one or more inventory items.");
        }

        supplierRepository.delete(supplier);

        try {
            User actor = getAuthenticatedUser();
            if (actor != null) {
                Map<String, Object> details = buildSupplierSnapshot(supplier);
                details.put("note", "Supplier deleted");

                auditService.logAction(
                        actor,
                        AuditLog.ActionType.SUPPLIER_DELETED,
                        "Supplier",
                        supplier.getId(),
                        supplier.getName(),
                        details
                );
            }
        } catch (Exception ignored) {
            // deletion should not rollback due to audit failure
        }
    }

    private Map<String, Object> buildSupplierSnapshot(Supplier supplier) {
        Map<String, Object> details = new HashMap<>();
        details.put("name", supplier.getName());
        details.put("contactPerson", supplier.getContactPerson());
        details.put("email", supplier.getEmail());
        details.put("phone", supplier.getPhone());
        details.put("address", supplier.getAddress());
        details.put("itemCount", supplier.getItems() != null ? supplier.getItems().size() : 0);
        return details;
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

    private User getAuthenticatedUser() {
        try {
            String email = SecurityContextHolder.getContext().getAuthentication().getName();
            if (email == null || "anonymousUser".equalsIgnoreCase(email)) {
                return null;
            }
            return userRepository.findByEmail(email).orElse(null);
        } catch (Exception e) {
            return null;
        }
    }
}
