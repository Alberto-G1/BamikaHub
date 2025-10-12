package com.bamikahub.inventorysystem.dao;

import com.bamikahub.inventorysystem.models.Requisition;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RequisitionRepository extends JpaRepository<Requisition, Long> {}