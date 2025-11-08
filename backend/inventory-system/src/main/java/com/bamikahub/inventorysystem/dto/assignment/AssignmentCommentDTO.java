package com.bamikahub.inventorysystem.dto.assignment;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AssignmentCommentDTO {
    private Long id;

    @NotBlank(message = "Comment cannot be empty")
    private String comment;

    private Long userId;
    private String userName;
    private String userProfilePicture;
    private String createdAt;
}
