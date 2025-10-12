package com.bamikahub.inventorysystem.dao.user;

import com.bamikahub.inventorysystem.models.user.Status;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface StatusRepository extends JpaRepository<Status, Integer> {
    Optional<Status> findByName(String name);
}