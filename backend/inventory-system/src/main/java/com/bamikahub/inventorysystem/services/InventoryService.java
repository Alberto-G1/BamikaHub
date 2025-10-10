package com.bamikahub.inventorysystem.services;

import com.bamikahub.inventorysystem.dao.*;
import com.bamikahub.inventorysystem.dto.StockTransactionRequest;
import com.bamikahub.inventorysystem.models.*;
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
}