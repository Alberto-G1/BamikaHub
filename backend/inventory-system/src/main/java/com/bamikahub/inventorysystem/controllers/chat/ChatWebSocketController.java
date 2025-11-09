package com.bamikahub.inventorysystem.controllers.chat;

import com.bamikahub.inventorysystem.dto.chat.ChatMessageDTO;
import com.bamikahub.inventorysystem.dto.chat.DeleteMessageRequest;
import com.bamikahub.inventorysystem.dto.chat.PresenceUpdate;
import com.bamikahub.inventorysystem.dto.chat.SendMessageRequest;
import com.bamikahub.inventorysystem.services.chat.ChatPresenceService;
import com.bamikahub.inventorysystem.services.chat.ChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.annotation.SendToUser;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;

@Slf4j
@Controller
@RequiredArgsConstructor
public class ChatWebSocketController {

    private final ChatService chatService;
    private final ChatPresenceService presenceService;

    @MessageMapping("/chat/send")
    @SendToUser("/queue/ack")
    public ChatMessageDTO sendMessage(@Payload @Valid SendMessageRequest request) {
        ChatMessageDTO dto = chatService.sendMessage(request, null);
        return dto;
    }

    @MessageMapping("/chat/delete")
    public void deleteMessage(@Payload @Valid DeleteMessageRequest request,
                              @Header(name = "x-chat-admin", required = false) Boolean adminOverride) {
        chatService.deleteMessage(request.getMessageId(), request.getActorId(), Boolean.TRUE.equals(adminOverride));
    }

    @MessageMapping("/chat/presence")
    public void updatePresence(@Payload PresenceUpdate update) {
        if (update == null || update.getUserId() == null) {
            return;
        }
        if (update.isOnline()) {
            presenceService.markOnline(update.getUserId());
        } else {
            presenceService.markOffline(update.getUserId());
        }
    }
}
