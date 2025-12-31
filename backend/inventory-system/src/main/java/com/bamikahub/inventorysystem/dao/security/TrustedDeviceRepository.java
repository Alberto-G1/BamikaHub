package com.bamikahub.inventorysystem.dao.security;

import com.bamikahub.inventorysystem.models.security.TrustedDevice;
import com.bamikahub.inventorysystem.models.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TrustedDeviceRepository extends JpaRepository<TrustedDevice, Long> {

    Optional<TrustedDevice> findByDeviceFingerprint(String deviceFingerprint);

    Optional<TrustedDevice> findByDeviceFingerprintAndIsActiveTrue(String deviceFingerprint);

    List<TrustedDevice> findByUserAndIsActiveTrue(User user);

    List<TrustedDevice> findByUserOrderByTrustedAtDesc(User user);

    @Query("SELECT COUNT(d) FROM TrustedDevice d WHERE d.user = :user AND d.isActive = true")
    long countActiveTrustedDevicesByUser(@Param("user") User user);

    boolean existsByDeviceFingerprintAndIsActiveTrue(String deviceFingerprint);
}
