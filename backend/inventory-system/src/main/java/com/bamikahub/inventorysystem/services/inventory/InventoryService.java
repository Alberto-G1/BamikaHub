package com.bamikahub.inventorysystem.services.inventory;

import com.bamikahub.inventorysystem.dao.inventory.CategoryRepository;
import com.bamikahub.inventorysystem.dao.inventory.InventoryItemRepository;
import com.bamikahub.inventorysystem.dao.inventory.StockTransactionRepository;
import com.bamikahub.inventorysystem.dao.inventory.SupplierRepository;
import com.bamikahub.inventorysystem.dao.user.UserRepository;
import com.bamikahub.inventorysystem.dto.inventory.InventoryItemRequest;
import com.bamikahub.inventorysystem.dto.inventory.StockTransactionRequest;
import com.bamikahub.inventorysystem.models.audit.AuditLog;
import com.bamikahub.inventorysystem.models.inventory.Category;
import com.bamikahub.inventorysystem.models.inventory.InventoryItem;
import com.bamikahub.inventorysystem.models.inventory.StockTransaction;
import com.bamikahub.inventorysystem.models.inventory.Supplier;
import com.bamikahub.inventorysystem.models.user.User;
import com.bamikahub.inventorysystem.services.FileStorageService;
import com.bamikahub.inventorysystem.services.audit.AuditService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

@Service
public class InventoryService {

    @Autowired private InventoryItemRepository itemRepository;
    @Autowired private CategoryRepository categoryRepository;
    @Autowired private SupplierRepository supplierRepository;
    @Autowired private StockTransactionRepository transactionRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private FileStorageService fileStorageService;
    @Autowired private AuditService auditService;

    @Transactional
    public InventoryItem createItem(InventoryItemRequest request) {
        InventoryItem newItem = new InventoryItem();
        newItem.setName(request.getName());
        newItem.setSku(request.getSku());
        newItem.setDescription(request.getDescription());
        newItem.setQuantity(request.getQuantity());
        newItem.setReorderLevel(request.getReorderLevel());
        newItem.setUnitPrice(request.getUnitPrice());
        newItem.setLocation(request.getLocation());
        newItem.setActive(request.isActive());

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Category not found"));
        newItem.setCategory(category);

        Supplier supplier = null;
        if (request.getSupplierId() != null) {
            supplier = supplierRepository.findById(request.getSupplierId()).orElse(null);
        }
        newItem.setSupplier(supplier);

        InventoryItem savedItem = itemRepository.save(newItem);

        try {
            User actor = getAuthenticatedUser();
            if (actor != null) {
                Map<String, Object> details = auditService.createDetailsMap();
                details.put("sku", savedItem.getSku());
                details.put("category", category.getName());
                details.put("supplier", supplier != null ? supplier.getName() : null);
                details.put("quantity", savedItem.getQuantity());
                details.put("reorderLevel", savedItem.getReorderLevel());
                details.put("unitPrice", savedItem.getUnitPrice());
                details.put("location", savedItem.getLocation());
                details.put("active", savedItem.isActive());

                auditService.logAction(
                        actor,
                        AuditLog.ActionType.ITEM_CREATED,
                        "InventoryItem",
                        savedItem.getId(),
                        savedItem.getName(),
                        details
                );
            }
        } catch (Exception ignored) {
            // audit logging must remain best-effort
        }

        return savedItem;
    }

