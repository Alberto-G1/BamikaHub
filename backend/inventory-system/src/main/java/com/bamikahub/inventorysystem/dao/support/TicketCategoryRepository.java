package com.bamikahub.inventorysystem.dao.support;

import com.bamikahub.inventorysystem.models.support.TicketCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TicketCategoryRepository extends JpaRepository<TicketCategory, Integer> {
    Optional<TicketCategory> findByName(String name);
}