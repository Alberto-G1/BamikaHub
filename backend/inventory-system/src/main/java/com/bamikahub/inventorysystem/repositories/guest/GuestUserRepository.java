package com.bamikahub.inventorysystem.repositories.guest;

import com.bamikahub.inventorysystem.models.guest.GuestUser;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface GuestUserRepository extends JpaRepository<GuestUser, Long> {

    Optional<GuestUser> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);

    Optional<GuestUser> findByVerificationToken(String verificationToken);
}
