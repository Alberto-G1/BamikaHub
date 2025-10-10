package com.bamikahub.inventorysystem.controllers;

import com.bamikahub.inventorysystem.dao.InventoryItemRepository;
import com.bamikahub.inventorysystem.dao.SupplierRepository;
import com.bamikahub.inventorysystem.dto.InventoryItemRequest;
import com.bamikahub.inventorysystem.dto.StockTransactionRequest;
import com.bamikahub.inventorysystem.models.InventoryItem;
import com.bamikahub.inventorysystem.models.StockTransaction;
import com.bamikahub.inventorysystem.models.Supplier;
import com.bamikahub.inventorysystem.services.InventoryService;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.web.bind.annotation.*;
import com.bamikahub.inventorysystem.dao.StockTransactionRepository;
import com.bamikahub.inventorysystem.models.StockTransaction;
import org.springframework.data.domain.Sort;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/inventory")
@CrossOrigin(origins = "*", maxAge = 3600)
public class InventoryController {

    @Autowired private InventoryItemRepository itemRepository;
    @Autowired private InventoryService inventoryService;
    @Autowired private SupplierRepository supplierRepository;
    @Autowired private StockTransactionRepository transactionRepository;

    // CRUD for Inventory Items
    @GetMapping("/items")
    @PreAuthorize("hasAuthority('ITEM_READ')")
    public List<InventoryItem> getAllItems() {
        return itemRepository.findAll();
    }

    @PostMapping("/items")
    @PreAuthorize("hasAuthority('ITEM_CREATE')")
    public InventoryItem createItem(@RequestBody InventoryItemRequest request) {
        InventoryItem newItem = new InventoryItem();
        // Copy basic properties
        BeanUtils.copyProperties(request, newItem, "supplierId");

        if (request.getSupplierId() != null) {
            Supplier supplier = supplierRepository.findById(request.getSupplierId()).orElse(null);
            newItem.setSupplier(supplier);
        }
        return itemRepository.save(newItem);
    }

    @GetMapping("/items/{id}")
    @PreAuthorize("hasAuthority('ITEM_READ')")
    public InventoryItem getItemById(@PathVariable Long id) {
        return itemRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Item not found with id: " + id));
    }

    @PutMapping("/items/{id}")
    @PreAuthorize("hasAuthority('ITEM_UPDATE')")
    public InventoryItem updateItem(@PathVariable Long id, @RequestBody InventoryItemRequest request) {
        InventoryItem existingItem = itemRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Item not found with id: " + id));

        // Manually map fields to avoid overwriting quantity and to handle supplier
        existingItem.setName(request.getName());
        existingItem.setSku(request.getSku());
        existingItem.setCategory(request.getCategory());
        existingItem.setDescription(request.getDescription());
        existingItem.setReorderLevel(request.getReorderLevel());
        existingItem.setUnitPrice(request.getUnitPrice());
        existingItem.setLocation(request.getLocation());
        existingItem.setActive(request.isActive());

        if (request.getSupplierId() != null) {
            Supplier supplier = supplierRepository.findById(request.getSupplierId()).orElse(null);
            existingItem.setSupplier(supplier);
        } else {
            existingItem.setSupplier(null);
        }

        return itemRepository.save(existingItem);
    }

    // Stock Transactions
    @PostMapping("/transactions")
    @PreAuthorize("hasAuthority('ITEM_UPDATE')") // Reuse permission
    public StockTransaction createTransaction(@RequestBody StockTransactionRequest request) {
        return inventoryService.recordStockTransaction(request);
    }

    @DeleteMapping("/items/{id}")
    @PreAuthorize("hasAuthority('ITEM_DELETE')")
    public ResponseEntity<Void> deleteItem(@PathVariable Long id) {
        InventoryItem item = itemRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Item not found with id: " + id));

        // Business Rule: Can't delete item if it has stock
        if (item.getQuantity() > 0) {
            throw new RuntimeException("Cannot delete item with active stock. Adjust quantity to 0 first.");
        }

        item.setDeleted(true);
        item.setDeletedAt(LocalDateTime.now());
        itemRepository.save(item);

        return ResponseEntity.ok().build();
    }

    @GetMapping("/transactions")
    @PreAuthorize("hasAuthority('ITEM_READ')") // Reading transactions requires read permission
    public List<StockTransaction> getAllTransactions() {
        // Return transactions sorted by newest first
        return transactionRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"));
    }
}