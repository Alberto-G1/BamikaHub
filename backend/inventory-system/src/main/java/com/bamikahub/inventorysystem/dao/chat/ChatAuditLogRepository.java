package com.bamikahub.inventorysystem.dao.chat;

import com.bamikahub.inventorysystem.models.chat.ChatAuditLog;
import com.bamikahub.inventorysystem.models.chat.ChatAuditLog.AuditAction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface ChatAuditLogRepository extends JpaRepository<ChatAuditLog, Long> {

    @Query("SELECT cal FROM ChatAuditLog cal WHERE (:action IS NULL OR cal.action = :action) AND (:channel IS NULL OR cal.channel = :channel) AND (:from IS NULL OR cal.createdAt >= :from) AND (:to IS NULL OR cal.createdAt <= :to) ORDER BY cal.createdAt DESC")
    List<ChatAuditLog> findByFilters(@Param("action") AuditAction action,
                                     @Param("channel") String channel,
                                     @Param("from") LocalDateTime from,
                                     @Param("to") LocalDateTime to);
}
