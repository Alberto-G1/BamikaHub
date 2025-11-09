package com.bamikahub.inventorysystem.services.chat;

import com.bamikahub.inventorysystem.dao.chat.*;
import com.bamikahub.inventorysystem.dao.user.UserRepository;
import com.bamikahub.inventorysystem.dto.chat.ChatAttachmentDTO;
import com.bamikahub.inventorysystem.dto.chat.ChatMessageDTO;
import com.bamikahub.inventorysystem.dto.chat.ChatThreadDTO;
import com.bamikahub.inventorysystem.dto.chat.ChatThreadParticipantDTO;
import com.bamikahub.inventorysystem.dto.chat.SendMessageRequest;
import com.bamikahub.inventorysystem.models.chat.*;
import com.bamikahub.inventorysystem.models.chat.ChatMessage.MessageType;
import com.bamikahub.inventorysystem.models.chat.ChatThread.ThreadType;
import com.bamikahub.inventorysystem.models.user.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatService {

    private static final long MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

    private final ChatThreadRepository threadRepository;
    private final ChatMessageRepository messageRepository;
    private final ChatAttachmentRepository attachmentRepository;
    private final ChatNotificationRepository notificationRepository;
    private final UserRepository userRepository;

    private final ChatAuditService auditService;
    private final ChatNotificationService notificationService;
    private final ChatPresenceService presenceService;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public ChatThread ensureGeneralThread() {
        return threadRepository.findGeneralThread().orElseGet(() -> {
            ChatThread thread = ChatThread.builder()
                    .type(ThreadType.GENERAL)
                    .subject("Company General Chat")
                    .build();
            return threadRepository.save(thread);
        });
    }

    @Transactional
    public ChatThread getOrCreatePrivateThread(Long senderId, Long recipientId) {
        return threadRepository.findPrivateThreadBetween(senderId, recipientId).orElseGet(() -> {
            User sender = userRepository.findById(senderId)
                    .orElseThrow(() -> new IllegalArgumentException("Sender not found"));
            User recipient = userRepository.findById(recipientId)
                    .orElseThrow(() -> new IllegalArgumentException("Recipient not found"));
            ChatThread thread = ChatThread.builder()
                    .type(ThreadType.PRIVATE)
                    .build();
            thread.getParticipants().add(sender);
            thread.getParticipants().add(recipient);
            return threadRepository.save(thread);
        });
    }

    @Transactional
    public ChatMessageDTO sendMessage(SendMessageRequest request, MultipartFile attachmentFile) {
        ChatThread thread;
        if (request.isGeneral()) {
            thread = ensureGeneralThread();
        } else if (request.getThreadId() != null) {
            thread = threadRepository.findById(request.getThreadId())
                    .orElseThrow(() -> new IllegalArgumentException("Thread not found"));
        } else {
            if (request.getRecipientId() == null) {
                throw new IllegalArgumentException("Recipient is required for new private chat");
            }
            thread = getOrCreatePrivateThread(request.getSenderId(), request.getRecipientId());
        }

        User sender = userRepository.findById(request.getSenderId())
                .orElseThrow(() -> new IllegalArgumentException("Sender not found"));

        if ((request.getContent() == null || request.getContent().isBlank())
                && (attachmentFile == null || attachmentFile.isEmpty())) {
            throw new IllegalArgumentException("Message content or attachment is required");
        }

    ChatMessage message = new ChatMessage();
    message.setThread(thread);
    message.setSender(sender);
    message.setMessageType(MessageType.TEXT);
    message.setContent(request.getContent() != null ? request.getContent().trim() : null);

        if (attachmentFile != null && !attachmentFile.isEmpty()) {
            if (attachmentFile.getSize() > MAX_FILE_SIZE_BYTES) {
                throw new IllegalArgumentException("Attachment exceeds 5MB limit");
            }
            message.setMessageType(MessageType.FILE);
            ChatAttachment attachment = storeAttachment(attachmentFile);
            message.setAttachment(attachment);
        }

        ChatMessage saved = messageRepository.save(message);
        thread.setLastMessageAt(LocalDateTime.now());
        threadRepository.save(thread);

        auditService.logMessageSent(thread, saved);
        if (saved.isAttachmentMessage()) {
            auditService.logAttachmentUploaded(saved);
        }

        broadcastMessage(saved);
        dispatchNotifications(thread, saved);

        return toDto(saved);
    }

    @Transactional
    public void deleteMessage(Long messageId, Long actorId, boolean adminOverride) {
        ChatMessage message = messageRepository.findById(messageId)
                .orElseThrow(() -> new IllegalArgumentException("Message not found"));
        User actor = userRepository.findById(actorId)
                .orElseThrow(() -> new IllegalArgumentException("Actor not found"));

        boolean canDeleteOwn = Objects.equals(message.getSender().getId(), actorId) && message.getThread().isPrivateThread();
        boolean canAdminDelete = adminOverride;

        if (!canDeleteOwn && !canAdminDelete) {
            throw new IllegalStateException("Not allowed to delete this message");
        }

        message.setDeleted(true);
        message.setDeletedAt(LocalDateTime.now());
        message.setDeletedBy(actor);
        messageRepository.save(message);
        auditService.logMessageDeleted(actor, message.getThread(), message);

        messagingTemplate.convertAndSend(destinationForThread(message.getThread()), toDto(message));
    }

    @Transactional
    public List<ChatThreadDTO> getThreadsForUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        List<ChatThread> privateThreads = threadRepository.findByParticipantAndType(user, ThreadType.PRIVATE);
        ChatThread generalThread = ensureGeneralThread();
        List<ChatThreadDTO> response = new ArrayList<>();
    response.add(toThreadDto(generalThread, userId));
    response.addAll(privateThreads.stream()
        .map(thread -> toThreadDto(thread, userId))
                .collect(Collectors.toList()));
        return response;
    }

    @Transactional(readOnly = true)
    public List<ChatMessageDTO> getRecentMessages(Long threadId, int page, int size) {
        ChatThread thread = threadRepository.findById(threadId)
                .orElseThrow(() -> new IllegalArgumentException("Thread not found"));
    return messageRepository.findByThreadOrderBySentAtDesc(thread, PageRequest.of(page, size))
        .stream()
        .map(this::toDto)
        .collect(Collectors.toList());
    }

    private void broadcastMessage(ChatMessage message) {
        ChatMessageDTO dto = toDto(message);
        messagingTemplate.convertAndSend(destinationForThread(message.getThread()), dto);
    }

    private void dispatchNotifications(ChatThread thread, ChatMessage message) {
        if (thread.isGeneralThread()) {
            notificationService.notifyGeneralAnnouncement(thread, message);
        } else {
            thread.getParticipants().stream()
                    .filter(u -> !u.getId().equals(message.getSender().getId()))
                    .forEach(recipient -> notificationService.notifyPrivateMessage(thread, message, recipient));
        }
    }

    private String destinationForThread(ChatThread thread) {
        return thread.isGeneralThread() ? "/topic/general" : "/queue/thread." + thread.getId();
    }

    private ChatMessageDTO toDto(ChatMessage message) {
        Set<Long> recipientIds = message.getThread().getParticipants().stream()
                .map(User::getId)
                .filter(id -> !id.equals(message.getSender().getId()))
                .collect(Collectors.toSet());

        return ChatMessageDTO.builder()
                .id(message.getId())
                .threadId(message.getThread().getId())
                .senderId(message.getSender().getId())
                .senderName(message.getSender().getFullName())
        .senderAvatar(message.getSender().getProfilePictureUrl())
                .content(message.isDeleted() ? null : message.getContent())
                .messageType(message.getMessageType().name())
                .attachment(message.getAttachment() != null ? ChatAttachmentDTO.builder()
                        .id(message.getAttachment().getId())
                        .fileName(message.getAttachment().getFileName())
                        .contentType(message.getAttachment().getContentType())
                        .fileSize(message.getAttachment().getFileSize())
                        .downloadUrl("/api/chat/attachments/" + message.getAttachment().getId())
                        .build() : null)
                .sentAt(message.getSentAt())
                .deliveredAt(message.getDeliveredAt())
                .readAt(message.getReadAt())
                .deleted(message.isDeleted())
                .recipients(recipientIds)
                .build();
    }

    private ChatThreadDTO toThreadDto(ChatThread thread, Long currentUserId) {
        Set<ChatThreadParticipantDTO> participants = thread.getParticipants().stream()
                .map(user -> ChatThreadParticipantDTO.builder()
                        .id(user.getId())
                        .fullName(user.getFullName())
                        .online(presenceService.getPresence(user.getId()).isOnline())
                        .avatar(user.getProfilePictureUrl())
                        .build())
                .collect(Collectors.toSet());

        long unread = 0;
        if (currentUserId != null) {
            unread = notificationRepository.countByRecipientIdAndThreadIdAndReadFalse(currentUserId, thread.getId());
        }

        return ChatThreadDTO.builder()
                .id(thread.getId())
                .type(thread.getType().name())
                .subject(thread.getSubject())
                .participants(participants)
                .lastMessageAt(thread.getLastMessageAt())
                .unreadCount(unread)
                .build();
    }

    @Transactional
    public ChatThreadDTO ensurePrivateThreadDto(Long senderId, Long recipientId) {
        ChatThread thread = getOrCreatePrivateThread(senderId, recipientId);
        return toThreadDto(thread, senderId);
    }

    @Transactional
    public List<ChatMessageDTO> markThreadRead(Long threadId, Long userId, Long lastMessageId) {
        if (lastMessageId == null) {
            return List.of();
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        ChatThread thread = threadRepository.findById(threadId)
                .orElseThrow(() -> new IllegalArgumentException("Thread not found"));

        List<ChatNotification> notifications = notificationRepository
                .findByRecipientAndThreadIdAndReadFalseAndMessageIdLessThanEqual(user, threadId, lastMessageId);

        if (notifications.isEmpty()) {
            return List.of();
        }

        LocalDateTime now = LocalDateTime.now();
        Map<Long, ChatMessage> messageMap = new HashMap<>();

        notifications.forEach(notification -> {
            notification.setDelivered(true);
            if (notification.getDeliveredAt() == null) {
                notification.setDeliveredAt(now);
            }
            notification.setRead(true);
            notification.setReadAt(now);
            if (notification.getMessageId() != null && !messageMap.containsKey(notification.getMessageId())) {
                messageRepository.findById(notification.getMessageId())
                        .ifPresent(message -> messageMap.put(notification.getMessageId(), message));
            }
        });

        notificationRepository.saveAll(notifications);

        List<ChatMessageDTO> updatedMessages = new ArrayList<>();
        for (ChatMessage message : messageMap.values()) {
            if (message.getDeliveredAt() == null) {
                message.setDeliveredAt(now);
            }
            if (!notificationRepository.existsByMessageIdAndReadFalse(message.getId())) {
                message.setReadAt(now);
            }
            messageRepository.save(message);
            ChatMessageDTO dto = toDto(message);
            updatedMessages.add(dto);
            messagingTemplate.convertAndSend(destinationForThread(thread), dto);
        }

        return updatedMessages;
    }

    private ChatAttachment storeAttachment(MultipartFile file) {
        try {
            Path uploadDir = Paths.get("uploads", "chat");
            if (Files.notExists(uploadDir)) {
                Files.createDirectories(uploadDir);
            }
            String originalName = file.getOriginalFilename();
            if (originalName == null || originalName.isBlank()) {
                originalName = "attachment";
            } else {
                originalName = originalName.replaceAll("[\\\\/]+", "");
                if (originalName.isBlank()) {
                    originalName = "attachment";
                }
            }
            String fileName = System.currentTimeMillis() + "_" + originalName;
            Path filePath = uploadDir.resolve(fileName);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
            ChatAttachment attachment = ChatAttachment.builder()
                    .fileName(originalName)
                    .contentType(file.getContentType())
                    .fileSize(file.getSize())
                    .storagePath(filePath.toString())
                    .build();
            return attachmentRepository.save(attachment);
        } catch (IOException e) {
            throw new IllegalStateException("Failed to store attachment", e);
        }
    }
}
