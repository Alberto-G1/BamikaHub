package com.bamikahub.inventorysystem.dto.support;

import lombok.Builder;
import lombok.Value;

import java.time.LocalDateTime;

@Value
@Builder
public class CommentResponse {
    Long id;
    String comment;
    String fileUrl;
    LocalDateTime createdAt;
    Long commenterId;
    String commenterName;
    String commenterAvatarUrl;
}
