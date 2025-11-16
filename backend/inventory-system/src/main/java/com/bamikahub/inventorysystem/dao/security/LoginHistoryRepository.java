package com.bamikahub.inventorysystem.dao.security;

import com.bamikahub.inventorysystem.models.security.LoginHistory;
import com.bamikahub.inventorysystem.models.user.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface LoginHistoryRepository extends JpaRepository<LoginHistory, Long> {

    Page<LoginHistory> findByUserOrderByLoginTimeDesc(User user, Pageable pageable);

    @Query("SELECT lh FROM LoginHistory lh WHERE lh.user = :user AND lh.successful = false ORDER BY lh.loginTime DESC")
    List<LoginHistory> findFailedLoginAttemptsByUser(User user);

    @Query("SELECT COUNT(lh) FROM LoginHistory lh WHERE lh.user = :user AND lh.successful = false AND lh.loginTime >= :since")
    long countFailedLoginAttemptsSince(User user, LocalDateTime since);

    @Query("SELECT lh FROM LoginHistory lh WHERE lh.ipAddress = :ipAddress ORDER BY lh.loginTime DESC")
    List<LoginHistory> findByIpAddress(String ipAddress);
}