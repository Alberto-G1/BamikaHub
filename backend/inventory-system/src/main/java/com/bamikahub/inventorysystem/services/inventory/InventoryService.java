package com.bamikahub.inventorysystem.services.inventory;

import com.bamikahub.inventorysystem.dao.inventory.InventoryItemRepository;
import com.bamikahub.inventorysystem.dao.inventory.StockTransactionRepository;
import com.bamikahub.inventorysystem.dao.user.UserRepository;
import com.bamikahub.inventorysystem.dto.inventory.StockTransactionRequest;
import com.bamikahub.inventorysystem.models.inventory.InventoryItem;
import com.bamikahub.inventorysystem.models.inventory.StockTransaction;
import com.bamikahub.inventorysystem.models.user.User;
import com.bamikahub.inventorysystem.services.FileStorageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;

@Service
public class InventoryService {

    @Autowired private InventoryItemRepository itemRepository;
    @Autowired private StockTransactionRepository transactionRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private FileStorageService fileStorageService;

    @Transactional
    public StockTransaction recordStockTransaction(StockTransactionRequest request) {
        InventoryItem item = itemRepository.findById(request.getItemId())
                .orElseThrow(() -> new RuntimeException("Inventory item not found"));

        String currentUserEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new RuntimeException("Current user not found."));

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
        transaction.setUser(currentUser);

        return transactionRepository.save(transaction);
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

        String filename = fileStorageService.storeItemImage(file);
        item.setImageUrl("/uploads/item-images/" + filename);
        return itemRepository.save(item);
    }

    // Method for Action 1: Receive into Stock
    @Transactional
    public void receiveGoodsIntoStock(Long itemId, Integer quantity, BigDecimal unitCost, String reference, User currentUser) {
        InventoryItem item = itemRepository.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Inventory item not found"));

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
        transaction.setUser(currentUser);

        transactionRepository.save(transaction);
    }

    // Method for Action 2: Fulfill & Issue to Project
    @Transactional
    public void recordDirectToProjectTransaction(Long itemId, Integer quantity, BigDecimal unitCost, String reference, User currentUser) {
        InventoryItem item = itemRepository.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Inventory item not found"));

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
        inTransaction.setUser(currentUser);
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
        outTransaction.setUser(currentUser);
        transactionRepository.save(outTransaction);
    }
}