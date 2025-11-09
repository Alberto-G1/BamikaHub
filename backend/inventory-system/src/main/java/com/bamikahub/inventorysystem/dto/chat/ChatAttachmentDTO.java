package com.bamikahub.inventorysystem.dto.chat;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ChatAttachmentDTO {
    private Long id;
    private String fileName;
    private String contentType;
    private long fileSize;
    private String downloadUrl;
}
