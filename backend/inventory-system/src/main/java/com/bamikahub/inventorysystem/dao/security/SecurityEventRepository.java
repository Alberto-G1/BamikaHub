package com.bamikahub.inventorysystem.dao.security;

import com.bamikahub.inventorysystem.models.security.SecurityEvent;
import com.bamikahub.inventorysystem.models.user.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SecurityEventRepository extends JpaRepository<SecurityEvent, Long> {

    List<SecurityEvent> findByUserOrderByCreatedAtDesc(User user);

    Page<SecurityEvent> findByUserOrderByCreatedAtDesc(User user, Pageable pageable);

    List<SecurityEvent> findByUserAndIsSuspiciousTrueOrderByCreatedAtDesc(User user);

    List<SecurityEvent> findByUserAndRequiresActionTrueOrderByCreatedAtDesc(User user);

    @Query("SELECT e FROM SecurityEvent e WHERE e.user = :user AND e.createdAt >= :since ORDER BY e.createdAt DESC")
    List<SecurityEvent> findRecentEventsByUser(@Param("user") User user, @Param("since") LocalDateTime since);

    @Query("SELECT e FROM SecurityEvent e WHERE e.isSuspicious = true AND e.requiresAction = true ORDER BY e.createdAt DESC")
    List<SecurityEvent> findAllSuspiciousEventsRequiringAction();

    @Query("SELECT COUNT(e) FROM SecurityEvent e WHERE e.user = :user AND e.eventType = :eventType AND e.createdAt >= :since")
    long countEventsByTypeAndUser(@Param("user") User user, @Param("eventType") String eventType, @Param("since") LocalDateTime since);

    @Query("SELECT COUNT(e) FROM SecurityEvent e WHERE e.user = :user AND e.isSuspicious = true AND e.createdAt >= :since")
    long countSuspiciousEventsByUser(@Param("user") User user, @Param("since") LocalDateTime since);
}
