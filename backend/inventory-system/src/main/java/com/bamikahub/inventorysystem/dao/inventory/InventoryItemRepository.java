package com.bamikahub.inventorysystem.dao.inventory;

import com.bamikahub.inventorysystem.models.inventory.InventoryItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InventoryItemRepository extends JpaRepository<InventoryItem, Long> {
    Optional<InventoryItem> findBySku(String sku);

    @Override
    @Query("select i from InventoryItem i where i.isDeleted = false")
    List<InventoryItem> findAll();
}