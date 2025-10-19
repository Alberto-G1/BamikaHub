package com.bamikahub.inventorysystem.dao.support;

import com.bamikahub.inventorysystem.models.support.SupportTicket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SupportTicketRepository extends JpaRepository<SupportTicket, Long>, JpaSpecificationExecutor<SupportTicket> {
	long countByStatus(SupportTicket.TicketStatus status);
	long countByCategory_Name(String name);
	long countByResolutionBreachedFalseAndStatus(SupportTicket.TicketStatus status);
	long countByPriority(SupportTicket.TicketPriority priority);
	List<SupportTicket> findByStatusIn(List<SupportTicket.TicketStatus> statuses);
}