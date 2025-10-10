package com.bamikahub.inventorysystem.dao;

import com.bamikahub.inventorysystem.models.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {}