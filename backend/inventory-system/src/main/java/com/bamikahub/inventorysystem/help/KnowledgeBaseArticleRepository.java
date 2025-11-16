package com.bamikahub.inventorysystem.help;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface KnowledgeBaseArticleRepository extends JpaRepository<KnowledgeBaseArticle, Long> {

    Page<KnowledgeBaseArticle> findByIsPublishedTrueOrderByCreatedAtDesc(Pageable pageable);

    Page<KnowledgeBaseArticle> findByCategoryAndIsPublishedTrueOrderByCreatedAtDesc(String category, Pageable pageable);

    @Query("SELECT DISTINCT k.category FROM KnowledgeBaseArticle k WHERE k.isPublished = true ORDER BY k.category")
    List<String> findDistinctCategories();

    @Query("SELECT k FROM KnowledgeBaseArticle k WHERE k.isPublished = true AND (LOWER(k.title) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR LOWER(k.content) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR LOWER(k.tags) LIKE LOWER(CONCAT('%', :searchTerm, '%'))) ORDER BY k.viewCount DESC")
    Page<KnowledgeBaseArticle> searchArticles(@Param("searchTerm") String searchTerm, Pageable pageable);

    List<KnowledgeBaseArticle> findTop10ByIsPublishedTrueOrderByViewCountDesc();

    @Query("SELECT k FROM KnowledgeBaseArticle k WHERE k.slug = :slug AND k.isPublished = true")
    KnowledgeBaseArticle findBySlug(@Param("slug") String slug);
}