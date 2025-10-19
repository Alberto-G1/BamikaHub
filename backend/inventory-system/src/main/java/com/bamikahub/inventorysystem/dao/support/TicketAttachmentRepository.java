package com.bamikahub.inventorysystem.dao.support;

import com.bamikahub.inventorysystem.models.support.TicketAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TicketAttachmentRepository extends JpaRepository<TicketAttachment, Long> {}