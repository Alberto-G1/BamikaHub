package com.bamikahub.inventorysystem.services;

import com.bamikahub.inventorysystem.dao.*;
import com.bamikahub.inventorysystem.dto.StockTransactionRequest;
import com.bamikahub.inventorysystem.models.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class InventoryService {

    @Autowired private InventoryItemRepository itemRepository;
    @Autowired private StockTransactionRepository transactionRepository;
    @Autowired private UserRepository userRepository;

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
            case IN:
            case RETURN:
                newQuantity = previousQuantity + request.getQuantity();
                break;
            case OUT:
                if (previousQuantity < request.getQuantity()) {
                    throw new RuntimeException("Insufficient stock for item: " + item.getName());
                }
                newQuantity = previousQuantity - request.getQuantity();
                break;
            case ADJUSTMENT:
                // For adjustments, the request quantity is the new total quantity
                newQuantity = request.getQuantity();
                break;
            default:
                throw new IllegalArgumentException("Unsupported transaction type.");
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
}