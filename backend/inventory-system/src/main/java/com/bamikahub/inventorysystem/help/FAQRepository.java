package com.bamikahub.inventorysystem.help;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FAQRepository extends JpaRepository<FAQ, Long> {

    List<FAQ> findByIsActiveTrueOrderByDisplayOrderAsc();

    List<FAQ> findByCategoryAndIsActiveTrueOrderByDisplayOrderAsc(String category);

    @Query("SELECT f FROM FAQ f WHERE f.isActive = true AND LOWER(f.question) LIKE LOWER(CONCAT('%', :searchTerm, '%')) ORDER BY f.displayOrder ASC")
    List<FAQ> searchFAQs(@Param("searchTerm") String searchTerm);

    List<FAQ> findByCategoryOrderByDisplayOrderAsc(String category);

    @Query("SELECT DISTINCT f.category FROM FAQ f WHERE f.isActive = true ORDER BY f.category")
    List<String> findDistinctCategories();
}