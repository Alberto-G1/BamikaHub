package com.bamikahub.inventorysystem.repositories.guest;

import com.bamikahub.inventorysystem.models.guest.GuestTicket;
import com.bamikahub.inventorysystem.models.guest.GuestTicketStatus;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface GuestTicketRepository extends JpaRepository<GuestTicket, Long> {

    List<GuestTicket> findAllByGuestIdOrderByCreatedAtDesc(Long guestId);

    List<GuestTicket> findAllByStatusOrderByCreatedAtAsc(GuestTicketStatus status);
}
