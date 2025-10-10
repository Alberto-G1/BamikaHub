package com.bamikahub.inventorysystem.dao;

import com.bamikahub.inventorysystem.models.StockTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface StockTransactionRepository extends JpaRepository<StockTransaction, Long> {}