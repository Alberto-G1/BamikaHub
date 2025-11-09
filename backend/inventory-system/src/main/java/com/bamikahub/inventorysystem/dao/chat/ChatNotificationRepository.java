package com.bamikahub.inventorysystem.dao.chat;

import com.bamikahub.inventorysystem.models.chat.ChatNotification;
import com.bamikahub.inventorysystem.models.user.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChatNotificationRepository extends JpaRepository<ChatNotification, Long> {

    List<ChatNotification> findByRecipientAndDeliveredFalse(User recipient);

    List<ChatNotification> findByRecipientAndReadFalse(User recipient);

    List<ChatNotification> findByRecipientAndThreadIdAndReadFalseAndMessageIdLessThanEqual(User recipient, Long threadId, Long messageId);

    long countByRecipientIdAndThreadIdAndReadFalse(Long recipientId, Long threadId);

    boolean existsByMessageIdAndReadFalse(Long messageId);
}