    @Transactional
    public InventoryItem updateItem(Long id, InventoryItemRequest request) {
        InventoryItem existingItem = itemRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Item not found with id: " + id));

        Map<String, Object> before = new HashMap<>();
        before.put("name", existingItem.getName());
        before.put("sku", existingItem.getSku());
        before.put("description", existingItem.getDescription());
        before.put("reorderLevel", existingItem.getReorderLevel());
        before.put("unitPrice", existingItem.getUnitPrice());
        before.put("location", existingItem.getLocation());
        before.put("active", existingItem.isActive());
        before.put("categoryId", existingItem.getCategory() != null ? existingItem.getCategory().getId() : null);
        before.put("categoryName", existingItem.getCategory() != null ? existingItem.getCategory().getName() : null);
        before.put("supplierId", existingItem.getSupplier() != null ? existingItem.getSupplier().getId() : null);
        before.put("supplierName", existingItem.getSupplier() != null ? existingItem.getSupplier().getName() : null);

        existingItem.setName(request.getName());
        existingItem.setSku(request.getSku());
        existingItem.setDescription(request.getDescription());
        existingItem.setReorderLevel(request.getReorderLevel());
        existingItem.setUnitPrice(request.getUnitPrice());
        existingItem.setLocation(request.getLocation());
        existingItem.setActive(request.isActive());

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Category not found"));
        existingItem.setCategory(category);

        Supplier supplier = null;
        if (request.getSupplierId() != null) {
            supplier = supplierRepository.findById(request.getSupplierId()).orElse(null);
        }
        existingItem.setSupplier(supplier);

        InventoryItem updatedItem = itemRepository.save(existingItem);

        try {
            User actor = getAuthenticatedUser();
            if (actor != null) {
                Map<String, Object> after = new HashMap<>();
                after.put("name", updatedItem.getName());
                after.put("sku", updatedItem.getSku());
                after.put("description", updatedItem.getDescription());
                after.put("reorderLevel", updatedItem.getReorderLevel());
                after.put("unitPrice", updatedItem.getUnitPrice());
                after.put("location", updatedItem.getLocation());
                after.put("active", updatedItem.isActive());
                after.put("categoryId", updatedItem.getCategory() != null ? updatedItem.getCategory().getId() : null);
                after.put("categoryName", updatedItem.getCategory() != null ? updatedItem.getCategory().getName() : null);
                after.put("supplierId", updatedItem.getSupplier() != null ? updatedItem.getSupplier().getId() : null);
                after.put("supplierName", updatedItem.getSupplier() != null ? updatedItem.getSupplier().getName() : null);

                Set<String> changedFields = new HashSet<>();
                after.forEach((key, newValue) -> {
                    Object oldValue = before.get(key);
                    if (!Objects.equals(oldValue, newValue)) {
                        changedFields.add(key);
                    }
                });

                Map<String, Object> details = auditService.createDetailsMap();
                details.put("before", before);
                details.put("after", after);
                details.put("changedFields", changedFields);

                auditService.logAction(
                        actor,
                        AuditLog.ActionType.ITEM_UPDATED,
                        "InventoryItem",
                        updatedItem.getId(),
                        updatedItem.getName(),
                        details
                );
            }
        } catch (Exception ignored) {
            // audit logging must remain best-effort
        }

        return updatedItem;
    }

    @Transactional
    public void deleteItem(Long id) {
        InventoryItem item = itemRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Item not found with id: " + id));

        if (item.getQuantity() != null && item.getQuantity() > 0) {
            throw new RuntimeException("Cannot delete item with active stock. Adjust quantity to 0 first.");
        }

        item.setDeleted(true);
        item.setDeletedAt(LocalDateTime.now());
        itemRepository.save(item);

        try {
            User actor = getAuthenticatedUser();
            if (actor != null) {
                Map<String, Object> details = auditService.createDetailsMap();
                details.put("sku", item.getSku());
                details.put("category", item.getCategory() != null ? item.getCategory().getName() : null);
                details.put("supplier", item.getSupplier() != null ? item.getSupplier().getName() : null);
                details.put("deletedAt", item.getDeletedAt());

                auditService.logAction(
                        actor,
                        AuditLog.ActionType.ITEM_DELETED,
                        "InventoryItem",
                        item.getId(),
                        item.getName(),
                        details
                );
            }
        } catch (Exception ignored) {
            // deletion should continue even if audit logging fails
        }
    }

