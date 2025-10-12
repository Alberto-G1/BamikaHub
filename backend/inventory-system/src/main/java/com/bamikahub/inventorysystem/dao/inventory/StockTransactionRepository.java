package com.bamikahub.inventorysystem.dao.inventory;

import com.bamikahub.inventorysystem.models.inventory.StockTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface StockTransactionRepository extends JpaRepository<StockTransaction, Long> {
    List<StockTransaction> findByItemIdOrderByCreatedAtDesc(Long itemId);
}