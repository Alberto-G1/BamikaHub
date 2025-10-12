package com.bamikahub.inventorysystem.services;

import com.bamikahub.inventorysystem.dao.inventory.InventoryItemRepository;
import com.bamikahub.inventorysystem.dao.inventory.SupplierRepository;
import com.bamikahub.inventorysystem.dao.user.UserRepository;
import com.bamikahub.inventorysystem.dto.DashboardSummaryDto;
import com.bamikahub.inventorysystem.models.inventory.InventoryItem;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
public class DashboardService {

    @Autowired private UserRepository userRepository;
    @Autowired private SupplierRepository supplierRepository;
    @Autowired private InventoryItemRepository itemRepository;

    public DashboardSummaryDto getDashboardSummary() {
        DashboardSummaryDto summary = new DashboardSummaryDto();

        // User Stats
        summary.setTotalUsers(userRepository.count());
//        summary.setPendingUsers(userRepository.findByStatusName("PENDING").size());

        // Supplier Stats
        summary.setTotalSuppliers(supplierRepository.count());

        // Inventory Stats
        List<InventoryItem> allItems = itemRepository.findAll();
        summary.setTotalItems(allItems.size());

        long lowStockCount = allItems.stream()
                .filter(item -> item.getQuantity() <= item.getReorderLevel())
                .count();
        summary.setLowStockItems(lowStockCount);

        BigDecimal totalValue = allItems.stream()
                .map(item -> item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        summary.setTotalStockValue(totalValue);

        return summary;
    }
}