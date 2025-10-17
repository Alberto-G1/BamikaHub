package com.bamikahub.inventorysystem.dao.support;

import com.bamikahub.inventorysystem.models.support.TicketComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TicketCommentRepository extends JpaRepository<TicketComment, Long> {}