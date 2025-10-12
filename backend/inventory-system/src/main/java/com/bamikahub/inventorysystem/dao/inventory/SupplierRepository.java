package com.bamikahub.inventorysystem.dao.inventory;

import com.bamikahub.inventorysystem.models.inventory.Supplier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SupplierRepository extends JpaRepository<Supplier, Long> {}