    @Transactional
    public StockTransaction recordStockTransaction(StockTransactionRequest request) {
        InventoryItem item = itemRepository.findById(request.getItemId())
                .orElseThrow(() -> new RuntimeException("Inventory item not found"));

    User actor = requireAuthenticatedUser();

        int previousQuantity = item.getQuantity();
        int newQuantity;

        switch (request.getType()) {
            case IN, RETURN -> newQuantity = previousQuantity + request.getQuantity();
            case OUT -> {
                if (previousQuantity < request.getQuantity()) {
                    throw new RuntimeException("Insufficient stock for item: " + item.getName());
                }
                newQuantity = previousQuantity - request.getQuantity();
            }
            case ADJUSTMENT -> newQuantity = request.getQuantity();
            default -> throw new IllegalArgumentException("Unsupported transaction type.");
        }

        item.setQuantity(newQuantity);
        itemRepository.save(item);

        StockTransaction transaction = new StockTransaction();
        transaction.setItem(item);
        transaction.setType(request.getType());
        transaction.setQuantity(request.getQuantity());
        transaction.setUnitCost(request.getUnitCost());
        transaction.setPreviousQuantity(previousQuantity);
        transaction.setNewQuantity(newQuantity);
        transaction.setReference(request.getReference());
        transaction.setUser(actor);

        StockTransaction saved = transactionRepository.save(transaction);

        try {
            Map<String, Object> details = auditService.createDetailsMap();
            details.put("transactionType", request.getType());
            details.put("quantity", request.getQuantity());
            details.put("previousQuantity", previousQuantity);
            details.put("newQuantity", newQuantity);
            details.put("reference", request.getReference());
            details.put("unitCost", request.getUnitCost());
            details.put("category", item.getCategory() != null ? item.getCategory().getName() : null);
            details.put("supplier", item.getSupplier() != null ? item.getSupplier().getName() : null);

            auditService.logAction(
                    actor,
                    switch (request.getType()) {
                        case IN -> AuditLog.ActionType.STOCK_IN;
                        case OUT -> AuditLog.ActionType.STOCK_OUT;
                        case RETURN -> AuditLog.ActionType.STOCK_RETURN;
                        case ADJUSTMENT -> AuditLog.ActionType.STOCK_ADJUSTMENT;
                        default -> throw new IllegalArgumentException("Unsupported transaction type: " + request.getType());
                    },
                    "InventoryItem",
                    item.getId(),
                    item.getName(),
                    details
            );
        } catch (Exception e) {
            // audit service handles its own logging; swallow to keep transaction flowing
        }

        return saved;
    }

    @Transactional
    public InventoryItem uploadItemImage(Long itemId, MultipartFile file) {
        if (file.isEmpty() || file.getSize() > 5 * 1024 * 1024) { // 5MB limit
            throw new RuntimeException("Invalid file: File is empty or exceeds 5MB limit.");
        }
        String contentType = file.getContentType();
        if (contentType == null || (!contentType.equals("image/jpeg") && !contentType.equals("image/png") && !contentType.equals("image/gif"))) {
            throw new RuntimeException("Invalid file type: Only JPG, PNG, and GIF are allowed.");
        }

        InventoryItem item = itemRepository.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Inventory item not found"));

        String previousImageUrl = item.getImageUrl();
        String filename = fileStorageService.storeItemImage(file);
        item.setImageUrl("/uploads/item-images/" + filename);
        InventoryItem savedItem = itemRepository.save(item);

        try {
            User actor = getAuthenticatedUser();
            if (actor != null) {
                Map<String, Object> details = auditService.createDetailsMap();
                details.put("previousImageUrl", previousImageUrl);
                details.put("newImageUrl", savedItem.getImageUrl());
                details.put("fileName", filename);
                details.put("contentType", contentType);
                details.put("fileSize", file.getSize());

                auditService.logAction(
                        actor,
                        AuditLog.ActionType.ITEM_UPDATED,
                        "InventoryItem",
                        savedItem.getId(),
                        savedItem.getName(),
                        details
                );
            }
        } catch (Exception ignored) {
            // best-effort audit logging
        }

        return savedItem;
    }

