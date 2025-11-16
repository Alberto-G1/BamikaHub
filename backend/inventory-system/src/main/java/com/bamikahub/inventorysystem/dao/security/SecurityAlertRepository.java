package com.bamikahub.inventorysystem.dao.security;

import com.bamikahub.inventorysystem.models.security.SecurityAlert;
import com.bamikahub.inventorysystem.models.user.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SecurityAlertRepository extends JpaRepository<SecurityAlert, Long> {

    Page<SecurityAlert> findByUserOrderByCreatedAtDesc(User user, Pageable pageable);

    Page<SecurityAlert> findByUserAndAcknowledgedOrderByCreatedAtDesc(User user, boolean acknowledged, Pageable pageable);

    @Query("SELECT sa FROM SecurityAlert sa WHERE sa.user = :user AND sa.severity IN :severities ORDER BY sa.createdAt DESC")
    Page<SecurityAlert> findByUserAndSeverityIn(User user, List<String> severities, Pageable pageable);

    long countByUserAndAcknowledged(User user, boolean acknowledged);

    @Query("SELECT sa FROM SecurityAlert sa WHERE sa.createdAt >= :since AND sa.acknowledged = false ORDER BY sa.createdAt DESC")
    List<SecurityAlert> findUnacknowledgedAlertsSince(LocalDateTime since);
}