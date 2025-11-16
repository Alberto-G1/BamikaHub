package com.bamikahub.inventorysystem.help;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FAQDto {

    private Long id;
    private String question;
    private String answer;
    private String category;
    private Integer displayOrder;
    private Boolean isActive;
    private Integer viewCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String createdBy;
    private String updatedBy;
}