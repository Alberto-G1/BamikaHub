package com.bamikahub.inventorysystem.controllers.chat;

import com.bamikahub.inventorysystem.dao.chat.ChatAttachmentRepository;
import com.bamikahub.inventorysystem.dao.chat.ChatAuditLogRepository;
import com.bamikahub.inventorysystem.dto.chat.*;
import com.bamikahub.inventorysystem.models.chat.ChatAttachment;
import com.bamikahub.inventorysystem.models.chat.ChatAuditLog;
import com.bamikahub.inventorysystem.models.chat.ChatAuditLog.AuditAction;
import com.bamikahub.inventorysystem.models.user.User;
import com.bamikahub.inventorysystem.services.chat.ChatService;
import com.bamikahub.inventorysystem.services.chat.ChatPresenceService;
import com.bamikahub.inventorysystem.dao.user.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.FileSystemResource;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatRestController {

    private final ChatService chatService;
    private final ChatAttachmentRepository attachmentRepository;
    private final ChatAuditLogRepository auditLogRepository;
    private final UserRepository userRepository;
    private final ChatPresenceService presenceService;

    @PostMapping(value = "/messages", consumes = {"multipart/form-data"})
    public ResponseEntity<ChatMessageDTO> sendMessage(@RequestPart("payload") @Valid SendMessageRequest request,
                                                      @RequestPart(value = "file", required = false) MultipartFile file) {
        ChatMessageDTO dto = chatService.sendMessage(request, file);
        return ResponseEntity.status(HttpStatus.CREATED).body(dto);
    }

    @GetMapping("/threads")
    public ResponseEntity<List<ChatThreadDTO>> getThreads(@RequestParam Long userId) {
        return ResponseEntity.ok(chatService.getThreadsForUser(userId));
    }

    @GetMapping("/users")
    public ResponseEntity<List<ChatUserDTO>> listUsers(@RequestParam(required = false) Long excludeUserId) {
        List<User> users = userRepository.findAll();
        List<ChatUserDTO> dtos = users.stream()
                .filter(u -> excludeUserId == null || !u.getId().equals(excludeUserId))
                .map(u -> ChatUserDTO.builder()
                        .id(u.getId())
                        .fullName(u.getFullName())
                        .email(u.getEmail())
                        .online(presenceService.getPresence(u.getId()).isOnline())
            .avatar(u.getProfilePictureUrl())
                        .build())
                .toList();
        return ResponseEntity.ok(dtos);
    }

    @PostMapping("/threads/private")
    public ResponseEntity<ChatThreadDTO> createOrFetchPrivate(@RequestBody @Valid CreatePrivateThreadRequest request) {
        ChatThreadDTO dto = chatService.ensurePrivateThreadDto(request.getSenderId(), request.getRecipientId());
        return ResponseEntity.status(HttpStatus.CREATED).body(dto);
    }

    @GetMapping("/threads/{threadId}/messages")
    public ResponseEntity<List<ChatMessageDTO>> getMessages(@PathVariable Long threadId,
                                                            @RequestParam(defaultValue = "0") int page,
                                                            @RequestParam(defaultValue = "50") int size) {
        return ResponseEntity.ok(chatService.getRecentMessages(threadId, page, size));
    }

    @PostMapping("/threads/{threadId}/read")
    public ResponseEntity<List<ChatMessageDTO>> markThreadRead(@PathVariable Long threadId,
                                                               @RequestBody @Valid MarkThreadReadRequest request) {
        return ResponseEntity.ok(chatService.markThreadRead(threadId, request.getUserId(), request.getLastMessageId()));
    }

    @GetMapping("/attachments/{id}")
    public ResponseEntity<FileSystemResource> downloadAttachment(@PathVariable Long id) {
        ChatAttachment attachment = attachmentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Attachment not found"));
        FileSystemResource resource = new FileSystemResource(attachment.getStoragePath());
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + attachment.getFileName())
                .header(HttpHeaders.CONTENT_TYPE, attachment.getContentType())
                .body(resource);
    }

    @GetMapping("/audit")
    @PreAuthorize("hasAuthority('CHAT_AUDIT_VIEW') or hasRole('Admin')")
    public ResponseEntity<List<ChatAuditLog>> getAuditLogs(@RequestParam(required = false) AuditAction action,
                                                           @RequestParam(required = false) String channel,
                                                           @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
                                                           @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to) {
        return ResponseEntity.ok(auditLogRepository.findByFilters(action, channel, from, to));
    }
}
