package com.bamikahub.inventorysystem.repositories.guest;

import com.bamikahub.inventorysystem.models.guest.GuestTicketMessage;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface GuestTicketMessageRepository extends JpaRepository<GuestTicketMessage, Long> {

    List<GuestTicketMessage> findAllByTicketIdOrderByCreatedAtAsc(Long ticketId);
}
