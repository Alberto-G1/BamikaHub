package com.bamikahub.inventorysystem.services.chat;

import com.bamikahub.inventorysystem.dao.chat.ChatNotificationRepository;
import com.bamikahub.inventorysystem.dao.chat.ChatMessageRepository;
import com.bamikahub.inventorysystem.dao.user.UserRepository;
import com.bamikahub.inventorysystem.models.chat.ChatMessage;
import com.bamikahub.inventorysystem.models.chat.ChatNotification;
import com.bamikahub.inventorysystem.models.chat.ChatThread;
import com.bamikahub.inventorysystem.models.user.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatNotificationService {

    private final ChatNotificationRepository notificationRepository;
    private final ChatMessageRepository messageRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public void notifyPrivateMessage(ChatThread thread, ChatMessage message, User recipient) {
        ChatNotification notification = ChatNotification.builder()
                .type(ChatNotification.NotificationType.PRIVATE_MESSAGE)
                .recipient(recipient)
                .threadId(thread.getId())
                .messageId(message.getId())
        .payload(message.isAttachmentMessage() && message.getAttachment() != null
            ? message.getAttachment().getFileName()
            : message.getContent())
                .delivered(false)
                .read(false)
                .build();
    notificationRepository.save(notification);
    dispatch(notification, recipient.getId());
    }

    public void notifyGeneralAnnouncement(ChatThread thread, ChatMessage message) {
        messagingTemplate.convertAndSend("/topic/general/notifications", message.getContent());

        Long senderId = message.getSender() != null ? message.getSender().getId() : null;
        List<User> recipients = userRepository.findAllActiveUsers();

        recipients.stream()
                .filter(recipient -> senderId == null || !senderId.equals(recipient.getId()))
                .forEach(recipient -> {
                    ChatNotification notification = ChatNotification.builder()
                            .type(ChatNotification.NotificationType.GENERAL_ANNOUNCEMENT)
                            .recipient(recipient)
                            .threadId(thread.getId())
                            .messageId(message.getId())
                            .payload(message.isAttachmentMessage() && message.getAttachment() != null
                                    ? message.getAttachment().getFileName()
                                    : message.getContent())
                            .delivered(false)
                            .read(false)
                            .build();

                    notificationRepository.save(notification);
                    dispatch(notification, recipient.getId());
                });
    }

    public void markDelivered(ChatNotification notification) {
        notification.setDelivered(true);
        LocalDateTime now = LocalDateTime.now();
        notification.setDeliveredAt(now);
        notificationRepository.save(notification);
        if (notification.getMessageId() != null) {
            messageRepository.findById(notification.getMessageId()).ifPresent(message -> {
                if (message.getDeliveredAt() == null) {
                    message.setDeliveredAt(now);
                    messageRepository.save(message);
                }
            });
        }
    }

    public void markRead(ChatNotification notification) {
        notification.setRead(true);
        LocalDateTime now = LocalDateTime.now();
        notification.setReadAt(now);
        notificationRepository.save(notification);
        if (notification.getMessageId() != null) {
            messageRepository.findById(notification.getMessageId()).ifPresent(message -> {
                if (message.getDeliveredAt() == null) {
                    message.setDeliveredAt(now);
                }
                if (!notificationRepository.existsByMessageIdAndReadFalse(notification.getMessageId())) {
                    message.setReadAt(now);
                }
                messageRepository.save(message);
            });
        }
    }

    private void dispatch(ChatNotification notification, Long userId) {
        try {
            messagingTemplate.convertAndSend("/topic/user." + userId + ".notifications", notification);
            markDelivered(notification);
        } catch (Exception ex) {
            log.warn("Failed to dispatch notification to user={} notificationId={} error={}",
                    userId, notification.getId(), ex.getMessage(), ex);
        }
    }
}
