package com.bamikahub.inventorysystem.help;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HelpCenterSupportTicketRepository extends JpaRepository<SupportTicket, Long> {

    Page<SupportTicket> findByUserIdOrderByCreatedAtDesc(String userId, Pageable pageable);

    Page<SupportTicket> findByStatusOrderByCreatedAtDesc(SupportTicket.TicketStatus status, Pageable pageable);

    Page<SupportTicket> findByAssignedToOrderByCreatedAtDesc(String assignedTo, Pageable pageable);

    Page<SupportTicket> findByUserIdAndStatusOrderByCreatedAtDesc(String userId, SupportTicket.TicketStatus status, Pageable pageable);

    @Query("SELECT COUNT(t) FROM HelpCenterSupportTicket t WHERE t.status IN ('OPEN', 'IN_PROGRESS', 'WAITING_FOR_USER')")
    Long countOpenTickets();

    @Query("SELECT COUNT(t) FROM HelpCenterSupportTicket t WHERE t.userId = :userId AND t.status IN ('OPEN', 'IN_PROGRESS', 'WAITING_FOR_USER')")
    Long countOpenTicketsByUser(@Param("userId") String userId);

    List<SupportTicket> findByTicketNumber(String ticketNumber);

    @Query("SELECT t FROM HelpCenterSupportTicket t WHERE LOWER(t.subject) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR LOWER(t.description) LIKE LOWER(CONCAT('%', :searchTerm, '%')) ORDER BY t.createdAt DESC")
    Page<SupportTicket> searchTickets(@Param("searchTerm") String searchTerm, Pageable pageable);
}