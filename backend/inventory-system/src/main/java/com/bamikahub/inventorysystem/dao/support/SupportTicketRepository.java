package com.bamikahub.inventorysystem.dao.support;

import com.bamikahub.inventorysystem.models.support.SupportTicket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SupportTicketRepository extends JpaRepository<SupportTicket, Long> {}