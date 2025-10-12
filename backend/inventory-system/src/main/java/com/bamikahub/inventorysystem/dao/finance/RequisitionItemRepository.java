package com.bamikahub.inventorysystem.dao.finance;

import com.bamikahub.inventorysystem.models.finance.RequisitionItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RequisitionItemRepository extends JpaRepository<RequisitionItem, Long> {}