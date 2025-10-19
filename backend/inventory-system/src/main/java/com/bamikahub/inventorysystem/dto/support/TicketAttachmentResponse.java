package com.bamikahub.inventorysystem.dto.support;

import lombok.Builder;
import lombok.Value;

import java.time.LocalDateTime;

@Value
@Builder
public class TicketAttachmentResponse {
    Long id;
    String originalFilename;
    String fileUrl;
    LocalDateTime uploadedAt;
    Long uploadedById;
    String uploadedByName;
}
