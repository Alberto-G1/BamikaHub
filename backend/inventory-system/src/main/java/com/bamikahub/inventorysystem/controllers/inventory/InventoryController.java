package com.bamikahub.inventorysystem.controllers.inventory;

import com.bamikahub.inventorysystem.dao.inventory.InventoryItemRepository;
import com.bamikahub.inventorysystem.dao.inventory.StockTransactionRepository;
import com.bamikahub.inventorysystem.dto.inventory.InventoryItemRequest;
import com.bamikahub.inventorysystem.dto.inventory.StockTransactionRequest;
import com.bamikahub.inventorysystem.models.inventory.InventoryItem;
import com.bamikahub.inventorysystem.models.inventory.StockTransaction;
import com.bamikahub.inventorysystem.services.inventory.InventoryService;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import jakarta.validation.Valid;

import java.util.List;

@RestController
@RequestMapping("/api/inventory")
@CrossOrigin(origins = "*", maxAge = 3600)
public class InventoryController {

    @Autowired private InventoryItemRepository itemRepository;
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
    public InventoryItem createItem(@Valid @RequestBody InventoryItemRequest request) {
        return inventoryService.createItem(request);
    }

    @PutMapping("/items/{id}")
    @PreAuthorize("hasAuthority('ITEM_UPDATE')")
    public InventoryItem updateItem(@PathVariable Long id, @Valid @RequestBody InventoryItemRequest request) {
        return inventoryService.updateItem(id, request);
    }

    @DeleteMapping("/items/{id}")
    @PreAuthorize("hasAuthority('ITEM_DELETE')")
    public ResponseEntity<Void> deleteItem(@PathVariable Long id) {
        inventoryService.deleteItem(id);
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
    public StockTransaction createTransaction(@Valid @RequestBody StockTransactionRequest request) {
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