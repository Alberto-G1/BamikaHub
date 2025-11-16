package com.bamikahub.inventorysystem.help;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TicketMessageRepository extends JpaRepository<TicketMessage, Long> {

    List<TicketMessage> findByTicketIdOrderByCreatedAtAsc(Long ticketId);

    @Query("SELECT m FROM TicketMessage m WHERE m.ticket.id = :ticketId AND m.isInternal = false ORDER BY m.createdAt ASC")
    List<TicketMessage> findPublicMessagesByTicketId(@Param("ticketId") Long ticketId);

    @Query("SELECT COUNT(m) FROM TicketMessage m WHERE m.ticket.id = :ticketId AND m.isInternal = false")
    Long countPublicMessagesByTicketId(@Param("ticketId") Long ticketId);

    List<TicketMessage> findByTicketIdAndIsInternalFalseOrderByCreatedAtDesc(Long ticketId);
}