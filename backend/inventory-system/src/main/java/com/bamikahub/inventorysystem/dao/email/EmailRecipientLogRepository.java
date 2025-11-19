package com.bamikahub.inventorysystem.dao.email;

import com.bamikahub.inventorysystem.models.email.EmailRecipientLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EmailRecipientLogRepository extends JpaRepository<EmailRecipientLog, Long> {
    List<EmailRecipientLog> findByEmailMessageId(Long messageId);
}
