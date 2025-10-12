package com.bamikahub.inventorysystem.dao.user;

import com.bamikahub.inventorysystem.models.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);

    // Using @Query to automatically filter out soft-deleted users
    // Find all users that are NOT deactivated
    @Query("select u from User u where u.status.name <> 'DEACTIVATED'")
    List<User> findAllActiveUsers();

    // Find all users that ARE deactivated
    @Query("select u from User u where u.status.name = 'DEACTIVATED'")
    List<User> findAllDeactivatedUsers();
}