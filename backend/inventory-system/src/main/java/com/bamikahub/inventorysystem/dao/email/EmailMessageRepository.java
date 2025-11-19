package com.bamikahub.inventorysystem.dao.email;

import com.bamikahub.inventorysystem.models.email.EmailMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

@Repository
public interface EmailMessageRepository extends JpaRepository<EmailMessage, Long> {
	long countByCreatedByIdAndCreatedAtAfter(Long createdById, LocalDateTime after);
}
