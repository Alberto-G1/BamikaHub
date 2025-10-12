package com.bamikahub.inventorysystem.dao.user;

import com.bamikahub.inventorysystem.models.user.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface RoleRepository extends JpaRepository<Role, Integer> {
    Optional<Role> findByName(String name);
}