    // Method for Action 1: Receive into Stock
    @Transactional
    public void receiveGoodsIntoStock(Long itemId, Integer quantity, BigDecimal unitCost, String reference, User currentUser) {
        InventoryItem item = itemRepository.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Inventory item not found"));

        User actor = currentUser != null ? currentUser : requireAuthenticatedUser();
        int previousQuantity = item.getQuantity();
        int newQuantity = previousQuantity + quantity;
        item.setQuantity(newQuantity);
        itemRepository.save(item);

        StockTransaction transaction = new StockTransaction();
        transaction.setItem(item);
        transaction.setType(StockTransaction.TransactionType.IN);
        transaction.setQuantity(quantity);
        transaction.setUnitCost(unitCost);
        transaction.setPreviousQuantity(previousQuantity);
        transaction.setNewQuantity(newQuantity);
        transaction.setReference(reference);
        transaction.setUser(actor);

        transactionRepository.save(transaction);

        try {
            Map<String, Object> details = auditService.createDetailsMap();
            details.put("quantity", quantity);
            details.put("previousQuantity", previousQuantity);
            details.put("newQuantity", newQuantity);
            details.put("reference", reference);
            details.put("unitCost", unitCost);
            details.put("category", item.getCategory() != null ? item.getCategory().getName() : null);
            details.put("supplier", item.getSupplier() != null ? item.getSupplier().getName() : null);

            auditService.logAction(
                    actor,
                    AuditLog.ActionType.STOCK_IN,
                    "InventoryItem",
                    item.getId(),
                    item.getName(),
                    details
            );
        } catch (Exception ignored) {
            // audit failure should never block stock intake
        }
    }

    // Method for Action 2: Fulfill & Issue to Project
    @Transactional
    public void recordDirectToProjectTransaction(Long itemId, Integer quantity, BigDecimal unitCost, String reference, User currentUser) {
        InventoryItem item = itemRepository.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Inventory item not found"));

        User actor = currentUser != null ? currentUser : requireAuthenticatedUser();
        // The current quantity is the "before" and "after" for both transactions
        int currentQuantity = item.getQuantity();

        // Transaction 1: STOCK IN (Financial Record)
        StockTransaction inTransaction = new StockTransaction();
        inTransaction.setItem(item);
        inTransaction.setType(StockTransaction.TransactionType.IN);
        inTransaction.setQuantity(quantity);
        inTransaction.setUnitCost(unitCost);
        inTransaction.setPreviousQuantity(currentQuantity);
        inTransaction.setNewQuantity(currentQuantity); // Quantity does not change
        inTransaction.setReference(reference + " (Procured)");
        inTransaction.setUser(actor);
        transactionRepository.save(inTransaction);

        // Transaction 2: STOCK OUT (Operational Record)
        StockTransaction outTransaction = new StockTransaction();
        outTransaction.setItem(item);
        outTransaction.setType(StockTransaction.TransactionType.OUT);
        outTransaction.setQuantity(quantity);
        outTransaction.setUnitCost(unitCost); // Keep cost for project accounting
        outTransaction.setPreviousQuantity(currentQuantity);
        outTransaction.setNewQuantity(currentQuantity); // Quantity does not change
        outTransaction.setReference(reference + " (Issued to Project)");
        outTransaction.setUser(actor);
        transactionRepository.save(outTransaction);

        try {
            Map<String, Object> details = auditService.createDetailsMap();
            details.put("quantity", quantity);
            details.put("unitCost", unitCost);
            details.put("reference", reference);
            details.put("projectIssued", true);
            details.put("previousQuantity", currentQuantity);
            details.put("newQuantity", currentQuantity);
            details.put("doubleEntry", true);
            details.put("financialReference", inTransaction.getReference());
            details.put("operationalReference", outTransaction.getReference());
            details.put("category", item.getCategory() != null ? item.getCategory().getName() : null);
            details.put("supplier", item.getSupplier() != null ? item.getSupplier().getName() : null);

            auditService.logAction(
                    actor,
                    AuditLog.ActionType.STOCK_OUT,
                    "InventoryItem",
                    item.getId(),
                    item.getName(),
                    details
            );
        } catch (Exception ignored) {
            // audit failure should never block double-entry record
        }
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

    private User requireAuthenticatedUser() {
        User user = getAuthenticatedUser();
        if (user == null) {
            throw new RuntimeException("Authenticated user not found.");
        }
        return user;
    }
}