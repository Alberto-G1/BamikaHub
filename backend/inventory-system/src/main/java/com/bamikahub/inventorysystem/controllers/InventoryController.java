package com.bamikahub.inventorysystem.controllers;

import com.bamikahub.inventorysystem.dao.CategoryRepository;
import com.bamikahub.inventorysystem.dao.InventoryItemRepository;
import com.bamikahub.inventorysystem.dao.StockTransactionRepository;
import com.bamikahub.inventorysystem.dao.SupplierRepository;
import com.bamikahub.inventorysystem.dto.InventoryItemRequest;
import com.bamikahub.inventorysystem.dto.StockTransactionRequest;
import com.bamikahub.inventorysystem.models.Category;
import com.bamikahub.inventorysystem.models.InventoryItem;
import com.bamikahub.inventorysystem.models.StockTransaction;
import com.bamikahub.inventorysystem.models.Supplier;
import com.bamikahub.inventorysystem.services.InventoryService;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/inventory")
@CrossOrigin(origins = "*", maxAge = 3600)
public class InventoryController {

    @Autowired private InventoryItemRepository itemRepository;
    @Autowired private SupplierRepository supplierRepository;
    @Autowired private CategoryRepository categoryRepository; // <-- INJECT CATEGORY REPOSITORY
    @Autowired private StockTransactionRepository transactionRepository;
    @Autowired private InventoryService inventoryService;

    // --- Inventory Item Endpoints ---

    @GetMapping("/items")
    @PreAuthorize("hasAuthority('ITEM_READ')")
    public List<InventoryItem> getAllItems() {
        return itemRepository.findAll();
    }

    @GetMapping("/items/{id}")
    @PreAuthorize("hasAuthority('ITEM_READ')")
    public InventoryItem getItemById(@PathVariable Long id) {
        return itemRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Item not found with id: " + id));
    }

    @PostMapping("/items")
    @PreAuthorize("hasAuthority('ITEM_CREATE')")
    public InventoryItem createItem(@RequestBody InventoryItemRequest request) {
        InventoryItem newItem = new InventoryItem();

        // Manual mapping to handle relationships
        newItem.setName(request.getName());
        newItem.setSku(request.getSku());
        newItem.setDescription(request.getDescription());
        newItem.setQuantity(request.getQuantity());
        newItem.setReorderLevel(request.getReorderLevel());
        newItem.setUnitPrice(request.getUnitPrice());
        newItem.setLocation(request.getLocation());
        newItem.setActive(request.isActive());

        // Fetch and set the Category
        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Category not found"));
        newItem.setCategory(category);

        // Fetch and set the Supplier (if provided)
        if (request.getSupplierId() != null) {
            Supplier supplier = supplierRepository.findById(request.getSupplierId()).orElse(null);
            newItem.setSupplier(supplier);
        }

        return itemRepository.save(newItem);
    }

    @PutMapping("/items/{id}")
    @PreAuthorize("hasAuthority('ITEM_UPDATE')")
    public InventoryItem updateItem(@PathVariable Long id, @RequestBody InventoryItemRequest request) {
        InventoryItem existingItem = itemRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Item not found with id: " + id));

        // Manual mapping
        existingItem.setName(request.getName());
        existingItem.setSku(request.getSku());
        existingItem.setDescription(request.getDescription());
        existingItem.setReorderLevel(request.getReorderLevel());
        existingItem.setUnitPrice(request.getUnitPrice());
        existingItem.setLocation(request.getLocation());
        existingItem.setActive(request.isActive());

        // Fetch and update the Category
        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Category not found"));
        existingItem.setCategory(category);

        // Fetch and update the Supplier (if provided)
        if (request.getSupplierId() != null) {
            Supplier supplier = supplierRepository.findById(request.getSupplierId()).orElse(null);
            existingItem.setSupplier(supplier);
        } else {
            existingItem.setSupplier(null);
        }

        return itemRepository.save(existingItem);
    }

    @DeleteMapping("/items/{id}")
    @PreAuthorize("hasAuthority('ITEM_DELETE')")
    public ResponseEntity<Void> deleteItem(@PathVariable Long id) {
        InventoryItem item = itemRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Item not found with id: " + id));

        if (item.getQuantity() > 0) {
            throw new RuntimeException("Cannot delete item with active stock. Adjust quantity to 0 first.");
        }
        item.setDeleted(true);
        item.setDeletedAt(LocalDateTime.now());
        itemRepository.save(item);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/items/{id}/image")
    @PreAuthorize("hasAuthority('ITEM_UPDATE')")
    public InventoryItem uploadItemImage(@PathVariable Long id, @RequestParam("file") MultipartFile file) {
        return inventoryService.uploadItemImage(id, file);
    }

    // --- Stock Transaction Endpoints ---

    @PostMapping("/transactions")
    @PreAuthorize("hasAuthority('ITEM_UPDATE')")
    public StockTransaction createTransaction(@RequestBody StockTransactionRequest request) {
        return inventoryService.recordStockTransaction(request);
    }

    @GetMapping("/transactions")
    @PreAuthorize("hasAuthority('ITEM_READ')")
    public List<StockTransaction> getAllTransactions() {
        return transactionRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"));
    }

    @GetMapping("/items/{id}/transactions")
    @PreAuthorize("hasAuthority('ITEM_READ')")
    public List<StockTransaction> getItemTransactions(@PathVariable Long id) {
        return transactionRepository.findByItemIdOrderByCreatedAtDesc(id);
    }
}