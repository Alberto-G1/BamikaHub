package com.bamikahub.inventorysystem.dao.chat;

import com.bamikahub.inventorysystem.models.chat.ChatMessage;
import com.bamikahub.inventorysystem.models.chat.ChatThread;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    Page<ChatMessage> findByThreadOrderBySentAtDesc(ChatThread thread, Pageable pageable);

    @Query("SELECT cm FROM ChatMessage cm WHERE cm.thread = :thread AND cm.sentAt < :before ORDER BY cm.sentAt DESC")
    Page<ChatMessage> findPreviousMessages(@Param("thread") ChatThread thread,
                                           @Param("before") LocalDateTime before,
                                           Pageable pageable);

    @Query("SELECT cm FROM ChatMessage cm WHERE cm.thread = :thread AND cm.deleted = false AND (LOWER(cm.content) LIKE LOWER(CONCAT('%', :keyword, '%'))) ORDER BY cm.sentAt DESC")
    List<ChatMessage> searchMessages(@Param("thread") ChatThread thread, @Param("keyword") String keyword, Pageable pageable);
}
