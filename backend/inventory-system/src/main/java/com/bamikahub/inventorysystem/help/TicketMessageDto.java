package com.bamikahub.inventorysystem.help;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TicketMessageDto {

    private Long id;
    private Long ticketId;
    private String senderId;
    private String senderName;
    private String message;
    private TicketMessage.MessageType messageType;
    private Boolean isInternal;
    private LocalDateTime createdAt;
    private String attachmentUrl;
    private String attachmentName;
}