package com.bamikahub.inventorysystem.dao.inventory;

import com.bamikahub.inventorysystem.models.inventory.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {}