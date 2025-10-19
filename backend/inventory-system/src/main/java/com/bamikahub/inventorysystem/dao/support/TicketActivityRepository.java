package com.bamikahub.inventorysystem.dao.support;

import com.bamikahub.inventorysystem.models.support.TicketActivity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TicketActivityRepository extends JpaRepository<TicketActivity, Long>, JpaSpecificationExecutor<TicketActivity> {
    List<TicketActivity> findByTicketIdOrderByCreatedAtAsc(Long ticketId);
}
