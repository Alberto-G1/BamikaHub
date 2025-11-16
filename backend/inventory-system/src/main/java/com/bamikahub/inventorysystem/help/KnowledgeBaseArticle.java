package com.bamikahub.inventorysystem.help;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "knowledge_base_articles")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class KnowledgeBaseArticle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(length = 500)
    private String summary;

    @Column(length = 100)
    private String category;

    @Column(length = 200)
    private String tags; // Comma-separated tags

    @Column(nullable = false)
    private Boolean isPublished = false;

    @Column(nullable = false)
    private Integer viewCount = 0;

    @Column(nullable = false)
    private Integer helpfulCount = 0;

    @Column(nullable = false)
    private Integer notHelpfulCount = 0;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    private LocalDateTime publishedAt;

    @Column(length = 100)
    private String authorId;

    @Column(length = 100)
    private String authorName;

    @Column(length = 100)
    private String lastEditedBy;

    @Column(length = 500)
    private String featuredImageUrl;

    @Column(length = 100)
    private String slug; // URL-friendly identifier
}