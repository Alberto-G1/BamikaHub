package com.bamikahub.inventorysystem.dao.chat;

import com.bamikahub.inventorysystem.models.chat.ChatAttachment;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ChatAttachmentRepository extends JpaRepository<ChatAttachment, Long> {
}
