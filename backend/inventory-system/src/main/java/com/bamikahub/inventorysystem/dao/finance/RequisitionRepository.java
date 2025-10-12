package com.bamikahub.inventorysystem.dao.finance;

import com.bamikahub.inventorysystem.models.finance.Requisition;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RequisitionRepository extends JpaRepository<Requisition, Long> {}