package com.bamikahub.inventorysystem.help;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class KnowledgeBaseArticleDto {

    private Long id;
    private String title;
    private String content;
    private String summary;
    private String category;
    private String tags;
    private Boolean isPublished;
    private Integer viewCount;
    private Integer helpfulCount;
    private Integer notHelpfulCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime publishedAt;
    private String authorId;
    private String authorName;
    private String lastEditedBy;
    private String featuredImageUrl;
    private String slug;
}