package com.bamikahub.inventorysystem.dao.security;

import com.bamikahub.inventorysystem.models.security.UserSession;
import com.bamikahub.inventorysystem.models.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserSessionRepository extends JpaRepository<UserSession, Long> {

    Optional<UserSession> findBySessionToken(String sessionToken);

    List<UserSession> findByUserAndIsActiveTrue(User user);

    List<UserSession> findByUserOrderByCreatedAtDesc(User user);

    @Query("SELECT s FROM UserSession s WHERE s.user = :user AND s.isActive = true AND s.expiresAt > :now")
    List<UserSession> findActiveSessionsByUser(@Param("user") User user, @Param("now") LocalDateTime now);

    @Modifying
    @Query("UPDATE UserSession s SET s.isActive = false, s.terminatedAt = :terminatedAt, s.terminationReason = :reason WHERE s.user = :user AND s.isActive = true")
    void terminateAllUserSessions(@Param("user") User user, @Param("terminatedAt") LocalDateTime terminatedAt, @Param("reason") String reason);

    @Modifying
    @Query("UPDATE UserSession s SET s.isActive = false, s.terminatedAt = :terminatedAt, s.terminationReason = :reason WHERE s.expiresAt < :now AND s.isActive = true")
    int terminateExpiredSessions(@Param("now") LocalDateTime now, @Param("terminatedAt") LocalDateTime terminatedAt, @Param("reason") String reason);

    @Query("SELECT COUNT(s) FROM UserSession s WHERE s.user = :user AND s.isActive = true")
    long countActiveSessionsByUser(@Param("user") User user);

    Optional<UserSession> findByDeviceFingerprintAndIsActiveTrue(String deviceFingerprint);
}
