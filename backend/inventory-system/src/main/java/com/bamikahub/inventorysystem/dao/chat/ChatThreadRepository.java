package com.bamikahub.inventorysystem.dao.chat;

import com.bamikahub.inventorysystem.models.chat.ChatThread;
import com.bamikahub.inventorysystem.models.chat.ChatThread.ThreadType;
import com.bamikahub.inventorysystem.models.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ChatThreadRepository extends JpaRepository<ChatThread, Long> {

    @Query("SELECT ct FROM ChatThread ct JOIN ct.participants p WHERE ct.type = :type AND p = :user ORDER BY ct.lastMessageAt DESC NULLS LAST, ct.updatedAt DESC")
    List<ChatThread> findByParticipantAndType(@Param("user") User user, @Param("type") ThreadType type);

    @Query("SELECT ct FROM ChatThread ct WHERE ct.type = 'GENERAL'")
    Optional<ChatThread> findGeneralThread();

    @Query("SELECT ct FROM ChatThread ct JOIN ct.participants p1 JOIN ct.participants p2 WHERE ct.type = 'PRIVATE' AND p1.id = :userId AND p2.id = :otherUserId")
    Optional<ChatThread> findPrivateThreadBetween(@Param("userId") Long userId, @Param("otherUserId") Long otherUserId);
}
