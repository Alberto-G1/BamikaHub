package com.bamikahub.inventorysystem.dto.motivation;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class AwardDTO {
    private Long id;
    private Long userId;
    private String userName;
    private String achievementTitle;
    private String achievementDescription;
    private String displayImageUrl; // custom display image if provided
    private String profilePictureUrl; // fallback source
    private List<String> badges;
    private Integer priority;
    private LocalDateTime awardDate;
    private LocalDateTime expiresAt;
}
